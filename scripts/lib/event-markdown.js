/**
 * Parsers that lift the hand-written prose in a calendar event's markdown body
 * into structured front-matter fields.
 *
 * These exist because event bodies were authored by hand and duplicate their
 * own front-matter — "- **Date:** October 2, 2025" restating `date:`. Promoting
 * time, player cap and the scenario list to real fields is what lets a CMS form
 * generate an event, so this module is the one-time bridge between the two
 * shapes. It's kept out of the migration script proper (and out of
 * build-content.js) so the fiddly regex work can be tested directly.
 */

const SYSTEMS = ['Pathfinder', 'Starfinder'];
const TYPES = ['Scenario', 'Quest', 'Adventure', 'Bounty', 'Module', 'One-Shot'];

/** Map a case-insensitive match back to its canonical spelling ("one-shot" -> "One-Shot"). */
const canonical = (list, value) => list.find(v => v.toLowerCase() === value.toLowerCase());

/**
 * Rewrite the clock spellings used in this content set into something a single
 * time regex can read. "12:00 noon" is the big one — 28 of 103 events use it,
 * and left alone a range like "12:00 noon - 4:00 PM" silently parses as a lone
 * 4 PM start with no end.
 */
const normalizeClock = str =>
  String(str)
    .replace(/(\d{1,2}:\d{2})\s*noon/gi, '$1 PM')
    .replace(/(\d{1,2}:\d{2})\s*midnight/gi, '$1 AM')
    .replace(/\bnoon\b/gi, '12:00 PM')
    .replace(/\bmidnight\b/gi, '12:00 AM');

const TIME_RE = /\d{1,2}:\d{2}\s*[AP]\.?M\.?/gi;

/**
 * "5:30 PM" -> "17:30". Returns null if there's no clock time in the string.
 */
