import { describe, test, expect, vi, beforeEach } from 'vitest';

import worker, { type Env } from '../../worker/src/index';
import { signInvite, verifyInvite, isRevoked, type KVLike } from '../../worker/src/auth';
import { base64Utf8, countOpenSubmissions } from '../../worker/src/github';
import { verifyTurnstile } from '../../worker/src/turnstile';

const SECRET = 'test-invite-secret';
const ORIGIN = 'https://shiftingcorridors.com';

const nowSeconds = () => Math.floor(Date.now() / 1000);

/** In-memory stand-in for the KV binding. */
function fakeKv(initial: Record<string, string> = {}): KVLike & { store: Map<string, string> } {
  const store = new Map(Object.entries(initial));
  return {
    store,
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

const allowAll = { limit: async () => ({ success: true }) };
const denyAll = { limit: async () => ({ success: false }) };

const goodEvent = () => ({
  title: 'Pathfinder Society at Tempest Games',
  date: futureDate(),
  location: 'Tempest Games',
  startTime: '17:30',
  endTime: '21:30',
  playerCap: 6,
  scenarios: [
    {
      name: 'The Winter Queen’s Dollhouse',
      system: 'Pathfinder',
      type: 'Scenario',
      levels: '1-4',
      signupUrl: 'https://www.rpgchronicles.net/session/abc/pregame',
    },
  ],
});

function futureDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
}

/**
 * A GitHub that answers the five calls a submission makes, recording them so a
 * test can assert what would have been written.
 */
function fakeGitHub(options: { existingPaths?: string[]; openSubmissions?: number } = {}) {
  const calls: Array<{ method: string; url: string; body: unknown }> = [];
  const existing = new Set(options.existingPaths ?? []);

  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const href = String(url);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, url: href, body });

    const ok = (payload: unknown, status = 200) =>
      new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });

    if (href.includes('/access_tokens')) return ok({ token: 'ghs_faketoken' });

    if (href.includes('/pulls?state=open')) {
      const count = options.openSubmissions ?? 0;
      return ok(Array.from({ length: count }, (_, i) => ({ head: { ref: `submission/pending-${i}` } })));
    }

    if (href.includes('/contents/') && method === 'GET') {
      const path = decodeURIComponent(href.split('/contents/')[1].split('?')[0]);
      return existing.has(path)
        ? ok({ path })
        : new Response('{"message":"Not Found"}', { status: 404 });
    }

    if (href.includes('/git/ref/heads/')) return ok({ object: { sha: 'basesha' } });
    if (href.includes('/git/refs') && method === 'POST') return ok({}, 201);
    if (href.includes('/contents/') && method === 'PUT') return ok({ commit: { sha: 'newsha' } }, 201);
    if (href.endsWith('/pulls') && method === 'POST') {
      return ok({ number: 42, html_url: 'https://github.com/o/r/pull/42' }, 201);
    }

    return new Response('unexpected', { status: 500 });
  }) as unknown as typeof fetch;

  return { fetchImpl, calls };
}

/**
 * A private key for signing the App JWT.
 *
 * Generated per run rather than checked in, so nothing that looks like a
 * credential lives in the repository.
 */
async function testPrivateKeyPem(): Promise<string> {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  const b64 = Buffer.from(pkcs8).toString('base64').replace(/(.{64})/g, '$1\n');
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n`;
}

let privateKey: string;

beforeEach(async () => {
  privateKey ??= await testPrivateKeyPem();
});

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    REVOKED: fakeKv(),
    RATE_LIMIT_IP: allowAll,
    RATE_LIMIT_GLOBAL: allowAll,
    INVITE_SECRET: SECRET,
    TURNSTILE_SECRET: 'turnstile-secret',
    GITHUB_PRIVATE_KEY: privateKey,
    GITHUB_APP_ID: '4970413',
    GITHUB_INSTALLATION_ID: '162308437',
    GITHUB_REPO: 'martyjhenderson/shifting-corridors-site',
    BASE_BRANCH: 'main',
    ALLOWED_ORIGINS: `${ORIGIN},https://dev.shiftingcorridors.com`,
    DAILY_LIMIT: '10',
    MAX_OPEN_SUBMISSIONS: '10',
    ...overrides,
  } as Env;
}

async function post(body: unknown, env: Env, origin: string | null = ORIGIN): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  headers['CF-Connecting-IP'] = '203.0.113.9';

  return worker.fetch(
    new Request('https://sc-event-submissions.ravegrunt.workers.dev/', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
    env
  );
}

