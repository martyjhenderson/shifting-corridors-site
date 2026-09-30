/**
 * Maps the markdown content in ../src/content onto the EmDash collections in
 * seed/seed.json. Pure, so it can be tested without a running site; the
 * importer (scripts/import-content.ts) does the I/O.
 *
 * Every front-matter key must be one this module knows. An unknown key throws
 * rather than being dropped, because silently losing a field on import is the
 * failure this migration can least afford.
 */

export type SourceCollection = "calendar" | "news" | "gamemasters";

export interface SourceEntry {
	collection: SourceCollection;
	/** Filename without `.md`. It becomes the EmDash slug, and so the URL. */
	slug: string;
	meta: Record<string, unknown>;
	/** Markdown body, still as markdown; the importer converts it. */
	body: string;
}

export interface MappedEntry {
	collection: "events" | "news" | "gamemasters";
	slug: string;
	data: Record<string, unknown>;
	/** Markdown for the collection's Portable Text field, if the body has any. */
	richText?: { field: "body" | "bio"; markdown: string };
	/** Things a human should look at, but that don't stop the import. */
	notes: string[];
}

const TARGET = { calendar: "events", news: "news", gamemasters: "gamemasters" } as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Front-matter key -> EmDash field, per source collection. */
const EVENT_FIELDS: Record<string, string> = {
	title: "title",
	date: "date",
	allDay: "all_day",
	startTime: "start_time",
	endTime: "end_time",
	location: "location",
	address: "address",
	playerCap: "player_cap",
	levels: "levels",
	cancelled: "cancelled",
	intro: "intro",
	specialNote: "special_note",
	gamemaster: "gamemaster",
	scenarios: "scenarios",
};

const SCENARIO_FIELDS: Record<string, string> = {
	name: "name",
	system: "system",
	edition: "edition",
	type: "type",
	levels: "levels",
	startTime: "start_time",
	endTime: "end_time",
	playerCap: "player_cap",
	gamemaster: "gamemaster",
	repeatable: "repeatable",
	pregens: "pregens",
	cancelled: "cancelled",
	signupUrl: "signup_url",
};

const NEWS_FIELDS: Record<string, string | null> = {
	title: "title",
	date: "date",
	// The article's slug. Checked against the filename below, not stored.
	id: null,
};

const GM_FIELDS: Record<string, string> = {
	title: "title",
	date: "date",
	firstName: "first_name",
	lastInitial: "last_initial",
	organizedPlayNumber: "organized_play_number",
	games: "games",
	ventureOfficer: "venture_officer",
};

class MappingError extends Error {
	constructor(entry: SourceEntry, message: string) {
		super(`${entry.collection}/${entry.slug}.md: ${message}`);
	}
}

function renameKeys(
	entry: SourceEntry,
	source: Record<string, unknown>,
	fields: Record<string, string | null>,
	where = "front-matter",
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(source)) {
		if (!(key in fields)) throw new MappingError(entry, `unknown ${where} key "${key}"`);
		const target = fields[key];
		if (target === null || value === undefined || value === null || value === "") continue;
		out[target] = value;
	}
	return out;
}

/**
 * A date as `YYYY-MM-DD`. The front-matter parser reads YAML 1.2, so dates
 * normally arrive as strings; a Date object is accepted too, read in UTC,
 * because YAML 1.1 parsers turn `2026-10-06` into UTC midnight.
 */
function toDate(entry: SourceEntry, value: unknown): string {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	const s = String(value);
	if (DATE_RE.test(s)) return s;
	throw new MappingError(entry, `date "${s}" isn't YYYY-MM-DD`);
}

function checkTime(entry: SourceEntry, field: string, value: unknown): string {
	const s = String(value);
	if (TIME_RE.test(s)) return s;
	throw new MappingError(entry, `${field} "${s}" isn't a 24-hour HH:MM time`);
}

function toInteger(entry: SourceEntry, field: string, value: unknown): number {
	const n = Number(value);
	if (Number.isInteger(n)) return n;
	throw new MappingError(entry, `${field} "${String(value)}" isn't a whole number`);
}

