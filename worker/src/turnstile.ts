/**
 * Cloudflare Turnstile: "is there a person here?", without a CAPTCHA puzzle.
 *
 * The widget on the page produces a token; this exchanges it for a verdict. The
 * token is single-use and short-lived, so a captured one cannot be replayed.
 *
 * This is one layer of several, and not the load-bearing one — the invite link
 * already keeps the form from being open to the internet. Turnstile is what
 * catches a link that has been forwarded somewhere public.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
  token: unknown,
  secret: string,
  remoteIp: string | null,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (remoteIp) form.append('remoteip', remoteIp);

  let response: Response;
  try {
    response = await fetchImpl(VERIFY_URL, { method: 'POST', body: form });
  } catch {
    // A network failure reaching Cloudflare is not evidence of a human.
    return false;
  }

  if (!response.ok) return false;

  const body = (await response.json()) as { success?: boolean };
  return body.success === true;
}