/** A submission that should succeed, which each test then breaks in one way. */
async function goodBody(overrides: Record<string, unknown> = {}) {
  return {
    token: await signInvite({ gm: 'eli-f', exp: nowSeconds() + 3600 }, SECRET),
    turnstileToken: 'turnstile-ok',
    elapsedMs: 45_000,
    event: goodEvent(),
    ...overrides,
  };
}

/** Turnstile always says yes, unless a test says otherwise. */
function stubTurnstile(success = true) {
  const original = globalThis.fetch;
  vi.spyOn(globalThis, 'fetch').mockImplementation((async (url: string | URL | Request, init?: RequestInit) => {
    if (String(url).includes('turnstile')) {
      return new Response(JSON.stringify({ success }), { status: 200 });
    }
    return original(url as RequestInfo, init);
  }) as typeof fetch);
}

describe('invite tokens', () => {
  test('a token round-trips', async () => {
    const token = await signInvite({ gm: 'eli-f', exp: nowSeconds() + 60 }, SECRET);
    expect(await verifyInvite(token, SECRET, nowSeconds())).toEqual({ ok: true, gm: 'eli-f' });
  });

  test('a token signed with another secret is rejected', async () => {
    const token = await signInvite({ gm: 'eli-f', exp: nowSeconds() + 60 }, 'someone-elses-secret');
    expect(await verifyInvite(token, SECRET, nowSeconds())).toMatchObject({ reason: 'bad-signature' });
  });

  // The payload is readable, so the obvious attack is to rewrite it.
  test('editing the payload invalidates the signature', async () => {
    const token = await signInvite({ gm: 'eli-f', exp: nowSeconds() + 60 }, SECRET);
    const [, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ gm: 'eli-f', exp: 9_999_999_999 }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(await verifyInvite(`${forged}.${signature}`, SECRET, nowSeconds())).toMatchObject({
      reason: 'bad-signature',
    });
  });

  test('an expired token is rejected, and says so', async () => {
    const token = await signInvite({ gm: 'eli-f', exp: nowSeconds() - 1 }, SECRET);
    expect(await verifyInvite(token, SECRET, nowSeconds())).toMatchObject({ reason: 'expired' });
  });

  test.each([
    ['empty', ''],
    ['no signature', 'abc'],
    ['too many parts', 'a.b.c'],
    ['not base64url', '!!!.???'],
    ['not a string', 42],
    ['absurdly long', 'a'.repeat(4096)],
  ])('a %s token is rejected', async (_label, token) => {
    expect((await verifyInvite(token, SECRET, nowSeconds())).ok).toBe(false);
  });

  test('a gm slug that could escape a path is rejected', async () => {
    const body = Buffer.from(JSON.stringify({ gm: '../../etc', exp: nowSeconds() + 60 }))
      .toString('base64url');
    const { createHmac } = await import('crypto');
    const sig = createHmac('sha256', SECRET).update(body).digest('base64url');
    expect((await verifyInvite(`${body}.${sig}`, SECRET, nowSeconds())).ok).toBe(false);
  });

  test('revocation is read from KV', async () => {
    const kv = fakeKv({ 'revoked:scott-l': 'left' });
    expect(await isRevoked(kv, 'scott-l')).toBe(true);
    expect(await isRevoked(kv, 'eli-f')).toBe(false);
  });
});

