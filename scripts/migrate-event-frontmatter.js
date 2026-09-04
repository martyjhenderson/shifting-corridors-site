#!/usr/bin/env node

/**
 * One-time migration: lift the hand-written "## Details" / "## Available
 * Scenarios" prose in each calendar event into structured front-matter, so the
 * CMS can render a form instead of asking authors to reproduce a prose layout.
 *
 * Also drops the `url:` field, which had to be kept in sync with the filename by
 * hand — both consumers already fall back to the slug.
 *
 * Run with --dry to preview the report without touching files.
 *
 *   node scripts/migrate-event-frontmatter.js --dry
 *   node scripts/migrate-event-frontmatter.js
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const {
  parseScenarioLine,
  parseDetailBullet,
  parseScenarioGroupHeading,
  splitSections,
  isBoilerplateRegistration,
} = require('./lib/event-markdown');

const CALENDAR_DIR = path.join(__dirname, '../src/content/calendar');
const SCENARIO_HEADINGS = ['available scenarios', 'scenario', 'scenarios', 'adventure'];

const DRY_RUN = process.argv.includes('--dry');

// Emit scenario keys in a fixed reading order so the generated YAML is
// reviewable in a diff, rather than following whatever order parsing happened to
// discover the fields in.
const SCENARIO_KEY_ORDER = [
  'name', 'system', 'edition', 'type', 'levels',
  'startTime', 'endTime', 'playerCap', 'gamemaster',
  'repeatable', 'pregens', 'cancelled', 'signupUrl',
];

const orderScenario = scenario => {
  const ordered = {};
  for (const key of SCENARIO_KEY_ORDER) {
    if (scenario[key] !== undefined) ordered[key] = scenario[key];
  }
  // Anything the key order doesn't know about still gets written out.
  for (const key of Object.keys(scenario)) {
    if (!(key in ordered)) ordered[key] = scenario[key];
  }
  return ordered;
};

// gray-matter hands back a JS Date for an unquoted `date:`. Writing that object
// straight back out would turn "2025-10-22" into a full UTC timestamp, so
// re-render it as the plain date string the content has always used.
const toDateString = value =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

/** Trim leading/trailing blank lines without touching interior spacing. */
const trimBlankLines = lines => {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start++;
  while (end > start && !lines[end - 1].trim()) end--;
  return lines.slice(start, end);
};

