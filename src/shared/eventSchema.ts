/**
 * The one description of what a calendar event is.
 *
 * This used to live in three places that nothing forced to agree: the CMS form
 * in public/admin-config.yml, the MarkdownMeta/Scenario types in
 * src/utils/staticData.ts, and whatever EventDetails.tsx happened to render.
 * src/tests/cmsConfig.test.ts existed only to referee the first two.
 *
 * Two levels of strictness, because two different things need checking:
 *
 *   validateEvent      — structural. Every file in src/content/calendar must
 *                        pass, including the ones written by hand. It says what
 *                        a well-formed event is, not where it came from.
 *
 *   validateSubmission — everything above, plus the rules that only make sense
 *                        for untrusted input arriving from the public form: a
 *                        venue from the known list, a date in a sane window, a
 *                        signup link on a host we recognise.
 *
 * Deliberately free of I/O and of node/browser APIs, so the Worker, the form and
 * the test suite can all import it.
 */

export interface Venue {
  name: string;
  address: string;
}

/**
 * Every venue the lodge has run at, with the address as it should be written.
 *
 * The form offers these and the Worker looks the address up here; an address is
 * never accepted from a client. Note Diversions' `#300` — an unquoted `#` in
 * YAML starts a comment, which silently truncated this exact address in 30 files
 * once already. Keeping the string in one place, quoted by the serializer, is
 * what stops that recurring.
 */