describe('the endpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    stubTurnstile(true);
  });

  test('rejects a request from an origin that is not ours', async () => {
    const response = await post(await goodBody(), makeEnv(), 'https://evil.test');
    expect(response.status).toBe(403);
  });

  test('rejects a request with no Origin at all', async () => {
    const response = await post(await goodBody(), makeEnv(), null);
    expect(response.status).toBe(403);
  });

  test('answers OPTIONS with CORS headers', async () => {
    const response = await worker.fetch(
      new Request('https://w/', { method: 'OPTIONS', headers: { Origin: ORIGIN } }),
      makeEnv()
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  test('rejects an unsigned token', async () => {
    const response = await post(await goodBody({ token: 'made.up' }), makeEnv());
    expect(response.status).toBe(403);
    expect((await response.json()).message).toBe('This link is not valid.');
  });

  test('tells a Game Master when their link has merely expired', async () => {
    const token = await signInvite({ gm: 'eli-f', exp: nowSeconds() - 10 }, SECRET);
    const response = await post(await goodBody({ token }), makeEnv());
    expect(response.status).toBe(403);
    expect((await response.json()).message).toMatch(/expired/i);
  });

  test('rejects a revoked Game Master', async () => {
    const env = makeEnv({ REVOKED: fakeKv({ 'revoked:eli-f': 'left the lodge' }) });
    const response = await post(await goodBody(), env);
    expect(response.status).toBe(403);
  });

  // Answering 200 means a bot sees success and does not retry or adapt. The
  // assertion that matters -- that nothing was written -- is in the block below,
  // where GitHub is actually stubbed.
  test('answers a honeypot submission as though it worked', async () => {
    const response = await post(await goodBody({ website: 'http://spam.test' }), makeEnv());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, url: null });
  });

  test.each([
    ['instant', 10],
    ['stale', 3 * 60 * 60 * 1000],
    ['missing', undefined],
  ])('rejects a %s fill time', async (_label, elapsedMs) => {
    const response = await post(await goodBody({ elapsedMs }), makeEnv());
    expect(response.status).toBe(400);
  });

  test('rejects when the burst limiter says no', async () => {
    const response = await post(await goodBody(), makeEnv({ RATE_LIMIT_IP: denyAll }));
    expect(response.status).toBe(429);
  });

  test('rejects when Turnstile says no', async () => {
    vi.restoreAllMocks();
    stubTurnstile(false);
    const response = await post(await goodBody(), makeEnv());
    expect(response.status).toBe(403);
  });

  test('rejects a submission that fails validation, and says what to fix', async () => {
    const event = { ...goodEvent(), location: 'My House' };
    const response = await post(await goodBody({ event }), makeEnv());
    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.errors.join(' ')).toMatch(/location/);
  });

  test('rejects a signup link to somewhere we do not know', async () => {
    const event = goodEvent();
    event.scenarios[0].signupUrl = 'https://evil.test/free-money';
    const response = await post(await goodBody({ event }), makeEnv());
    expect(response.status).toBe(422);
  });

  test('stops once the daily cap is reached', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const env = makeEnv({ REVOKED: fakeKv({ [`count:eli-f:${today}`]: '10' }) });
    const response = await post(await goodBody(), env);
    expect(response.status).toBe(429);
  });
});

