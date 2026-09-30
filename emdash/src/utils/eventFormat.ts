/**
 * Display helpers for the structured event fields, ported from the React
 * site's ../src/utils/eventFormat.ts with EmDash's snake_case field names.
 * The output must match it word for word: scripts/check-parity.ts compares
 * the two sites' event pages.
 */
import type { Event } from "../../emdash-env";

type Scenario = NonNullable<Event["scenarios"]>[number];
type EventTimes = Pick<Event, "all_day" | "start_time" | "end_time">;

/** "17:30" -> "5:30 PM". Returns the input unchanged if it isn't a HH:MM time. */
export const formatTime = (value: string): string => {
	const m = String(value).match(/^(\d{1,2}):(\d{2})$/);
	if (!m) return String(value);

	const hours = parseInt(m[1], 10);
	const meridiem = hours >= 12 ? "PM" : "AM";
	const hour12 = hours % 12 === 0 ? 12 : hours % 12;
	return `${hour12}:${m[2]} ${meridiem}`;
};

/** "5:30 PM - 9:30 PM", "5:30 PM", or "All day". */
export const formatTimeRange = (event: EventTimes): string | null => {
	if (event.all_day) return "All day";
	if (!event.start_time) return null;

	const start = formatTime(event.start_time);
	return event.end_time ? `${start} - ${formatTime(event.end_time)}` : start;
};

/**
 * "2025-10-22" -> "Wednesday, October 22, 2025". Built from the parts in UTC,
 * so the server's timezone can't move it to the previous day.
 */
export const formatEventDate = (value: string): string => {
	const [year, month, day] = value.split("-").map(Number);
	if (!year || !month || !day) return value;

	return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});
};

/**
 * The parenthetical shown after a scenario's name — "Pathfinder 2E Scenario,
 * Levels 1-4, 6 players". Built from whichever fields the event actually has.
 */
export const formatScenarioTags = (scenario: Scenario): string => {
	const tags: string[] = [];

	const system = [scenario.system, scenario.edition, scenario.type].filter(Boolean).join(" ");
	if (system) tags.push(system);

	if (scenario.levels) tags.push(`Levels ${scenario.levels}`);
	if (scenario.start_time) tags.push(formatTime(scenario.start_time));
	if (scenario.player_cap) tags.push(`${scenario.player_cap} players`);
	if (scenario.pregens) tags.push("Pregenerated characters");
	if (scenario.repeatable) tags.push("Repeatable");

	return tags.join(", ");
};

/** The "Please register in advance…" line, generated from the structured fields. */
export const formatRegistrationNote = (event: Pick<Event, "scenarios" | "player_cap">): string | null => {
	const signups = (event.scenarios ?? []).filter((s) => s.signup_url && !s.cancelled);
	if (signups.length === 0) return null;

	const link = signups.length === 1 ? "link" : "links";
	const limit = event.player_cap
		? ` Space is limited to ${event.player_cap} players${signups.length > 1 ? " per game" : ""}, so sign up early!`
		: " Space is limited, so sign up early!";

	return `Please register in advance using the ${link} above.${limit}`;
};