export const VENUES: readonly Venue[] = [
  { name: 'Tempest Games', address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405' },
  { name: 'Diversions', address: '119 2nd St #300, Coralville, IA 52241' },
  { name: 'Geek City Games', address: '617 Center Point Rd NE, Cedar Rapids, IA 52402' },
  { name: 'Replay Games', address: '365 Beaver Kreek Center suite b, North Liberty, IA 52317' },
  {
    name: 'Hyatt Regency Coralville Hotel & Conference Center',
    address: '300 E 9th St, Coralville, IA 52241, USA',
  },
] as const;

export const SYSTEMS = ['Pathfinder', 'Starfinder'] as const;
export const EDITIONS = ['1E', '2E'] as const;
export const TYPES = ['Scenario', 'Quest', 'Adventure', 'Bounty', 'Module', 'One-Shot'] as const;

/**
 * Hosts a signup link may point at.
 *
 * The signup URL is the only value a submitter controls that becomes a live
 * link on the site, so it is the one field where an allowlist genuinely changes
 * the risk. Every one of the 152 links in the existing content is already on one
 * of these two services.
 */
export const SIGNUP_HOSTS = [
  'rpgchronicles.net',
  'www.rpgchronicles.net',
  'tabletop.events',
  'www.tabletop.events',
] as const;

/** 24-hour "HH:MM". Quoted in front-matter; see scripts/lib/frontmatter.js. */
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** e.g. "1-4". Free-form enough to allow "1-2" through "17-20". */
export const LEVELS_PATTERN = /^\d{1,2}-\d{1,2}$/;

/** How far ahead the form will accept a date, in months. */
export const MAX_MONTHS_AHEAD = 18;

interface FieldSpec {
  type: 'string' | 'boolean' | 'integer' | 'array';
  required?: boolean;
  pattern?: RegExp;
  values?: readonly string[];
  min?: number;
  max?: number;
  maxLength?: number;
}

export const SCENARIO_FIELDS: Record<string, FieldSpec> = {
  name: { type: 'string', required: true, maxLength: 160 },
  system: { type: 'string', values: SYSTEMS },
  edition: { type: 'string', values: EDITIONS },
  type: { type: 'string', values: TYPES },
  levels: { type: 'string', pattern: LEVELS_PATTERN },
  startTime: { type: 'string', pattern: TIME_PATTERN },
  endTime: { type: 'string', pattern: TIME_PATTERN },
  playerCap: { type: 'integer', min: 1, max: 12 },
  gamemaster: { type: 'string', maxLength: 80 },
  repeatable: { type: 'boolean' },
  pregens: { type: 'boolean' },
  cancelled: { type: 'boolean' },
  signupUrl: { type: 'string', maxLength: 500 },
};

export const EVENT_FIELDS: Record<string, FieldSpec> = {
  title: { type: 'string', required: true, maxLength: 120 },
  date: { type: 'string', required: true, pattern: DATE_PATTERN },
  location: { type: 'string', maxLength: 120 },
  address: { type: 'string', maxLength: 200 },
  startTime: { type: 'string', pattern: TIME_PATTERN },
  endTime: { type: 'string', pattern: TIME_PATTERN },
  allDay: { type: 'boolean' },
  playerCap: { type: 'integer', min: 1, max: 12 },
  levels: { type: 'string', pattern: LEVELS_PATTERN },
  cancelled: { type: 'boolean' },
  intro: { type: 'string', maxLength: 400 },
  specialNote: { type: 'string', maxLength: 300 },
  gamemaster: { type: 'string', maxLength: 80 },
  scenarios: { type: 'array' },
  /**
   * Legacy. Events are addressed by filename now, but staticData.ts still reads
   * this as a fallback, so a file that kept it is well-formed rather than wrong.
   */
  url: { type: 'string', maxLength: 200 },
};

export interface Scenario {
  name: string;
  system?: (typeof SYSTEMS)[number];
  edition?: (typeof EDITIONS)[number];
  type?: (typeof TYPES)[number];
  levels?: string;
  startTime?: string;
  endTime?: string;
  playerCap?: number;
  gamemaster?: string;
  repeatable?: boolean;
  pregens?: boolean;
  cancelled?: boolean;
  signupUrl?: string;
}

export interface EventMeta {
  title: string;
  date: string;
  location?: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  playerCap?: number;
  levels?: string;
  cancelled?: boolean;
  intro?: string;
  specialNote?: string;
  gamemaster?: string;
  scenarios?: Scenario[];
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** True for a date that exists — "2026-02-30" matches DATE_PATTERN but does not. */
function isRealDate(value: string): boolean {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

function checkField(key: string, value: unknown, spec: FieldSpec, where: string): string[] {
  const at = `${where}${key}`;

  if (spec.type === 'integer') {
    if (typeof value !== 'number' || !Number.isInteger(value)) return [`${at} must be a whole number`];
    if (spec.min !== undefined && value < spec.min) return [`${at} must be at least ${spec.min}`];
    if (spec.max !== undefined && value > spec.max) return [`${at} must be at most ${spec.max}`];
    return [];
  }

  if (spec.type === 'boolean') {
    return typeof value === 'boolean' ? [] : [`${at} must be true or false`];
  }

  if (spec.type === 'array') {
    return Array.isArray(value) ? [] : [`${at} must be a list`];
  }

  if (typeof value !== 'string') return [`${at} must be text`];
  if (value.trim() === '') return [`${at} must not be blank`];
  if (spec.maxLength && value.length > spec.maxLength) {
    return [`${at} must be ${spec.maxLength} characters or fewer`];
  }
  if (spec.values && !spec.values.includes(value)) {
    return [`${at} must be one of: ${spec.values.join(', ')}`];
  }
  if (spec.pattern && !spec.pattern.test(value)) {
    return [`${at} is not in the expected format (${String(spec.pattern)})`];
  }
  return [];
}

function checkAgainst(
  fields: Record<string, FieldSpec>,
  data: Record<string, unknown>,
  where: string
): string[] {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    const spec = fields[key];
    if (!spec) {
      errors.push(`${where}${key} is not a field this site knows about`);
      continue;
    }
    if (value === undefined || value === null) continue;
    errors.push(...checkField(key, value, spec, where));
  }

  for (const [key, spec] of Object.entries(fields)) {
    if (spec.required && (data[key] === undefined || data[key] === null)) {
      errors.push(`${where}${key} is required`);
    }
  }

  return errors;
}

/**
 * Structural check for any event, however it was authored.
 *
 * Says nothing about where the event came from — a hand-written file for a
 * one-off at a venue we have never used before is valid, and should be.
 */
export function validateEvent(meta: unknown): Result<EventMeta> {
  if (!isPlainObject(meta)) return { ok: false, errors: ['the front-matter is not a mapping'] };

  const errors = checkAgainst(EVENT_FIELDS, meta, '');

  if (typeof meta.date === 'string' && DATE_PATTERN.test(meta.date) && !isRealDate(meta.date)) {
    errors.push(`date ${meta.date} is not a real date`);
  }

  if (Array.isArray(meta.scenarios)) {
    meta.scenarios.forEach((scenario, i) => {
      if (!isPlainObject(scenario)) {
        errors.push(`scenarios[${i}] is not a mapping`);
        return;
      }
      errors.push(...checkAgainst(SCENARIO_FIELDS, scenario, `scenarios[${i}].`));
    });
  }

  return errors.length ? { ok: false, errors } : { ok: true, value: meta as unknown as EventMeta };
}

/**
 * Strip characters that have no business in front-matter, and trim.
 *
 * Control characters are the interesting ones: a newline or a NUL smuggled into
 * a value is how a single field turns into two YAML keys.
 */
const clean = (value: unknown): unknown =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]/g, '').trim() : value;

/** Drop keys whose value is absent, blank, or `false` for an optional flag. */
function compact<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    out[key] = value;
  }
  return out as T;
}

export interface SubmissionOptions {
  /** Injected so the date-window check is testable. */
  now?: Date;
}

/**
 * Validate one submission from the public form and normalise it into an event.
 *
 * Everything here is an allowlist. A field that is not recognised, a venue that
 * is not ours, a link to a host we do not know, a date years out — all rejected
 * rather than repaired, because the output of this function is committed to the
 * repository and rendered on the site.
 */
