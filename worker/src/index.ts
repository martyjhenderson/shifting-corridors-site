/**
 * The event submission endpoint.
 *
 * A Game Master opens their personal link, fills in six or so fields, and this
 * turns that into a pull request. Nothing reaches the site until a maintainer
 * merges it, which is the control the rest of this file is built around: the
 * worst outcome of every check here failing at once is an unwanted pull request,
 * not a defaced calendar.
 *
 * The checks run cheapest-first, so an abusive request is refused before it
 * costs a subrequest:
 *
 *   1. origin        — noise reduction; forgeable, and treated as such
 *   2. invite token  — HMAC signature and expiry, then the KV revocation list
 *   3. honeypot      — a hidden field and a plausible fill time
 *   4. burst limit   — per-IP and global, via the native rate limiter
 *   5. Turnstile     — one network call, so it comes after the free checks
 *   6. validation    — src/shared/eventSchema.ts, shared with the site
 *   7. daily cap     — per Game Master, counted in KV
 *   8. queue depth   — how many submissions are already open, via GitHub
 *
 * Only then does anything get written.
 */

import {
  buildSlug,
  eventPath,
  validateSubmission,
  type EventMeta,
} from '../../src/shared/eventSchema';
import { buildEventMarkdown } from '../../src/shared/eventMarkdown';

import { isRevoked, verifyInvite, type KVLike } from './auth';
import {
  BranchTakenError,
  appJwt,
  client,
  countOpenSubmissions,
  existingBranches,
  fileExists,
  installationToken,
  openSubmissionPr,
} from './github';
import { verifyTurnstile } from './turnstile';

export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  REVOKED: KVLike;
  RATE_LIMIT_IP: RateLimiter;
  RATE_LIMIT_GLOBAL: RateLimiter;

  INVITE_SECRET: string;
  TURNSTILE_SECRET: string;
  GITHUB_PRIVATE_KEY: string;

  GITHUB_APP_ID: string;
  GITHUB_INSTALLATION_ID: string;
  GITHUB_REPO: string;
  BASE_BRANCH: string;
  ALLOWED_ORIGINS: string;
  /** Submissions per Game Master per day. */
  DAILY_LIMIT: string;
  /** Refuse once this many submission pull requests are already open. */
  MAX_OPEN_SUBMISSIONS: string;
}

const BRANCH_PREFIX = 'submission/';

/** Largest request body accepted, before parsing. */
const MAX_BODY_BYTES = 64 * 1024;

/** A form filled faster than this, or slower than this, did not come from a person. */
const MIN_FILL_MS = 3_000;
const MAX_FILL_MS = 2 * 60 * 60 * 1000;

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

