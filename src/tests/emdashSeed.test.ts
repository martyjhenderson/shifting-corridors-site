import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

/**
 * emdash/seed/seed.json is the EmDash rewrite's schema. Until the Sveltia form
 * is retired it describes the same content as public/admin-config.yml, and the
 * import script maps one onto the other — so a field added to the form but not
 * the seed would be silently dropped on import. Assert the two agree.
 *
 * EmDash field slugs must be snake_case, so `startTime` becomes `start_time`.
 */

interface CmsField {
  name: string;
  widget: string;
  fields?: CmsField[];
}

interface SeedField {
  slug: string;
  type: string;
  validation?: { subFields?: { slug: string }[] };
}

const repoRoot = process.cwd();

const cms = yaml.load(
  fs.readFileSync(path.join(repoRoot, 'public/admin-config.yml'), 'utf-8')
) as { collections: { name: string; fields: CmsField[] }[] };

const seed = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'emdash/seed/seed.json'), 'utf-8')
) as { collections: { slug: string; fields: SeedField[] }[] };

const snake = (name: string) => name.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);

/** Sveltia collection name → EmDash collection slug. */
const COLLECTIONS: Record<string, string> = {
  calendar: 'events',
  news: 'news',
  gamemasters: 'gamemasters',
};

/**
 * Form fields that don't become an EmDash field of the snake_cased name:
 * news `id` becomes the entry's slug (`id` is reserved), and a Game Master's
 * markdown body is a `bio` field.
 */
const RENAMED: Record<string, Record<string, string | null>> = {
  news: { id: null },
  gamemasters: { body: 'bio' },
};

const seedCollection = (slug: string) => {
  const c = seed.collections.find(c => c.slug === slug);
  if (!c) throw new Error(`seed has no ${slug} collection`);
  return c;
};

describe('EmDash seed', () => {
  test.each(Object.entries(COLLECTIONS))(
    'declares every %s field the Sveltia form does',
    (cmsName, seedSlug) => {
      const form = cms.collections.find(c => c.name === cmsName)!;
      const seeded = new Set(seedCollection(seedSlug).fields.map(f => f.slug));

      const expected = form.fields
        .map(f => (f.name in (RENAMED[cmsName] ?? {}) ? RENAMED[cmsName][f.name] : snake(f.name)))
        .filter((slug): slug is string => slug !== null);

      expect([...seeded].sort()).toEqual([...expected].sort());
    }
  );

  test('declares every scenario sub-field', () => {
    const form = cms.collections.find(c => c.name === 'calendar')!;
    const formScenario = form.fields.find(f => f.name === 'scenarios')!.fields!;
    const seedScenario = seedCollection('events').fields.find(f => f.slug === 'scenarios')!;

    expect(seedScenario.validation?.subFields?.map(f => f.slug).sort()).toEqual(
      formScenario.map(f => snake(f.name)).sort()
    );
  });

  test.each(Object.values(COLLECTIONS))('edits the %s date with the date-only picker', slug => {
    // Without the widget the admin shows a plain text box; a `datetime` field
    // instead would store an instant in UTC and could shift the day.
    const date = seedCollection(slug).fields.find(f => f.slug === 'date') as SeedField & { widget?: string };
    expect(date.type).toBe('string');
    expect(date.widget).toBe('date-field:date');
  });

  test.each(['start_time', 'end_time'])('edits the event %s with the time picker', slug => {
    const time = seedCollection('events').fields.find(f => f.slug === slug) as SeedField & { widget?: string };
    expect(time.type).toBe('string');
    expect(time.widget).toBe('date-field:time');
  });

  test('keeps event URLs at /events/<slug>', () => {
    // Changing this breaks every event link already shared.
    expect((seedCollection('events') as { urlPattern?: string }).urlPattern).toBe('/events/{slug}');
  });
});
