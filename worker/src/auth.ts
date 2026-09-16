/**
 * Who is submitting, established without anybody holding an account.
 *
 * A Game Master gets a personal link containing a token that names them and
 * expires. The token is signed with a secret only the Worker holds, so it can be
 * handed out over Discord or email and still cannot be forged or edited — a
 * recipient can read `{"gm":"eli-f"}` in it, but changing it invalidates the
 * signature.
 *
 * The identity is soft on purpose: a link can be forwarded, and nothing proves
 * the person holding it is the person it was issued to. That is the right
 * trade-off here, because the link is not a credential for anything — it
 * authorises opening a pull request that a maintainer then reads. It buys
 * attribution and it keeps drive-by bots out, and those are the two things
 * actually needed.
 */

const encoder = new TextEncoder();

export interface InvitePayload {
  /** Game Master slug, matching a file in src/content/gamemasters/. */
  gm: string;
  /** Expiry, seconds since the epoch. */
  exp: number;
}

export type InviteResult =
  | { ok: true; gm: string }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' | 'revoked' };

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/**
 * Compare two byte strings without leaking, through timing, how much of the
 * signature was correct. Overkill for this threat model, cheap enough to do.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Mint a token. Used by scripts/make-invite-link.js, never by the Worker. */
export async function signInvite(payload: InvitePayload, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Check a token's signature and expiry.
 *
 * Signature first, then expiry: an expired token is a real one that has aged
 * out, and saying so lets a GM be told "your link has expired, ask for a new
 * one" rather than something baffling. A bad signature gets no such detail.
 */
export async function verifyInvite(
  token: unknown,
  secret: string,
  nowSeconds: number
): Promise<InviteResult> {
  if (typeof token !== 'string' || token.length > 2048) return { ok: false, reason: 'malformed' };

  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };

  const [body, signature] = parts;
  const signatureBytes = fromBase64Url(signature);
  const bodyBytes = fromBase64Url(body);
  if (!signatureBytes || !bodyBytes) return { ok: false, reason: 'malformed' };

  const expected = new Uint8Array(
    await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(body))
  );
  if (!timingSafeEqual(signatureBytes, expected)) return { ok: false, reason: 'bad-signature' };

  let payload: InvitePayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(bodyBytes));
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (typeof payload?.gm !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.gm)) {
    return { ok: false, reason: 'malformed' };
  }
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    return { ok: false, reason: 'malformed' };
  }
  if (payload.exp <= nowSeconds) return { ok: false, reason: 'expired' };

  return { ok: true, gm: payload.gm };
}

/** Minimal shape of the KV binding, so this needs no Workers type package. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Revocation, for when someone leaves the lodge before their link expires.
 *
 * A present key means revoked; the value is just a note to whoever reads the
 * namespace later. Rotating INVITE_SECRET is the blunt alternative, and it
 * invalidates all eight links at once.
 */
export async function isRevoked(kv: KVLike, gm: string): Promise<boolean> {
  return (await kv.get(`revoked:${gm}`)) !== null;
}