describe('what actually gets written', () => {
  beforeEach(() => vi.restoreAllMocks());

  /** Run a submission against a fake GitHub and return the calls it made. */
  async function submitAgainst(
    body: unknown,
    options: Parameters<typeof fakeGitHub>[0] = {},
    env: Env = makeEnv()
  ) {
    const github = fakeGitHub(options);
    const original = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation((async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('turnstile')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (String(url).includes('api.github.com')) return github.fetchImpl(url, init);
      return original(url as RequestInfo, init);
    }) as typeof fetch);

    const response = await post(body, env);
    return { response, calls: github.calls };
  }

  test('opens a pull request with exactly one file', async () => {
    const { response, calls } = await submitAgainst(await goodBody());

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ ok: true, url: 'https://github.com/o/r/pull/42' });

    const writes = calls.filter(c => c.method === 'PUT' && c.url.includes('/contents/'));
    expect(writes).toHaveLength(1);
  });

  test('writes inside src/content/calendar and nowhere else', async () => {
    const { calls } = await submitAgainst(await goodBody());
    const write = calls.find(c => c.method === 'PUT')!;

    expect(write.url).toContain('/contents/src/content/calendar/');
    expect(write.url).not.toContain('..');
  });

  test.each([
    ['../../../package.json', 'package-json'],
    ['.github/workflows/deploy.yml', 'github-workflows-deploy-yml'],
    ['../../src/App.tsx', 'src-app-tsx'],
  ])('a title aiming at %s is reduced to a harmless slug', async (title, expected) => {
    const event = { ...goodEvent(), title };
    const { response, calls } = await submitAgainst(await goodBody({ event }));

    expect(response.status).toBe(201);

    const write = calls.find(c => c.method === 'PUT')!;
    expect(write.url).toBe(
      `https://api.github.com/repos/martyjhenderson/shifting-corridors-site/contents/` +
        `src/content/calendar/${futureDate()}-${expected}.md`
    );
  });

  test('nothing is written for a honeypot submission', async () => {
    const { calls } = await submitAgainst(await goodBody({ website: 'http://spam.test' }));
    expect(calls).toHaveLength(0);
  });

  test('the committed markdown survives a round trip', async () => {
    const { calls } = await submitAgainst(await goodBody());
    const write = calls.find(c => c.method === 'PUT')!;
    const markdown = Buffer.from((write.body as { content: string }).content, 'base64').toString('utf-8');

    expect(markdown).toMatch(/^---\n/);
    // Times quoted, so YAML cannot read 17:30 as the integer 1050.
    expect(markdown).toContain("startTime: '17:30'");
    // No body: the one place a submission could carry markup onto the page.
    expect(markdown.trimEnd()).toMatch(/---$/);
  });

  test('the # in the Diversions address survives', async () => {
    const event = { ...goodEvent(), location: 'Diversions' };
    const { calls } = await submitAgainst(await goodBody({ event }));
    const write = calls.find(c => c.method === 'PUT')!;
    const markdown = Buffer.from((write.body as { content: string }).content, 'base64').toString('utf-8');

    expect(markdown).toContain('#300');
    expect(markdown).toMatch(/address: '[^']*#300[^']*'/);
  });

  test('a non-ASCII scenario name is committed intact', async () => {
    const { calls } = await submitAgainst(await goodBody());
    const write = calls.find(c => c.method === 'PUT')!;
    const markdown = Buffer.from((write.body as { content: string }).content, 'base64').toString('utf-8');

    expect(markdown).toContain('Winter Queen’s Dollhouse');
  });

  test('branches under submission/, so CI and the queue count can see it', async () => {
    const { calls } = await submitAgainst(await goodBody());
    const ref = calls.find(c => c.url.includes('/git/refs') && c.method === 'POST')!;

    expect((ref.body as { ref: string }).ref).toMatch(/^refs\/heads\/submission\//);
  });

  test('sidesteps a slug that is already taken rather than overwriting', async () => {
    const date = futureDate();
    const taken = `src/content/calendar/${date}-pathfinder-society-at-tempest-games.md`;

    const { calls } = await submitAgainst(await goodBody(), { existingPaths: [taken] });
    const write = calls.find(c => c.method === 'PUT')!;

    expect(write.url).toContain(`${date}-pathfinder-society-at-tempest-games-2.md`);
  });

  test('refuses once the review queue is deep', async () => {
    const { response, calls } = await submitAgainst(await goodBody(), { openSubmissions: 10 });

    expect(response.status).toBe(429);
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0);
  });

  test('counts the submission only after it succeeds', async () => {
    const env = makeEnv();
    await submitAgainst(await goodBody(), {}, env);

    const today = new Date().toISOString().slice(0, 10);
    const kv = env.REVOKED as ReturnType<typeof fakeKv>;
    expect(kv.store.get(`count:eli-f:${today}`)).toBe('1');
  });

  test('a failed submission does not use up a daily slot', async () => {
    const env = makeEnv();
    await submitAgainst(await goodBody(), { openSubmissions: 10 }, env);

    const today = new Date().toISOString().slice(0, 10);
    const kv = env.REVOKED as ReturnType<typeof fakeKv>;
    expect(kv.store.get(`count:eli-f:${today}`)).toBeUndefined();
  });

  test('names the submitting Game Master in the pull request', async () => {
    const { calls } = await submitAgainst(await goodBody());
    const pull = calls.find(c => c.url.endsWith('/pulls') && c.method === 'POST')!;

    expect((pull.body as { body: string }).body).toContain('eli-f');
  });
});

describe('helpers', () => {
  test('base64Utf8 handles characters btoa alone cannot', () => {
    const decoded = Buffer.from(base64Utf8('Winter Queen’s — café'), 'base64').toString('utf-8');
    expect(decoded).toBe('Winter Queen’s — café');
  });

  test('countOpenSubmissions counts only the submission branches', async () => {
    const gh = {
      request: async <T>() =>
        [
          { head: { ref: 'submission/a' } },
          { head: { ref: 'submission/b' } },
          { head: { ref: 'feat/something-else' } },
          { head: {} },
        ] as T,
    };
    expect(await countOpenSubmissions(gh, 'o/r', 'submission/')).toBe(2);
  });

  test('verifyTurnstile treats a network failure as a failure', async () => {
    const failing = (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    expect(await verifyTurnstile('token', 'secret', null, failing)).toBe(false);
  });

  test('verifyTurnstile rejects a missing or absurd token without calling out', async () => {
    let called = false;
    const spy = (async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;

    expect(await verifyTurnstile(undefined, 'secret', null, spy)).toBe(false);
    expect(await verifyTurnstile('x'.repeat(4096), 'secret', null, spy)).toBe(false);
    expect(called).toBe(false);
  });
});
