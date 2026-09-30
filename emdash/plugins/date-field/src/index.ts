import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

/**
 * Date-only and time-only pickers for string fields. Select one on a field with
 * `"widget": "date-field:date"` or `"widget": "date-field:time"`.
 *
 * EmDash's own `datetime` field is an instant stored in UTC, which suits a
 * publication time but not an event date: "Oct 15" is a day on the lodge's
 * calendar, not a moment. This widget keeps the value a plain `YYYY-MM-DD`
 * string, so it sorts and indexes as text and never shifts across a timezone.
 * Times likewise stay a wall-clock `HH:MM`.
 */
const ID = "date-field";
const VERSION = "0.1.0";
const ADMIN_ENTRY = "@shifting-corridors/plugin-date-field/admin";

export function dateFieldPlugin(): PluginDescriptor {
	return {
		id: ID,
		version: VERSION,
		format: "native",
		entrypoint: "@shifting-corridors/plugin-date-field",
		adminEntry: ADMIN_ENTRY,
	};
}

export function createPlugin() {
	return definePlugin({
		id: ID,
		version: VERSION,
		admin: {
			entry: ADMIN_ENTRY,
			fieldWidgets: [
				{ name: "date", label: "Date picker", fieldTypes: ["string"] },
				{ name: "time", label: "Time picker", fieldTypes: ["string"] },
			],
		},
	});
}

export default createPlugin;
