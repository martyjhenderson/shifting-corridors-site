/** The lodge meets in Eastern Iowa; "today" means today there, not in UTC. */
export const LODGE_TIMEZONE = "America/Chicago";

/** Today's date in the lodge's timezone as YYYY-MM-DD, comparable to an event's `date`. */
export function todayInLodgeTimezone(now: Date = new Date()): string {
	// en-CA formats as YYYY-MM-DD.
	return new Intl.DateTimeFormat("en-CA", { timeZone: LODGE_TIMEZONE }).format(now);
}