function mapEvent(entry: SourceEntry, notes: string[]): Record<string, unknown> {
	const data = renameKeys(entry, entry.meta, EVENT_FIELDS);

	if (!data.title) throw new MappingError(entry, "missing title");
	if (data.date === undefined) throw new MappingError(entry, "missing date");
	data.date = toDate(entry, data.date);
	for (const f of ["start_time", "end_time"]) if (f in data) data[f] = checkTime(entry, f, data[f]);
	if ("player_cap" in data) data.player_cap = toInteger(entry, "playerCap", data.player_cap);

	if ("scenarios" in data) {
		if (!Array.isArray(data.scenarios)) throw new MappingError(entry, "scenarios isn't a list");
		data.scenarios = data.scenarios.map((raw: Record<string, unknown>, i: number) => {
			const s = renameKeys(entry, raw, SCENARIO_FIELDS, `scenarios[${i}]`);
			if (!s.name) throw new MappingError(entry, `scenarios[${i}] has no name`);
			// The admin can't check these (repeater sub-fields take no pattern),
			// so check them here, where a bad value can still be fixed at source.
			for (const f of ["start_time", "end_time"]) if (f in s) s[f] = checkTime(entry, `scenarios[${i}].${f}`, s[f]);
			if ("player_cap" in s) s.player_cap = toInteger(entry, `scenarios[${i}].playerCap`, s.player_cap);
			return s;
		});
	}

	if (/^\s*\d+\.\s/m.test(entry.body) && !/^\s*1\.\s/m.test(entry.body)) {
		notes.push("numbered list doesn't start at 1; Portable Text lists always do, so it will renumber");
	}
	return data;
}

function mapNews(entry: SourceEntry): Record<string, unknown> {
	const data = renameKeys(entry, entry.meta, NEWS_FIELDS);
	if (entry.meta.id !== undefined && entry.meta.id !== entry.slug) {
		// The React site keys articles by filename, and so does EmDash's slug.
		throw new MappingError(entry, `id "${String(entry.meta.id)}" differs from the filename`);
	}
	if (!data.title) throw new MappingError(entry, "missing title");
	if (data.date === undefined) throw new MappingError(entry, "missing date");
	data.date = toDate(entry, data.date);
	if (!entry.body.trim()) throw new MappingError(entry, "news needs a body");
	return data;
}

function mapGameMaster(entry: SourceEntry, notes: string[]): Record<string, unknown> {
	const data = renameKeys(entry, entry.meta, GM_FIELDS);
	if (!data.first_name || !data.last_initial) throw new MappingError(entry, "missing firstName or lastInitial");
	if (!data.title) {
		// Only the admin list shows it; the older files never had one.
		data.title = `Game Master: ${data.first_name} ${data.last_initial}.`;
		notes.push(`no title; using "${data.title}"`);
	}
	if (data.date !== undefined) data.date = toDate(entry, data.date);
	if ("organized_play_number" in data) {
		data.organized_play_number = toInteger(entry, "organizedPlayNumber", data.organized_play_number);
	}
	if ("games" in data && !Array.isArray(data.games)) throw new MappingError(entry, "games isn't a list");
	return data;
}

/**
 * `*italic*` -> `_italic_`. EmDash's markdownToPortableText reads only the
 * underscore form and leaves `*italic*` as literal asterisks. `**bold**` and
 * `* list` bullets are left alone: the asterisk must not touch another
 * asterisk or be followed by a space.
 */
export function normalizeEmphasis(markdown: string): string {
	return markdown.replace(/(?<![*\w])\*(?![\s*])([^*\n]+?)(?<![\s*])\*(?![*\w])/g, "_$1_");
}

export function mapEntry(entry: SourceEntry): MappedEntry {
	const notes: string[] = [];
	const data =
		entry.collection === "calendar"
			? mapEvent(entry, notes)
			: entry.collection === "news"
				? mapNews(entry)
				: mapGameMaster(entry, notes);

	const markdown = normalizeEmphasis(entry.body.trim());
	const field = entry.collection === "gamemasters" ? "bio" : "body";
	return {
		collection: TARGET[entry.collection],
		slug: entry.slug,
		data,
		richText: markdown ? { field, markdown } : undefined,
		notes,
	};
}
