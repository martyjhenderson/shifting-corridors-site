import { describe, test, expect } from 'vitest';

// CommonJS module, shared with the node build scripts.
import { parseFrontMatter } from '../../scripts/lib/frontmatter';

const parse = (body: string) => parseFrontMatter(`---\n${body}\n---\n`).data;

/**
 * gray-matter bundles js-yaml 3.x, which implements YAML 1.1 and reads an
 * unquoted `17:30` as the base-60 integer 1050. The CMS writes times unquoted,
 * so without a modern schema every evening event a Game Master created rendered
 * its end time as "1050" instead of "9:30 PM".
 */
describe('front-matter parsing', () => {
  test.each([
    '00:30', '05:30', '09:30',
    // Hours >= 10 are the ones YAML 1.1 turned into numbers: the sexagesimal
    // pattern needs a leading 1-9, so only these were affected.
    '10:00', '12:30', '17:30', '21:30', '23:59',
  ])('keeps the time %s as a string', time => {
    const value = parse(`startTime: ${time}`).startTime;
    expect(typeof value).toBe('string');
    expect(value).toBe(time);
  });

  test('keeps an unquoted date as a plain string, not a Date', () => {
    const date = parse('date: 2026-10-06').date;
    expect(typeof date).toBe('string');
    expect(date).toBe('2026-10-06');
  });

  test('still reads quoted times, as the migrated files write them', () => {
    expect(parse("startTime: '17:30'").startTime).toBe('17:30');
  });

  test('leaves genuine numbers, booleans and lists alone', () => {
    const meta = parse('playerCap: 6\ncancelled: false\nscenarios: []');
    expect(meta.playerCap).toBe(6);
    expect(meta.cancelled).toBe(false);
    expect(meta.scenarios).toEqual([]);
  });

  test('keeps a level range as a string rather than a date', () => {
    expect(parse('levels: 1-4').levels).toBe('1-4');
  });

  test('reads an address containing # when quoted', () => {
    const address = parse("address: '119 2nd St #300, Coralville, IA 52241'").address;
    expect(address).toBe('119 2nd St #300, Coralville, IA 52241');
  });
});
