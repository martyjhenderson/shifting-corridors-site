/**
 * The calendar RSS feed, ported from buildRssFeed() in
 * ../scripts/build-content.js. Items, links, GUIDs, and descriptions match it,
 * so feed readers see the same items after the switch. pubDate was the event
 * file's last git commit; it's now when the entry was last updated.
 */
import type { APIRoute } from "astro";
import { getAllEntries } from "../utils/content";
import { formatTime } from "../utils/eventFormat";

const SITE_URL = "https://shiftingcorridors.com";

const escapeXml = (str: unknown) =>
	String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "2026-10-15" -> "Thursday, October 15, 2026", as the old feed wrote it. */
const longDate = (date: string) =>
	new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});

export const GET: APIRoute = async () => {
	const { entries } = await getAllEntries("events", { orderBy: { date: "desc" } });
	const now = new Date();

	const items = entries
		.map(({ id, data }) => {
			const url = `${SITE_URL}/events/${id}`;
			const parts = [data.title, longDate(data.date)];
			if (data.all_day) parts.push("All day");
			else if (data.start_time) parts.push(formatTime(data.start_time));
			if (data.location) parts.push(data.location);
			if (data.address) parts.push(data.address);
			if (data.cancelled) parts.push("CANCELLED");

			return `    <item>
      <title>${escapeXml(data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${(data.updatedAt ?? now).toUTCString()}</pubDate>
      <description>${escapeXml(parts.join(" — "))}</description>
    </item>`;
		})
		.join("\n");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Shifting Corridors Lodge - Calendar</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Upcoming Pathfinder and Starfinder Society events from the Shifting Corridors Lodge</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			// Rebuilt per request, so cache briefly rather than serve it stale.
			"Cache-Control": "public, max-age=300",
		},
	});
};
