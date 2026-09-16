/**
 * Turning a validated event back into the markdown file that stores it.
 *
 * Kept apart from eventSchema.ts because this is the only half that needs a YAML
 * serializer, and the submission form has no use for it — importing it there
 * would pull js-yaml into the site bundle for nothing.
 *
 * Front-matter is *dumped*, never interpolated into a template. That is not
 * style: a value carrying a `#`, a `:` or a newline breaks out of its field when
 * a template writes it, and this content set has already lost 30 addresses to an
 * unquoted `#`. js-yaml quotes what needs quoting, every time.
 */

// js-yaml 5 is ESM-first and has no default export.
import { dump } from 'js-yaml';

import type { EventMeta } from './eventSchema';

/**
 * The order fields appear in, so generated files read like the hand-written
 * ones. Anything absent from this list follows, alphabetically.
 */
const FIELD_ORDER = [
  'title',
  'date',
  'location',
  'address',
  'allDay',
  'startTime',
  'endTime',
  'playerCap',
  'levels',
  'gamemaster',
  'cancelled',
  'intro',
  'specialNote',
  'scenarios',
];

const SCENARIO_ORDER = [
  'name',
  'system',
  'edition',
  'type',
  'levels',
  'startTime',
  'endTime',
  'playerCap',
  'gamemaster',
  'repeatable',
  'pregens',
  'cancelled',
  'signupUrl',
];

function ordered<T extends Record<string, unknown>>(value: T, order: string[]): T {
  const keys = Object.keys(value).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return Object.fromEntries(keys.map(k => [k, value[k]])) as T;
}

/**
 * Serialize an event to the contents of its markdown file.
 *
 * The body is always empty. The site generates the date, time, scenario list and
 * registration note from the fields above, so prose here would only duplicate
 * them — and a body is the one place a submission could carry markup onto the
 * page, which is why the form does not offer one.
 */
export function buildEventMarkdown(event: EventMeta): string {
  const data: Record<string, unknown> = ordered(
    { ...event } as Record<string, unknown>,
    FIELD_ORDER
  );

  if (Array.isArray(data.scenarios)) {
    data.scenarios = data.scenarios.map(s =>
      ordered({ ...(s as Record<string, unknown>) }, SCENARIO_ORDER)
    );
  }

  const frontMatter = dump(data, {
    // Match what the existing files look like.
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    // Times like 17:30 must come back out as strings. js-yaml 5 is YAML 1.2, so
    // they would anyway, but saying so keeps it true if the engine is swapped.
    quoteStyle: 'single',
    forceQuotes: false,
  });

  return `---\n${frontMatter}---\n`;
}
