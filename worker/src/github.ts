/**
 * Opening the pull request, as a GitHub App rather than as a person.
 *
 * The App is installed on this repository alone and holds Contents and Pull
 * requests write, and nothing else — in particular not Workflows, so a
 * submission cannot reach CI. Its installation token lasts an hour and is minted
 * per request from a signed JWT, so the Worker stores a key rather than a
 * standing credential, and revoking the App revokes everything at once.
 */

const encoder = new TextEncoder();

const API = 'https://api.github.com';

const toBase64Url = (input: string | Uint8Array): string => {
  const binary =
    typeof input === 'string' ? input : String.fromCharCode(...(input as unknown as number[]));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Turn the App's PEM into a signing key.
 *
 * GitHub hands out PKCS#1 ("BEGIN RSA PRIVATE KEY"); WebCrypto imports only
 * PKCS#8 ("BEGIN PRIVATE KEY"). Converting is a one-line openssl invocation at
 * setup time, and getting it wrong produces an opaque import failure, so say so
 * clearly rather than letting it surface as "invalid key".
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  if (pem.includes('BEGIN RSA PRIVATE KEY')) {
    throw new Error(
      'GITHUB_PRIVATE_KEY is in PKCS#1 format. Convert it first: ' +
        'openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in key.pem -out key.pkcs8.pem'
    );
  }

  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const der = Uint8Array.from(atob(body), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/** A short-lived RS256 JWT identifying the App itself. */
export async function appJwt(appId: string, privateKeyPem: string, nowSeconds: number): Promise<string> {
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = toBase64Url(
    JSON.stringify({
      // Backdated by a minute: GitHub rejects a token whose iat is in its future,
      // and a little clock drift between Cloudflare and GitHub is normal.
      iat: nowSeconds - 60,
      exp: nowSeconds + 540,
      iss: appId,
    })
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    await importPrivateKey(privateKeyPem),
    encoder.encode(`${header}.${claims}`)
  );

  return `${header}.${claims}.${toBase64Url(new Uint8Array(signature))}`;
}

export interface GitHubClient {
  request<T = unknown>(method: string, path: string, body?: unknown): Promise<T>;
}

/** Exchange the App JWT for a token scoped to this installation. */
export async function installationToken(
  jwt: string,
  installationId: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const response = await fetchImpl(`${API}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'shifting-corridors-submissions',
    },
  });

  if (!response.ok) {
    throw new Error(`could not mint an installation token (${response.status})`);
  }

  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error('installation token response had no token');
  return body.token;
}

export function client(token: string, fetchImpl: typeof fetch = fetch): GitHubClient {
  return {
    async request<T>(method: string, path: string, body?: unknown): Promise<T> {
      const response = await fetchImpl(`${API}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'shifting-corridors-submissions',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (!response.ok) {
        const detail = await response.text();
        const error = new Error(`GitHub ${method} ${path} failed (${response.status}): ${detail}`);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      return (await response.json()) as T;
    },
  };
}

export interface SubmissionRequest {
  repo: string;
  baseBranch: string;
  branch: string;
  path: string;
  markdown: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
}

/**
 * How many submissions are already waiting, counted by branch prefix.
 *
 * Labelling each pull request would read a little better in the list, but
 * applying a label goes through the Issues API, which would mean granting the
 * App a third write permission for something cosmetic. The branch name is just
 * as visible and costs no permission.
 */
export async function countOpenSubmissions(
  gh: GitHubClient,
  repo: string,
  prefix: string
): Promise<number> {
  const pulls = await gh.request<Array<{ head?: { ref?: string } }>>(
    'GET',
    `/repos/${repo}/pulls?state=open&per_page=100`
  );
  return pulls.filter(p => (p.head?.ref ?? '').startsWith(prefix)).length;
}

/** True when the path is already taken, so a slug can be nudged rather than clobbering. */
export async function fileExists(gh: GitHubClient, repo: string, path: string, ref: string): Promise<boolean> {
  try {
    await gh.request('GET', `/repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`);
    return true;
  } catch (error) {
    if ((error as Error & { status?: number }).status === 404) return false;
    throw error;
  }
}

/**
 * Create the branch, commit the single file, open the pull request.
 *
 * The file is written with the Contents API without a `sha`, which GitHub
 * refuses if the path already exists. That refusal is the backstop against a
 * submission overwriting an existing event: even if the slug check above raced,
 * the write fails rather than replacing anything.
 */
export async function openSubmissionPr(
  gh: GitHubClient,
  request: SubmissionRequest
): Promise<{ number: number; url: string }> {
  const { repo, baseBranch, branch, path, markdown, commitMessage, prTitle, prBody } = request;

  const base = await gh.request<{ object: { sha: string } }>(
    'GET',
    `/repos/${repo}/git/ref/heads/${baseBranch}`
  );

  await gh.request('POST', `/repos/${repo}/git/refs`, {
    ref: `refs/heads/${branch}`,
    sha: base.object.sha,
  });

  await gh.request('PUT', `/repos/${repo}/contents/${path}`, {
    message: commitMessage,
    // The Contents API wants base64, and the markdown may carry non-ASCII --
    // an apostrophe in a scenario name is enough to break a naive btoa.
    content: base64Utf8(markdown),
    branch,
  });

  const pull = await gh.request<{ number: number; html_url: string }>('POST', `/repos/${repo}/pulls`, {
    title: prTitle,
    body: prBody,
    head: branch,
    base: baseBranch,
  });

  return { number: pull.number, url: pull.html_url };
}

/** base64 of a UTF-8 string, which btoa alone cannot do. */
export function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
