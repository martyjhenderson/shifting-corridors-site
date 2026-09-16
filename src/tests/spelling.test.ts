import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * The site is written in American English.
 *
 * The Lodge plays in Cedar Rapids and Coralville, and its audience is the
 * American Midwest, so "organizer" rather than "organiser". This caught five
 * British spellings that had drifted in, all of them in code written in one
 * sitting — which is exactly the kind of thing a person should not have to
 * notice twice.
 *
 * Scope is source and prose. It deliberately does not police:
 *
 *   `cancelled`  a front-matter key, not display text. Renaming it would be a
 *                breaking schema change across the content, the types and the
 *                rendering, for something nobody ever reads; and it is a normal
 *                American spelling anyway.
 *
 *   `grey`       appears once, in "Light Blue Grey" — the official name of a
 *                Material Design palette entry, so it is a proper noun here.
 */

const repoRoot = process.cwd();

/** British spelling -> what to write instead. */
const PREFER: Record<string, string> = {
  organis: 'organiz',
  recognis: 'recogniz',
  realis: 'realiz',
  normalis: 'normaliz',
  authoris: 'authoriz',
  minimis: 'minimiz',
  maximis: 'maximiz',
  summaris: 'summariz',
  serialis: 'serializ',
  initialis: 'initializ',
  sanitis: 'sanitiz',
  prioritis: 'prioritiz',
  categoris: 'categoriz',
  utilis: 'utiliz',
  apologis: 'apologiz',
  customis: 'customiz',
  colour: 'color',
  behaviour: 'behavior',
  favour: 'favor',
  honour: 'honor',
  neighbour: 'neighbor',
  labour: 'labor',
  centre: 'center',
  theatre: 'theater',
  fibre: 'fiber',
  defence: 'defense',
  licence: 'license',
  catalogue: 'catalog',
  whilst: 'while',
  amongst: 'among',
  programme: 'program',
  enrol: 'enroll',
  fulfil: 'fulfill',
  skilful: 'skillful',
};

const DIRS = ['src', 'worker', 'scripts', 'docs', '.github/workflows'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md', '.yml', '.yaml'];

/** This file names every British spelling on purpose. */
const SKIP = ['src/tests/spelling.test.ts'];

function filesToCheck(dir: string): string[] {
  const full = path.join(repoRoot, dir);
  if (!fs.existsSync(full)) return [];

  return fs
    .readdirSync(full, { withFileTypes: true })
    .flatMap(entry => {
      const rel = path.join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name.startsWith('.wrangler')) return [];
      if (entry.isDirectory()) return filesToCheck(rel);
      return EXTENSIONS.includes(path.extname(entry.name)) ? [rel] : [];
    })
    .filter(file => !SKIP.includes(file));
}

const files = DIRS.flatMap(filesToCheck);

describe('American spelling', () => {
  test('there are files to check', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  test('no British spellings in source or prose', () => {
    const found: string[] = [];

    for (const file of files) {
      const lines = fs.readFileSync(path.join(repoRoot, file), 'utf-8').split('\n');

      lines.forEach((line, i) => {
        for (const [british, american] of Object.entries(PREFER)) {
          // Word-ish boundary on the left so "polarise" inside a URL or an
          // identifier from a dependency does not trip it.
          const pattern = new RegExp(`\\b[a-z]*${british}`, 'i');
          const match = pattern.exec(line);
          if (match) {
            found.push(`${file}:${i + 1}  ${match[0]}  -> prefer "${american}"`);
          }
        }
      });
    }

    expect(found).toEqual([]);
  });
});
