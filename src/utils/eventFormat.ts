/**
 * Display helpers for the structured event fields.
 *
 * `formatTime` is duplicated in scripts/lib/event-markdown.js, which the RSS
 * build step uses — that script runs under plain node and can't import this
 * TypeScript module. Keep the two in sync if the format changes.
 */

import type { MarkdownMeta, Scenario } from './staticData';

/** "17:30" -> "5:30 PM". Returns the input unchanged if it isn't a HH:MM time. */
export const formatTime = (value: string): string => {
  const m = String(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return String(value);

  const hours = parseInt(m[1], 10);
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${m[2]} ${meridiem}`;
};

/** "5:30 PM - 9:30 PM", "5:30 PM", or "All day". */
export const formatTimeRange = (meta: MarkdownMeta): string | null => {
  if (meta.allDay) return 'All day';
  if (!meta.startTime) return null;

  const start = formatTime(meta.startTime);
  return meta.endTime ? `${start} - ${formatTime(meta.endTime)}` : start;
};

/**
 * The parenthetical shown after a scenario's name — "Pathfinder 2E Scenario,
 * Levels 1-4, 6 players". Built from whichever fields the event actually has.
 */
export const formatScenarioTags = (scenario: Scenario): string => {
  const tags: string[] = [];

  const system = [scenario.system, scenario.edition, scenario.type]
    .filter(Boolean)
    .join(' ');
  if (system) tags.push(system);

  if (scenario.levels) tags.push(`Levels ${scenario.levels}`);
  if (scenario.startTime) tags.push(formatTime(scenario.startTime));
  if (scenario.playerCap) tags.push(`${scenario.playerCap} players`);
  if (scenario.pregens) tags.push('Pregenerated characters');
  if (scenario.repeatable) tags.push('Repeatable');

  return tags.join(', ');
};

/**
 * The "Please register in advance…" line, regenerated from the structured
 * fields. It was boilerplate prose repeated in 98 of 103 event files, varying
 * only by player count; events with something genuinely different to say keep
 * that text in their markdown body instead.
 */
export const formatRegistrationNote = (meta: MarkdownMeta): string | null => {
  const signups = (meta.scenarios ?? []).filter(s => s.signupUrl && !s.cancelled);
  if (signups.length === 0) return null;

  const link = signups.length === 1 ? 'link' : 'links';
  const limit = meta.playerCap
    ? ` Space is limited to ${meta.playerCap} players${signups.length > 1 ? ' per game' : ''}, so sign up early!`
    : ' Space is limited, so sign up early!';

  return `Please register in advance using the ${link} above.${limit}`;
};
