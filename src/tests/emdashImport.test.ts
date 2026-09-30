import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import {
  mapEntry,
  normalizeEmphasis,
  type SourceCollection,
  type SourceEntry,
} from '../../emdash/scripts/lib/map-content';
import { parseFrontMatter } from '../../scripts/lib/frontmatter';

/**
 * emdash/scripts/import-content.ts moves every markdown file into EmDash. These
 * tests pin the mapping it relies on, so a new front-matter key or a malformed
 * value fails here instead of being dropped at import time.
 */

const repoRoot = process.cwd();

const event = (meta: Record<string, unknown>, body = ''): SourceEntry => ({
  collection: 'calendar',
  slug: '2026-10-15-game-day',
  meta: { title: 'Game day', date: '2026-10-15', ...meta },
  body,
});

describe('import mapping', () => {
  test.each(['calendar', 'news', 'gamemasters'] as SourceCollection[])(
    'maps every %s file in src/content',
    collection => {
      const dir = path.join(repoRoot, 'src/content', collection);
      for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
        const { data, content } = parseFrontMatter(fs.readFileSync(path.join(dir, file), 'utf-8'));
        expect(() =>
          mapEntry({ collection, slug: path.basename(file, '.md'), meta: data, body: content })
        ).not.toThrow();
      }
    }
  );

  test('renames fields to snake_case and keeps the filename as the slug', () => {
    const mapped = mapEntry(
      event({
        startTime: '17:30',
        playerCap: 6,
        specialNote: 'Bring dice',
        scenarios: [{ name: 'The Dollhouse', signupUrl: 'https://example.com', startTime: '18:00' }],
      })
    );
    expect(mapped.collection).toBe('events');
    expect(mapped.slug).toBe('2026-10-15-game-day');
    expect(mapped.data).toEqual({
      title: 'Game day',
      date: '2026-10-15',
      start_time: '17:30',
      player_cap: 6,
      special_note: 'Bring dice',
      scenarios: [{ name: 'The Dollhouse', signup_url: 'https://example.com', start_time: '18:00' }],
    });
  });

  test('refuses a front-matter key it does not know, rather than dropping it', () => {
    expect(() => mapEntry(event({ ticketPrice: 5 }))).toThrow(/unknown front-matter key "ticketPrice"/);
    expect(() => mapEntry(event({ scenarios: [{ name: 'X', seats: 4 }] }))).toThrow(
      /unknown scenarios\[0\] key "seats"/
    );
  });

  test('refuses dates and times the site would misread', () => {
    expect(() => mapEntry(event({ date: '10/15/2026' }))).toThrow(/isn't YYYY-MM-DD/);
    expect(() => mapEntry(event({ startTime: 1050 }))).toThrow(/isn't a 24-hour HH:MM/);
    // Scenario times get no check in the admin, so the import is the last chance.
    expect(() => mapEntry(event({ scenarios: [{ name: 'X', startTime: '5:30 PM' }] }))).toThrow(
      /scenarios\[0\].start_time/
    );
  });

  test('reads a YAML 1.1 Date as its UTC calendar day', () => {
    const mapped = mapEntry(event({ date: new Date('2026-10-15T00:00:00Z') }));
    expect(mapped.data.date).toBe('2026-10-15');
  });

  test('puts the markdown body in the Portable Text field for the collection', () => {
    expect(mapEntry(event({}, '## Parking\n')).richText).toEqual({ field: 'body', markdown: '## Parking' });
    expect(mapEntry(event({}, '  \n')).richText).toBeUndefined();

    const gm = mapEntry({
      collection: 'gamemasters',
      slug: 'eli-f',
      meta: { firstName: 'Eli', lastInitial: 'F', games: ['Pathfinder'] },
      body: 'Runs Pathfinder.',
    });
    expect(gm.richText).toEqual({ field: 'bio', markdown: 'Runs Pathfinder.' });
    // Older Game Master files have no title; the admin list needs one.
    expect(gm.data.title).toBe('Game Master: Eli F.');
  });

  test("refuses a news article whose id isn't its filename", () => {
    const news = (id: string): SourceEntry => ({
      collection: 'news',
      slug: 'lodge-party',
      meta: { title: 'Party', date: '2026-05-31', id },
      body: 'Come along.',
    });
    expect(mapEntry(news('lodge-party')).data).toEqual({ title: 'Party', date: '2026-05-31' });
    expect(() => mapEntry(news('something-else'))).toThrow(/differs from the filename/);
  });
});

describe('normalizeEmphasis', () => {
  // EmDash's markdown converter reads only _italic_; *italic* stayed literal
  // and rendered with its asterisks on the Jan 15 event page.
  test('rewrites *italic* to _italic_', () => {
    expect(normalizeEmphasis('*Please sign up for the waitlist if the table is full!*')).toBe(
      '_Please sign up for the waitlist if the table is full!_'
    );
    expect(normalizeEmphasis('Some *very* keen players')).toBe('Some _very_ keen players');
  });

  test('leaves bold, bullets, and lone asterisks alone', () => {
    expect(normalizeEmphasis('**Date:** Oct 15')).toBe('**Date:** Oct 15');
    expect(normalizeEmphasis('* one\n* two')).toBe('* one\n* two');
    expect(normalizeEmphasis('5 * 3 = 15')).toBe('5 * 3 = 15');
  });
});