export function validateSubmission(input: unknown, options: SubmissionOptions = {}): Result<EventMeta> {
  if (!isPlainObject(input)) return { ok: false, errors: ['the submission is not an object'] };

  const errors: string[] = [];
  const now = options.now ?? new Date();

  const rawScenarios = Array.isArray(input.scenarios) ? input.scenarios : [];
  const scenarios: Scenario[] = [];

  rawScenarios.forEach((raw, i) => {
    if (!isPlainObject(raw)) {
      errors.push(`scenarios[${i}] is not an object`);
      return;
    }

    const scenario = compact(
      Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, clean(v)]))
    ) as Record<string, unknown>;

    errors.push(...checkAgainst(SCENARIO_FIELDS, scenario, `scenarios[${i}].`));

    if (typeof scenario.signupUrl === 'string') {
      const host = signupHost(scenario.signupUrl);
      if (!host) {
        errors.push(
          `scenarios[${i}].signupUrl must be an https link to ${SIGNUP_HOSTS.join(' or ')}`
        );
      }
    }

    scenarios.push(scenario as unknown as Scenario);
  });

  if (scenarios.length === 0) errors.push('at least one scenario is required');
  if (scenarios.length > 12) errors.push('an event can list at most 12 scenarios');

  const venueName = clean(input.location);
  const venue = VENUES.find(v => v.name === venueName);
  if (!venue) {
    errors.push(`location must be one of: ${VENUES.map(v => v.name).join(', ')}`);
  }

  const event = compact({
    title: clean(input.title),
    date: clean(input.date),
    location: venue?.name,
    // Never taken from the client: looked up from the venue.
    address: venue?.address,
    startTime: clean(input.startTime),
    endTime: clean(input.endTime),
    allDay: input.allDay === true,
    playerCap: input.playerCap,
    levels: clean(input.levels),
    intro: clean(input.intro),
    gamemaster: clean(input.gamemaster),
    scenarios,
  }) as unknown as Record<string, unknown>;

  errors.push(
    ...checkAgainst(EVENT_FIELDS, { ...event, scenarios: undefined }, '').filter(
      // scenarios is validated above, in more detail than the structural pass.
      message => !message.startsWith('scenarios')
    )
  );

  if (typeof event.date === 'string' && DATE_PATTERN.test(event.date)) {
    if (!isRealDate(event.date)) {
      errors.push(`date ${event.date} is not a real date`);
    } else {
      const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      const limit = new Date(today);
      limit.setUTCMonth(limit.getUTCMonth() + MAX_MONTHS_AHEAD);
      const date = new Date(`${event.date}T00:00:00Z`);

      if (date < today) errors.push('date is in the past');
      if (date > limit) errors.push(`date is more than ${MAX_MONTHS_AHEAD} months away`);
    }
  }

  if (event.allDay && (event.startTime || event.endTime)) {
    errors.push('an all-day event cannot also have a start or end time');
  }
  if (!event.allDay && !event.startTime) {
    errors.push('startTime is required unless the event is all day');
  }
  if (event.startTime && event.endTime && String(event.endTime) <= String(event.startTime)) {
    errors.push('endTime must be after startTime');
  }

  return errors.length
    ? { ok: false, errors }
    : { ok: true, value: event as unknown as EventMeta };
}

/** The allowed host of a signup link, or null if the link is not acceptable. */
export function signupHost(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  return (SIGNUP_HOSTS as readonly string[]).includes(url.hostname) ? url.hostname : null;
}

/**
 * Characters a file in src/content/calendar may be named with.
 *
 * This is the safety rule, and it holds for every event however it was authored.
 * It is deliberately looser than what buildSlug produces: the 103 events written
 * before the form existed are named `diversions-apr-08-2026`,
 * `tempest-student-exchange`, or in two cases `gcg-13Jul2025`. The filename is
 * the public URL, so none of them can be renamed. Uppercase is allowed for those
 * two; buildSlug lowercases everything it generates regardless.
 *
 * What it rules out is what matters: no dot, slash, or `..` segment can appear,
 * so no slug can address a file outside the calendar directory.
 */
export const SAFE_SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

/**
 * The filename a *submitted* event is stored under, which is also its public URL.
 *
 * Date-first so new files sort chronologically — the convention the CMS was
 * configured for, rather than the assorted ones the hand-written files use.
 *
 * Returns null rather than a repaired string: a title that cannot produce a
 * usable slug is a submission to reject, not one to guess at. The result is
 * re-tested against the safety pattern, so no separator, traversal segment or
 * leading dot can survive whatever the input was.
 */
export function buildSlug(date: string, title: string): string | null {
  if (!DATE_PATTERN.test(date) || !isRealDate(date)) return null;

  const stem = String(title)
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');

  if (!stem) return null;

  const slug = `${date}-${stem}`;
  return SAFE_SLUG_PATTERN.test(slug) ? slug : null;
}

/** The repository path an event slug is stored at. Never built from raw input. */
export function eventPath(slug: string): string {
  if (!SAFE_SLUG_PATTERN.test(slug)) {
    throw new Error(`refusing to build a path from an unsafe slug: ${slug}`);
  }
  return `src/content/calendar/${slug}.md`;
}
