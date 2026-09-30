/**
 * The month calendar from the React site (../src/components/Calendar.tsx),
 * rendered on the server and hydrated for month navigation and day selection.
 *
 * Days are handled as YYYY-MM-DD strings and built with UTC arithmetic, so no
 * timezone can shift an event onto the neighboring day. "Today" is today in the
 * lodge's timezone on both server and browser, which keeps the two renders
 * identical for hydration.
 */
import { useMemo, useState } from "react";
import { todayInLodgeTimezone } from "../utils/dates";

export interface CalendarEvent {
	date: string;
	title: string;
	slug: string;
}

const MONTHS = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toKey = (d: Date) => d.toISOString().slice(0, 10);

function parseKey(key: string) {
	const [year, month, day] = key.split("-").map(Number);
	return { year, month: month - 1, day };
}

/** Sunday-to-Saturday weeks covering the month, as YYYY-MM-DD keys. */
function calendarDays(year: number, month: number): string[] {
	const first = new Date(Date.UTC(year, month, 1));
	const last = new Date(Date.UTC(year, month + 1, 0));
	const day = new Date(first);
	day.setUTCDate(1 - first.getUTCDay());
	const end = new Date(last);
	end.setUTCDate(last.getUTCDate() + (6 - last.getUTCDay()));

	const days: string[] = [];
	for (; day <= end; day.setUTCDate(day.getUTCDate() + 1)) days.push(toKey(day));
	return days;
}

function formatDate(key: string) {
	const { year, month, day } = parseKey(key);
	return `${MONTHS[month]} ${day}, ${year}`;
}

function RssIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
			<circle cx="6.18" cy="17.82" r="2.18" />
			<path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
		</svg>
	);
}

export default function Calendar({ events }: { events: CalendarEvent[] }) {
	const today = todayInLodgeTimezone();
	const start = parseKey(today);
	const [view, setView] = useState({ year: start.year, month: start.month });
	const [selected, setSelected] = useState(today);

	const eventsByDate = useMemo(() => {
		const map = new Map<string, CalendarEvent[]>();
		for (const event of events) map.set(event.date, [...(map.get(event.date) ?? []), event]);
		return map;
	}, [events]);

	const shiftMonth = (by: number) =>
		setView(({ year, month }) => {
			const d = new Date(Date.UTC(year, month + by, 1));
			return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
		});

	const selectedEvents = eventsByDate.get(selected) ?? [];

	return (
		<div className="card calendar">
			<div className="calendar-title-row">
				<h2>Event Calendar</h2>
				<a className="rss-link" href="/feed.xml" title="Subscribe to calendar RSS feed" aria-label="RSS feed">
					<RssIcon />
				</a>
			</div>

			<div className="calendar-header">
				<button type="button" className="calendar-nav-button" onClick={() => shiftMonth(-1)}>
					Previous
				</button>
				<div className="calendar-month" aria-live="polite">
					{MONTHS[view.month]} {view.year}
				</div>
				<button type="button" className="calendar-nav-button" onClick={() => shiftMonth(1)}>
					Next
				</button>
			</div>

			<div className="calendar-grid">
				{DAY_HEADERS.map((day) => (
					<div key={day} className="calendar-day-header">
						{day}
					</div>
				))}
				{calendarDays(view.year, view.month).map((key) => {
					const { month, day } = parseKey(key);
					const classes = [
						"calendar-day",
						month !== view.month && "other-month",
						key === today && "today",
						key === selected && "selected",
						eventsByDate.has(key) && "has-event",
					].filter(Boolean);
					return (
						<button
							key={key}
							type="button"
							className={classes.join(" ")}
							aria-pressed={key === selected}
							aria-label={`${formatDate(key)}${eventsByDate.has(key) ? ", has events" : ""}`}
							onClick={() => setSelected(key)}
						>
							{day}
						</button>
					);
				})}
			</div>

			<div className="event-list">
				<h3>Events on {formatDate(selected)}</h3>
				{selectedEvents.length > 0 ? (
					selectedEvents.map((event) => (
						<div key={event.slug} className="event-item">
							<a className="event-link" href={`/events/${event.slug}`}>
								{event.title}
							</a>
						</div>
					))
				) : (
					<p>No events scheduled for this date.</p>
				)}
			</div>
		</div>
	);
}
