import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Plain CommonJS helper, shared with the build script so the test reads content
// through exactly the parser the site does.
import { parseFrontMatter } from '../../scripts/lib/frontmatter';

import {
  EVENT_FIELDS,
  SCENARIO_FIELDS,
  SIGNUP_HOSTS,
  SYSTEMS,
  TYPES,
  VENUES,
  SAFE_SLUG_PATTERN,
  buildSlug,
  eventPath,
  signupHost,
  validateEvent,
  validateSubmission,
} from '../shared/eventSchema';
import { buildEventMarkdown } from '../shared/eventMarkdown';

const repoRoot = process.cwd();
const calendarDir = path.join(repoRoot, 'src/content/calendar');

const eventFiles = fs
  .readdirSync(calendarDir)
  .filter(name => name.endsWith('.md'))
  .sort();

/** A submission that should pass, which individual tests then break in one way. */
const goodSubmission = () => ({
  title: 'Pathfinder Society at Tempest Games',
  date: '2026-11-05',
  location: 'Tempest Games',
  startTime: '17:30',
  endTime: '21:30',
  playerCap: 6,
  intro: 'Join us for Pathfinder Society games.',
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

const at = new Date('2026-09-16T12:00:00Z');
const submit = (input: unknown) => validateSubmission(input, { now: at });

describe('the existing content', () => {
  test('there is content to check', () => {
    expect(eventFiles.length).toBeGreaterThan(100);
  });

  // The point of the structural layer: every hand-written file is held to it
  // too, so the schema cannot drift away from what the site actually contains.
  test.each(eventFiles)('%s is a well-formed event', file => {
    const { data } = parseFrontMatter(fs.readFileSync(path.join(calendarDir, file), 'utf-8'));
    const result = validateEvent(data);

    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  // The filename is the public URL, so these can never be renamed -- they use
  // the assorted conventions in place before the form existed. What has to hold
  // is that every one of them is safe to build a path from.
  test('every file name is a safe slug', () => {
    for (const file of eventFiles) {
      const slug = file.replace(/\.md$/, '');
      expect(SAFE_SLUG_PATTERN.test(slug), slug).toBe(true);
      expect(() => eventPath(slug)).not.toThrow();
    }
  });
});

describe('validateEvent', () => {
  test('rejects a field the site does not know about', () => {
    const result = validateEvent({ title: 'x', date: '2026-01-01', sponsor: 'Acme' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.join()).toMatch(/sponsor/);
  });

  test('rejects a time that is not HH:MM', () => {
    const result = validateEvent({ title: 'x', date: '2026-01-01', startTime: '5:30 PM' });
    expect(result.ok).toBe(false);
  });

  // 2026-02-30 matches the date pattern but is not a day.
  test('rejects a date that does not exist', () => {
    expect(validateEvent({ title: 'x', date: '2026-02-30' }).ok).toBe(false);
  });

  test('accepts a venue it has never seen, because hand-written events are valid', () => {
    const result = validateEvent({
      title: 'One-off at a pub',
      date: '2026-01-01',
      location: 'The Sanctuary',
      address: 'Somewhere else entirely',
    });
    expect(result.ok).toBe(true);
  });
});

describe('validateSubmission', () => {
  test('accepts a good submission', () => {
    const result = submit(goodSubmission());
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  test('fills the address from the venue, never from the client', () => {
    const result = submit({ ...goodSubmission(), address: '1 Evil Street' });
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.address).toBe(VENUES[0].address);
  });

  test('rejects a venue that is not ours', () => {
    const result = submit({ ...goodSubmission(), location: 'My House' });
    expect(result.ok).toBe(false);
  });

  test.each([
    ['http, not https', 'http://www.rpgchronicles.net/session/x'],
    ['a host we do not know', 'https://example.com/session/x'],
    ['a lookalike host', 'https://www.rpgchronicles.net.evil.com/x'],
    ['javascript:', 'javascript:alert(1)'],
    ['not a url at all', 'click here'],
  ])('rejects a signup link: %s', (_label, signupUrl) => {
    const bad = goodSubmission();
    bad.scenarios[0].signupUrl = signupUrl;
    expect(submit(bad).ok).toBe(false);
  });

  test('accepts every host on the allowlist', () => {
    for (const host of SIGNUP_HOSTS) {
      const input = goodSubmission();
      input.scenarios[0].signupUrl = `https://${host}/session/x`;
      expect(submit(input).ok, host).toBe(true);
    }
  });

  test('rejects a date in the past and one too far ahead', () => {
    expect(submit({ ...goodSubmission(), date: '2020-01-01' }).ok).toBe(false);
    expect(submit({ ...goodSubmission(), date: '2099-01-01' }).ok).toBe(false);
  });

  test('requires at least one scenario', () => {
    expect(submit({ ...goodSubmission(), scenarios: [] }).ok).toBe(false);
  });

  test('rejects an end time at or before the start', () => {
    expect(submit({ ...goodSubmission(), startTime: '19:00', endTime: '17:00' }).ok).toBe(false);
    expect(submit({ ...goodSubmission(), startTime: '19:00', endTime: '19:00' }).ok).toBe(false);
  });

  test('requires a start time unless the event is all day', () => {
    const { startTime, ...noStart } = goodSubmission();
    expect(submit(noStart).ok).toBe(false);
    expect(submit({ ...noStart, endTime: undefined, allDay: true }).ok).toBe(true);
  });

  test('strips control characters rather than letting them split a field', () => {
    const result = submit({
      ...goodSubmission(),
      title: 'Games at Tempest\ncancelled: true',
    });
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.title).toBe('Games at Tempestcancelled: true');
    expect(result.ok && (result.value as unknown as Record<string, unknown>).cancelled).toBeUndefined();
  });

  test('rejects fields the form does not offer', () => {
    const result = submit({ ...goodSubmission(), cancelled: true });
    // `cancelled` is a real event field, but not one a submission may set --
    // it is simply not read, so it never reaches the file.
    expect(result.ok).toBe(true);
    expect(result.ok && (result.value as unknown as Record<string, unknown>).cancelled).toBeUndefined();
  });

  test('anything it accepts is also a structurally valid event', () => {
    const result = submit(goodSubmission());
    expect(result.ok).toBe(true);
    if (result.ok) expect(validateEvent(result.value).ok).toBe(true);
  });
});

describe('buildSlug', () => {
  test('builds a slug from the date and title', () => {
    expect(buildSlug('2026-11-05', 'Pathfinder Society at Tempest Games')).toBe(
      '2026-11-05-pathfinder-society-at-tempest-games'
    );
  });

  test.each([
    ['path traversal', '../../package.json'],
    ['a slash', 'a/b'],
    ['only punctuation', '!!!'],
    ['empty', ''],
    ['a leading dot', '.hidden'],
  ])('never lets %s through', (_label, title) => {
    const slug = buildSlug('2026-11-05', title);
    if (slug !== null) {
      expect(slug).toMatch(SAFE_SLUG_PATTERN);
      expect(slug.startsWith('2026-11-05-')).toBe(true);
      expect(slug).not.toContain('..');
      expect(slug).not.toContain('/');
    }
  });

  test('refuses an impossible date', () => {
    expect(buildSlug('2026-02-30', 'Some event')).toBeNull();
  });

  test('eventPath refuses anything that is not a slug', () => {
    expect(() => eventPath('../../package.json')).toThrow();
    expect(() => eventPath('2026-11-05-ok')).not.toThrow();
  });
});

describe('buildEventMarkdown', () => {
  const markdownFor = (input: unknown) => {
    const result = submit(input);
    if (!result.ok) throw new Error(result.errors.join('; '));
    return buildEventMarkdown(result.value);
  };

  test('round-trips through the reader the build actually uses', () => {
    const result = submit(goodSubmission());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { data, content } = parseFrontMatter(buildEventMarkdown(result.value));

    expect(data).toEqual(result.value);
    expect(content.trim()).toBe('');
    expect(validateEvent(data).ok).toBe(true);
  });

  // The `#` in the Diversions address starts a YAML comment when unquoted, and
  // silently truncated this address in 30 files before now.
  test('keeps an address containing a # intact', () => {
    const diversions = VENUES.find(v => v.name === 'Diversions')!;
    const markdown = markdownFor({ ...goodSubmission(), location: 'Diversions' });

    const { data } = parseFrontMatter(markdown);
    expect(data.address).toBe(diversions.address);
    expect(data.address).toContain('#300');
  });

  // YAML 1.1 reads an unquoted 17:30 as the sexagesimal integer 1050.
  test('keeps times as strings, not base-60 integers', () => {
    const { data } = parseFrontMatter(markdownFor(goodSubmission()));
    expect(data.startTime).toBe('17:30');
    expect(data.endTime).toBe('21:30');
    expect(typeof data.startTime).toBe('string');
  });

  test('writes no body', () => {
    expect(markdownFor(goodSubmission())).toMatch(/---\n$/);
  });
});

describe('the schema and the migration helper agree', () => {
  // scripts/lib/event-markdown.js carries its own copy of these lists, and is
  // the one place outside this module that classifies a system or a type.
  test('systems and types match scripts/lib/event-markdown.js', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'scripts/lib/event-markdown.js'), 'utf-8');

    const listOf = (name: string) =>
      JSON.parse(
        (source.match(new RegExp(`const ${name} = (\\[[^\\]]*\\])`))?.[1] ?? '[]').replace(
          /'/g,
          '"'
        )
      );

    expect(listOf('SYSTEMS')).toEqual([...SYSTEMS]);
    expect(listOf('TYPES')).toEqual([...TYPES]);
  });
});

describe('the field lists', () => {
  test('every venue has a name and an address', () => {
    for (const venue of VENUES) {
      expect(venue.name.length).toBeGreaterThan(0);
      expect(venue.address.length).toBeGreaterThan(0);
    }
  });

  test('scenario fields are a subset of what the content uses', () => {
    // Guards against a field being removed from the schema while content still
    // relies on it -- the check the deleted cmsConfig.test.ts used to perform.
    const used = new Set<string>();
    for (const file of eventFiles) {
      const { data } = parseFrontMatter(fs.readFileSync(path.join(calendarDir, file), 'utf-8'));
      for (const key of Object.keys(data)) used.add(key);
      for (const scenario of data.scenarios ?? []) {
        for (const key of Object.keys(scenario)) used.add(`scenarios.${key}`);
      }
    }

    const declared = new Set([
      ...Object.keys(EVENT_FIELDS),
      ...Object.keys(SCENARIO_FIELDS).map(k => `scenarios.${k}`),
    ]);

    expect([...used].filter(key => !declared.has(key))).toEqual([]);
  });

  test('signupHost accepts only https on a known host', () => {
    expect(signupHost('https://tabletop.events/x')).toBe('tabletop.events');
    expect(signupHost('http://tabletop.events/x')).toBeNull();
    expect(signupHost('https://evil.test/x')).toBeNull();
  });
});