function migrateOne(raw, slug) {
  const { data: meta, content } = matter(raw);
  const notes = [];   // needs a human to look at the result
  const info = [];    // worth reporting, but handled correctly

  const next = {};
  // Values the Details bullets restate. Worth capturing rather than discarding:
  // 30 files carry an address like "119 2nd St #300, Coralville, IA 52241"
  // unquoted in their front-matter, where YAML reads " #300, …" as a comment and
  // silently truncates it to "119 2nd St". The bullet has the full string, and
  // it's the only copy left once we stop rendering the body's Details section.
  const restated = {};
  const bodySections = [];
  let scenarios = [];
  let cancelled = false;
  let intro = '';

  for (const section of splitSections(content)) {
    const heading = (section.heading || '').toLowerCase();

    // Preamble: H1, an optional cancellation blockquote, then the intro.
    if (section.heading === null) {
      const kept = [];
      for (const line of section.lines) {
        if (/^#\s+/.test(line)) continue; // title lives in front-matter
        if (/^>\s*\*\*This event has been cancelled\.?\*\*/i.test(line)) {
          cancelled = true;
          continue;
        }
        kept.push(line);
      }

      const paragraphs = trimBlankLines(kept)
        .join('\n')
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

      if (paragraphs.length) intro = paragraphs.shift();
      if (paragraphs.length) {
        notes.push(`preamble had ${paragraphs.length} extra paragraph(s), kept in body`);
        bodySections.push({ heading: null, lines: paragraphs.join('\n\n').split('\n') });
      }
      continue;
    }

    if (heading === 'details') {
      const leftover = [];
      for (const line of section.lines) {
        if (!line.trim()) continue;

        const parsed = parseDetailBullet(line);
        if (!parsed) {
          leftover.push(line);
          continue;
        }
        if (parsed.field === 'time') Object.assign(next, parsed.value);
        else if (parsed.field) next[parsed.field] = parsed.value;
        else restated[parsed.label] = parsed.value;
      }

      if (leftover.length) {
        notes.push(`${leftover.length} unrecognized Details bullet(s) kept in body`);
        // Not "Details" — that heading is now generated from front-matter, and
        // reusing it puts two identical headings on the page.
        bodySections.push({ heading: 'Additional Information', lines: leftover });
      }
      continue;
    }

    if (SCENARIO_HEADINGS.includes(heading)) {
      const leftover = [];

      // "### Starfinder Society" / "### 9:00 AM Session" group the scenarios
      // beneath them; carry that down as defaults rather than dropping it.
      let group = {};

      for (const line of section.lines) {
        if (!line.trim()) continue;

        if (/^\s*###\s+/.test(line)) {
          const parsedGroup = parseScenarioGroupHeading(line);
          if (parsedGroup) {
            group = parsedGroup;
          } else {
            group = {};
            leftover.push(line);
            notes.push(`unrecognized scenario subheading: ${line.trim()}`);
          }
          continue;
        }

        // A "> **Special Note:** …" blockquote is the same field the Details
        // section spells as a bullet.
        const quotedNote = line.match(/^>\s*\*\*Special Note:\*\*\s*(.+)$/i);
        if (quotedNote) {
          next.specialNote = quotedNote[1].trim();
          continue;
        }

        // Numbered list items in this section are scenarios even when the
        // author forgot to bold the name.
        if (!/^\s*(\d+\.\s|\*\*)/.test(line)) {
          leftover.push(line);
          continue;
        }

        const { scenario, unparsed } = parseScenarioLine(line);
        if (!scenario) {
          leftover.push(line);
          notes.push(`could not parse scenario line: ${line.trim()}`);
          continue;
        }
        if (unparsed.length) {
          notes.push(`unrecognized in "${scenario.name}": ${unparsed.join(' | ')}`);
        }
        // The scenario's own values win over its group's.
        scenarios.push(orderScenario({ ...group, ...scenario }));
      }

      if (leftover.length) {
        notes.push(`${leftover.length} non-scenario line(s) under "${section.heading}" kept in body`);
        bodySections.push({ heading: section.heading, lines: leftover });
      }
      continue;
    }

    if (heading === 'registration') {
      if (!isBoilerplateRegistration(section.lines.join('\n'))) {
        notes.push('registration prose is not boilerplate, kept in body');
        bodySections.push(section);
      }
      continue;
    }

    bodySections.push(section);
  }

  // Assemble front-matter in a deliberate reading order.
  let title = meta.title || '';
  if (/^\[CANCELLED\]\s*/i.test(title)) {
    title = title.replace(/^\[CANCELLED\]\s*/i, '');
    cancelled = true;
  }

  const out = { title, date: toDateString(meta.date) };

  // Prefer the body bullet: it's the copy YAML didn't mangle.
  const location = restated.location || meta.location;
  const address = restated.address || meta.address;
  if (location) out.location = location;
  if (address) out.address = address;
  if (meta.address && address !== meta.address) {
    info.push(`address recovered from body bullet (front-matter had "${meta.address}")`);
  }
  if (next.allDay) out.allDay = true;
  if (next.startTime) out.startTime = next.startTime;
  if (next.endTime) out.endTime = next.endTime;
  if (next.playerCap) out.playerCap = next.playerCap;
  if (next.levels) out.levels = next.levels;
  if (cancelled) out.cancelled = true;
  if (intro) out.intro = intro;
  if (next.specialNote) out.specialNote = next.specialNote;

  const gamemaster = next.gamemaster || meta.gamemaster;
  if (gamemaster) out.gamemaster = gamemaster;

  if (scenarios.length) out.scenarios = scenarios;

  // Anything in the old front-matter we didn't deliberately carry or drop.
  const handled = new Set([
    'title', 'date', 'url', 'location', 'address', 'gamemaster',
  ]);
  for (const key of Object.keys(meta)) {
    if (!handled.has(key)) {
      notes.push(`carried through unknown front-matter key: ${key}`);
      out[key] = meta[key];
    }
  }

  const body = bodySections
    .map(s => {
      const lines = trimBlankLines(s.lines);
      if (!lines.length) return '';
      return s.heading ? `## ${s.heading}\n\n${lines.join('\n')}` : lines.join('\n');
    })
    .filter(Boolean)
    .join('\n\n');

  return {
    slug,
    notes,
    info,
    scenarioCount: scenarios.length,
    // lineWidth: -1 disables YAML line folding, which otherwise wraps signup
    // URLs and intro text across lines as ">-" blocks — valid, but miserable to
    // read in a diff or edit by hand.
    output: matter.stringify(body ? `\n${body}\n` : '\n', out, { lineWidth: -1 }),
  };
}

function main() {
  const files = fs.readdirSync(CALENDAR_DIR).filter(f => f.endsWith('.md')).sort();
  const flagged = [];
  const recovered = [];
  let clean = 0;

  for (const file of files) {
    const full = path.join(CALENDAR_DIR, file);
    const result = migrateOne(fs.readFileSync(full, 'utf-8'), file.replace(/\.md$/, ''));

    if (!DRY_RUN) fs.writeFileSync(full, result.output);

    if (result.info.length) recovered.push(result);
    if (result.notes.length) flagged.push(result);
    else clean++;
  }

  console.log(`\n${DRY_RUN ? '[dry run] ' : ''}Migrated ${files.length} event files.`);
  console.log(`  ✅ ${clean} parsed cleanly`);
  console.log(`  🔧 ${recovered.length} had a truncated address repaired`);
  console.log(`  ⚠️  ${flagged.length} need review\n`);

  for (const r of flagged) {
    console.log(`  ${r.slug} (${r.scenarioCount} scenario${r.scenarioCount === 1 ? '' : 's'})`);
    for (const note of r.notes) console.log(`      - ${note}`);
  }
  console.log('');
}

if (require.main === module) main();

module.exports = { migrateOne };
