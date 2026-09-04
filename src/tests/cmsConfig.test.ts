import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

import calendarData from '../data/calendar.json';
import newsData from '../data/news.json';
import gamemastersData from '../data/gamemasters.json';

/**
 * The CMS form and the markdown front-matter are two descriptions of the same
 * schema, kept in different files. Nothing at build time forces them to agree,
 * and a field the form doesn't know about is silently dropped the first time a
 * Game Master edits an existing event — so assert the agreement here.
 */

interface CmsField {
  name: string;
  widget: string;
  fields?: CmsField[];
  field?: CmsField;
}

interface CmsCollection {
  name: string;
  folder: string;
  fields: CmsField[];
}

// Vitest runs from the repo root.
const repoRoot = process.cwd();

const config = yaml.load(
  fs.readFileSync(path.join(repoRoot, 'public/admin-config.yml'), 'utf-8')
) as { backend: Record<string, unknown>; collections: CmsCollection[] };

const collection = (name: string) =>
  config.collections.find(c => c.name === name) as CmsCollection;

/** Front-matter keys the form declares. `body` is the markdown, not a key. */
const declaredKeys = (fields: CmsField[]) =>
  new Set(fields.map(f => f.name).filter(name => name !== 'body'));

const keysUsedBy = (entries: { meta: Record<string, unknown> }[]) => {
  const keys = new Set<string>();
  for (const entry of entries) Object.keys(entry.meta).forEach(k => keys.add(k));
  return keys;
};

describe('CMS config', () => {
  test('targets the content branch, never main', () => {
    expect(config.backend.branch).toBe('content');
  });

  test.each([
    ['calendar', calendarData],
    ['news', newsData],
    ['gamemasters', gamemastersData],
  ])('%s form declares every front-matter key the content uses', (name, data) => {
    const declared = declaredKeys(collection(name).fields);
    const used = keysUsedBy(data as { meta: Record<string, unknown> }[]);

    const undeclared = [...used].filter(key => !declared.has(key));
    expect(undeclared, `undeclared in admin-config.yml under "${name}"`).toEqual([]);
  });

  test('scenario form declares every key the scenarios use', () => {
    const scenarioField = collection('calendar').fields.find(f => f.name === 'scenarios');
    const declared = new Set((scenarioField?.fields ?? []).map(f => f.name));

    const used = new Set<string>();
    for (const event of calendarData as { meta: { scenarios?: Record<string, unknown>[] } }[]) {
      for (const scenario of event.meta.scenarios ?? []) {
        Object.keys(scenario).forEach(k => used.add(k));
      }
    }

    expect([...used].filter(key => !declared.has(key))).toEqual([]);
  });

  test('every collection points at a folder that exists', () => {
    for (const c of config.collections) {
      const folder = path.join(repoRoot, c.folder);
      expect(fs.existsSync(folder), `${c.name} -> ${c.folder}`).toBe(true);
    }
  });

  test('the CMS script is pinned to an exact version', () => {
    const html = fs.readFileSync(path.join(repoRoot, 'public/admin.html'), 'utf-8');
    const src = html.match(/src="([^"]+sveltia-cms[^"]*)"/)?.[1] ?? '';
    expect(src).toMatch(/@sveltia\/cms@\d+\.\d+\.\d+\//);
  });
});