/** Today's date in UTC, as the key suffix for the daily counter. */
const dayKey = (now: Date) => now.toISOString().slice(0, 10);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowed = env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') {
      return json({ message: 'Send a POST.' }, 405, cors);
    }

    // Not a security boundary — anything can set an Origin header — but it keeps
    // the endpoint from answering casual traffic that never saw the form.
    if (!origin || !allowed.includes(origin)) {
      return json({ message: 'This form cannot be submitted from here.' }, 403, cors);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ message: 'That submission is too large.' }, 413, cors);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return json({ message: 'That submission could not be read.' }, 400, cors);
    }

    const now = new Date();

    // --- who is this? -------------------------------------------------------
    const invite = await verifyInvite(payload.token, env.INVITE_SECRET, Math.floor(now.getTime() / 1000));
    if (!invite.ok) {
      // Expiry gets its own message: it is the one failure a legitimate Game
      // Master will hit, and "ask for a new link" is actionable. The others are
      // deliberately vague.
      const message =
        invite.reason === 'expired'
          ? 'This link has expired. Ask for a new one.'
          : 'This link is not valid.';
      return json({ message }, 403, cors);
    }

    if (await isRevoked(env.REVOKED, invite.gm)) {
      return json({ message: 'This link is not valid.' }, 403, cors);
    }

    // --- is this a person? --------------------------------------------------
    if (typeof payload.website === 'string' && payload.website !== '') {
      // Hidden field, filled only by something that did not look at the page.
      // Answer as though it worked: a bot told it failed just tries again.
      return json({ ok: true, url: null }, 200, cors);
    }

    const elapsed = Number(payload.elapsedMs);
    if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
      return json(
        { message: 'That was submitted too quickly, or the page was open too long. Try again.' },
        400,
        cors
      );
    }

    // --- how often? ---------------------------------------------------------
    const ip = request.headers.get('CF-Connecting-IP');
    const burst = await Promise.all([
      env.RATE_LIMIT_IP.limit({ key: ip ?? 'unknown' }),
      env.RATE_LIMIT_GLOBAL.limit({ key: 'global' }),
    ]);
    if (burst.some(r => !r.success)) {
      return json({ message: 'Too many submissions just now. Try again in a minute.' }, 429, cors);
    }

    if (!(await verifyTurnstile(payload.turnstileToken, env.TURNSTILE_SECRET, ip))) {
      return json({ message: 'The "are you human?" check did not pass. Try again.' }, 403, cors);
    }

    // --- is the event well-formed? -----------------------------------------
    const validated = validateSubmission(payload.event, { now });
    if (!validated.ok) {
      return json({ message: 'Some details need fixing.', errors: validated.errors }, 422, cors);
    }

    const event: EventMeta = validated.value;

    const slug = buildSlug(event.date, event.title);
    if (!slug) {
      return json(
        { message: 'That title cannot be turned into a web address. Try plainer wording.' },
        422,
        cors
      );
    }

    // --- daily cap, counted per Game Master ---------------------------------
    const counterKey = `count:${invite.gm}:${dayKey(now)}`;
    const used = Number((await env.REVOKED.get(counterKey)) ?? '0');
    const dailyLimit = Number(env.DAILY_LIMIT);
    if (Number.isFinite(used) && used >= dailyLimit) {
      return json(
        { message: `That is ${dailyLimit} submissions today. Get in touch if you need more.` },
        429,
        cors
      );
    }

    // --- write it -----------------------------------------------------------
    try {
      const jwt = await appJwt(
        env.GITHUB_APP_ID,
        env.GITHUB_PRIVATE_KEY,
        Math.floor(now.getTime() / 1000)
      );
      const gh = client(await installationToken(jwt, env.GITHUB_INSTALLATION_ID));

      const open = await countOpenSubmissions(gh, env.GITHUB_REPO, BRANCH_PREFIX);
      if (open >= Number(env.MAX_OPEN_SUBMISSIONS)) {
        return json(
          { message: 'There are already several submissions waiting to be reviewed. Try tomorrow.' },
          429,
          cors
        );
      }

      const finalSlug = await freeSlug(gh, env, slug);
      if (!finalSlug) {
        return json(
          {
            message:
              'An event with that name is already listed for that date, or is waiting to be ' +
              'reviewed. Give it a slightly different name to tell them apart.',
          },
          409,
          cors
        );
      }

      const markdown = buildEventMarkdown(event);
      const pull = await openSubmissionPr(gh, {
        repo: env.GITHUB_REPO,
        baseBranch: env.BASE_BRANCH,
        branch: `${BRANCH_PREFIX}${finalSlug}`,
        path: eventPath(finalSlug),
        markdown,
        commitMessage: `Add event: ${event.title}`,
        prTitle: `Event submission: ${event.title}`,
        prBody: submissionBody(invite.gm, event, finalSlug),
      });

      // Counted only on success, so a rejected attempt does not use up a slot --
      // and so this stays well inside the KV free tier's daily writes.
      await env.REVOKED.put(counterKey, String(used + 1), { expirationTtl: 172_800 });

      return json({ ok: true, url: pull.url, number: pull.number }, 201, cors);
    } catch (error) {
      if (error instanceof BranchTakenError) {
        // Two submissions for the same event, racing. Telling this one to retry
        // would be advice that cannot work, so say what will.
        console.warn('submission collided', error.message);
        return json(
          {
            message:
              'Someone just submitted an event with this name for this date. Give yours a ' +
              'slightly different name to tell them apart.',
          },
          409,
          cors
        );
      }

      console.error('submission failed', error);
      return json(
        { message: 'Something went wrong saving that. It has been logged; please try again.' },
        502,
        cors
      );
    }
  },
};

/**
 * The first slug not already taken, or null after a few tries.
 *
 * Two events genuinely can share a date and title — a morning and an evening
 * table — so a suffix is right rather than a refusal. Giving up after five keeps
 * a loop from turning into a subrequest budget.
 *
 * "Taken" means two different things, and checking only the first was a bug:
 *
 *   the file is on the base branch    the event is already published
 *   a submission branch exists        an event is waiting to be reviewed
 *
 * An unmerged submission has no file yet, so a file-only check handed the second
 * submitter the same slug, and creating the existing branch failed with a 422
 * that surfaced as "please try again" — advice that could never work, since
 * every retry collided identically.
 */
async function freeSlug(
  gh: ReturnType<typeof client>,
  env: Env,
  slug: string
): Promise<string | null> {
  // One call covers every candidate: they all start with this prefix.
  const branches = await existingBranches(gh, env.GITHUB_REPO, `${BRANCH_PREFIX}${slug}`);

  for (let attempt = 1; attempt <= 5; attempt++) {
    const candidate = attempt === 1 ? slug : `${slug}-${attempt}`;
    if (branches.has(`${BRANCH_PREFIX}${candidate}`)) continue;
    if (!(await fileExists(gh, env.GITHUB_REPO, eventPath(candidate), env.BASE_BRANCH))) {
      return candidate;
    }
  }
  return null;
}

function submissionBody(gm: string, event: EventMeta, slug: string): string {
  const when = [event.date, event.allDay ? 'all day' : event.startTime].filter(Boolean).join(' ');
  const scenarios = (event.scenarios ?? []).map(s => `- ${s.name}`).join('\n');

  return [
    `Submitted through the event form by **${gm}**.`,
    '',
    `- **When:** ${when}`,
    `- **Where:** ${event.location ?? 'not given'}`,
    `- **Page:** \`/events/${slug}\` once merged`,
    '',
    '**Scenarios**',
    scenarios || '- none listed',
    '',
    '---',
    '',
    'Opened by the submission Worker. The form validates against',
    '`src/shared/eventSchema.ts`, so the front-matter is well-formed — what is',
    'worth checking by eye is whether the details are *right*: date, times,',
    'scenario names, and that the signup links go where they should.',
  ].join('\n');
}