function parseTime(str) {
  const m = normalizeClock(str).match(/(\d{1,2}):(\d{2})\s*([AP])\.?M\.?/i);
  if (!m) return null;

  let hours = parseInt(m[1], 10);
  const meridiem = m[3].toUpperCase();
  if (meridiem === 'P' && hours !== 12) hours += 12;
  if (meridiem === 'A' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${m[2]}`;
}

/**
 * "12:00 noon - 4:00 PM Central Time" -> { startTime: '12:00', endTime: '16:00' }
 * "All Day Event" -> { allDay: true }
 * A lone time yields only startTime; an unreadable string yields {}.
 */
function parseTimeRange(str) {
  const normalized = normalizeClock(str);

  if (/all[- ]day/i.test(normalized)) return { allDay: true };

  const times = normalized.match(TIME_RE) || [];
  const out = {};
  if (times[0]) out.startTime = parseTime(times[0]);
  if (times[1]) out.endTime = parseTime(times[1]);
  return out;
}

/**
 * Classify one comma-separated token from a scenario's parenthetical, e.g. the
 * "Pathfinder Scenario" / "Levels 3-6" / "starts 5:30 PM" / "5 players" pieces
 * of "(Pathfinder Scenario, Levels 3-6, starts 5:30 PM)".
 *
 * Mutates `out` and returns true when the token was understood; false means the
 * caller should flag the line for a human, since silently dropping an
 * unrecognized token would lose information.
 */
function classifyScenarioToken(token, out) {
  const t = token.trim().replace(/^\*\*|\*\*$/g, '').trim();
  if (!t) return true;

  let m;

  if ((m = t.match(/^Levels?\s+(.+)$/i))) {
    out.levels = m[1].trim();
    return true;
  }

  // "Pathfinder", "Pathfinder Scenario", "Starfinder 2E Scenario"
  if (
    (m = t.match(
      new RegExp(`^(${SYSTEMS.join('|')})(?:\\s+(\\d)E)?(?:\\s+(${TYPES.join('|')}))?$`, 'i')
    ))
  ) {
    out.system = canonical(SYSTEMS, m[1]);
    if (m[2]) out.edition = `${m[2]}E`;
    if (m[3]) out.type = canonical(TYPES, m[3]);
    return true;
  }

  if ((m = t.match(new RegExp(`^(${TYPES.join('|')})$`, 'i')))) {
    out.type = canonical(TYPES, m[1]);
    return true;
  }

  if (/^repeatable$/i.test(t)) {
    out.repeatable = true;
    return true;
  }

  if (/^pregenerated characters$/i.test(t)) {
    out.pregens = true;
    return true;
  }

  if (/^cancell?ed$/i.test(t)) {
    out.cancelled = true;
    return true;
  }

  // "5:30 PM - 8:30 PM", "starts 5:30 PM", "starting at 5:30 PM"
  if (TIME_RE.test(normalizeClock(t))) {
    TIME_RE.lastIndex = 0; // the regex is /g; reset before the caller reuses it
    Object.assign(out, parseTimeRange(t));
    return true;
  }
  TIME_RE.lastIndex = 0;

  if ((m = t.match(/^(\d+)\s+players?$/i))) {
    out.playerCap = parseInt(m[1], 10);
    return true;
  }

  return false;
}

/**
 * Parse one numbered scenario line into a structured scenario.
 *
 * Handles the shapes actually present in src/content/calendar, e.g.:
 *   1. **Name** (Levels 1-4) - [Sign up here](url)
 *   2. **Name** (Pathfinder Scenario, Levels 3-6) - Starting at 5:30 PM - [Sign up here](url)
 *   3. **Name** (Starfinder) - GM: Bret I - [Sign up here](url)
 *   4. **Name** (Starfinder Scenario, Levels 1-2) - **6:00 PM - 9:00 PM** - **CANCELLED**
 *
 * Returns { scenario, unparsed } where `unparsed` lists fragments we didn't
 * recognize. A caller seeing a non-empty `unparsed` should flag the file rather
 * than trust the result.
 */
function parseScenarioLine(line) {
  const unparsed = [];
  let rest = line.replace(/^\s*\d+\.\s*/, '').trim();

  // Signup link: "[Sign up here](url)" or any trailing markdown link.
  const link = rest.match(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/);
  const scenario = {};
  if (link) {
    scenario.signupUrl = link[2];
    rest = rest.replace(link[0], '').trim();
  }

  // Names are normally bolded, but not every author did; fall back to the text
  // up to the parenthetical or the first " - " separator. Requiring one of those
  // to follow keeps plain prose from being read as a nameless scenario.
  const name = rest.match(/^\*\*(.+?)\*\*/) || rest.match(/^([^(*[]+?)(?=\s*\(|\s+-\s+)/);
  if (!name || !name[1].trim()) {
    return { scenario: null, unparsed: [line.trim()] };
  }
  scenario.name = name[1].trim();
  rest = rest.slice(name[0].length).trim();

  // Parenthetical immediately after the name carries system/type/levels/time.
  const paren = rest.match(/^\(([^)]*)\)/);
  if (paren) {
    for (const token of paren[1].split(',')) {
      if (!classifyScenarioToken(token, scenario)) unparsed.push(token.trim());
    }
    rest = rest.slice(paren[0].length).trim();
  }

  // Whatever is left is " - "-delimited: "GM: Bret I", "**6:00 PM - 9:00 PM**".
  // Mask bold runs first so the " - " inside a bolded time range doesn't split
  // it into two unreadable halves.
  const bolds = [];
  const masked = rest.replace(/\*\*[^*]+\*\*/g, match => `\u0000${bolds.push(match) - 1}\u0000`);
  const unmask = str => str.replace(/\u0000(\d+)\u0000/g, (_, i) => bolds[i]);

  for (const segment of masked.split(/\s+-\s+/)) {
    const s = unmask(segment).trim().replace(/^-\s*/, '').replace(/\s*-$/, '').trim();
    if (!s) continue;

    let m;
    if ((m = s.match(/^\*{0,2}GM:\s*(.+?)\*{0,2}$/i))) {
      scenario.gamemaster = m[1].trim();
    } else if (!classifyScenarioToken(s, scenario)) {
      unparsed.push(s);
    }
  }

  return { scenario, unparsed };
}

/**
 * Parse a "## Details" bullet into a front-matter field.
 *
 * Returns { field, value } for a recognized bullet, or null for anything we
 * don't map (Discord, Starting Gear, …) so the caller can leave those bullets
 * in the body instead of dropping them.
 *
 * Date/Location/Address are recognized but return field `null` — they restate
 * existing front-matter, so they're removed from the body without being lifted.
 */
function parseDetailBullet(line) {
  const m = line.match(/^\s*-\s*\*\*([^:*]+):\*\*\s*(.*)$/);
  if (!m) return null;

  const label = m[1].trim().toLowerCase();
  const value = m[2].trim();

  switch (label) {
    case 'date':
    case 'location':
    case 'address':
      return { field: null, value, label };
    case 'time': {
      const times = parseTimeRange(value);
      // An unreadable time is worth a human's attention, not a silent drop.
      return Object.keys(times).length ? { field: 'time', value: times, label } : null;
    }
    case 'players':
    case 'seats available': {
      const n = value.match(/(\d+)/);
      return n ? { field: 'playerCap', value: parseInt(n[1], 10), label } : null;
    }
    case 'level range':
    case 'level':
      return { field: 'levels', value: value.replace(/^Levels?\s+/i, ''), label };
    case 'special note':
      return { field: 'specialNote', value, label };
    case 'game master':
      return { field: 'gamemaster', value, label };
    default:
      return null;
  }
}

/**
 * Interpret a "### " subheading inside the scenarios section as context that
 * applies to every scenario listed under it — "### Starfinder Society" groups
 * Starfinder games, "### 9:00 AM Session" groups games at that start time.
 *
 * Returns the fields to layer under each following scenario, or null if the
 * subheading means something we don't recognize.
 */
function parseScenarioGroupHeading(heading) {
  const h = heading.replace(/^#+\s*/, '').trim();

  const system = SYSTEMS.find(s => new RegExp(`^${s}\\b`, 'i').test(h));
  if (system) return { system };

  const times = parseTimeRange(h);
  if (times.startTime) return { startTime: times.startTime };

  return null;
}

/**
 * Split markdown into a preamble plus one entry per "## " heading, preserving
 * each section's raw lines so unrecognized content can be written back verbatim.
 */
function splitSections(markdown) {
  const sections = [];
  let current = { heading: null, lines: [] };

  for (const line of markdown.split('\n')) {
    if (/^##\s+/.test(line)) {
      sections.push(current);
      current = { heading: line.replace(/^##\s+/, '').trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  return sections;
}

/**
 * True for the near-identical "Please register in advance…" boilerplate carried
 * by 98 of 103 events, which is regenerated from playerCap at render time. Any
 * registration prose that says something else is left alone.
 */
function isBoilerplateRegistration(text) {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return true;
  return /^Please register in advance using the links? above\.( Space is limited[^.!]*[.!])?$/i.test(t);
}

/**
 * "17:30" -> "5:30 PM", for display. The UI has its own copy of this in
 * src/utils/eventFormat.ts — this one exists because the RSS feed is generated
 * by a plain-node build script that can't import the TypeScript module.
 */
function formatTime(value) {
  const m = String(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return String(value);

  const hours = parseInt(m[1], 10);
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${m[2]} ${meridiem}`;
}

module.exports = {
  parseTime,
  parseTimeRange,
  formatTime,
  classifyScenarioToken,
  parseScenarioLine,
  parseDetailBullet,
  parseScenarioGroupHeading,
  splitSections,
  isBoilerplateRegistration,
};
