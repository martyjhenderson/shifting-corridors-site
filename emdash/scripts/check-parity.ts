/**
 * Compares the EmDash site with the current React site, page by page, as a
 * visitor sees them: every event page, the home page, the RSS feed, and an
 * unknown URL.
 *
 *   # in one terminal:  npm run dev              (repo root, React site on :3000)
 *   # in another:       npm run dev -- --port 4399   (emdash/, after importing)
 *   node scripts/check-parity.ts --old http://localhost:3000 --new http://localhost:4399
 *
 * Pages are rendered in Chrome (the React site is client-side only) and
 * compared on visible text and link targets, so a formatting slip — a field
 * missing, a date off by one, markdown left as literal asterisks — shows up as
 * a text difference. Exits non-zero on any difference.
 *
 * Uses the repo root's Playwright and the system Chrome, like ../e2e.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const { chromium } = require("playwright") as typeof import("playwright");

const { values: args } = parseArgs({
	options: {
		old: { type: "string", default: "http://localhost:3000" },
		new: { type: "string", default: "http://localhost:4321" },
		only: { type: "string" },
	},
});

type Snapshot = { text: string; links: string[] };
const problems: string[] = [];

const normalize = (s: string) =>
	s
		.replace(/ /g, " ")
		.replace(/[ \t]+/g, " ")
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean)
		.join("\n");

function firstDifference(a: string, b: string) {
	const x = a.split("\n");
	const y = b.split("\n");
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		if (x[i] !== y[i]) return `line ${i + 1}\n      old: ${JSON.stringify(x[i])}\n      new: ${JSON.stringify(y[i])}`;
	}
	return "";
}

function compare(label: string, a: Snapshot, b: Snapshot) {
	if (a.text !== b.text) problems.push(`${label}: text differs at ${firstDifference(a.text, b.text)}`);
	const la = a.links.join("\n");
	const lb = b.links.join("\n");
	if (la !== lb) problems.push(`${label}: links differ at ${firstDifference(la, lb)}`);
}

const browser = await chromium.launch({ channel: "chrome", args: ["--no-sandbox"] });

/** Text and hrefs inside `selector`, read after client-side rendering settles. */
async function snapshot(url: string, selector: string, contextSelector = "h1"): Promise<Snapshot> {
	// A fresh context per page, so a theme saved by one page can't restyle the next.
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.goto(url, { waitUntil: "networkidle" });
	await page.locator(contextSelector).first().waitFor();
	const result = await page.locator(selector).first().evaluate((el: HTMLElement) => ({
		text: el.innerText,
		links: [...el.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? ""),
	}));
	await context.close();
	return { text: normalize(result.text), links: result.links };
}

// ---- Event pages: the card holding the title, on both sites ----
const EVENT_CARD = "h1 >> xpath=..";
const slugs = fs
	.readdirSync(path.join(REPO_ROOT, "src/content/calendar"))
	.filter((f) => f.endsWith(".md"))
	.map((f) => path.basename(f, ".md"))
	.filter((s) => !args.only || s.includes(args.only))
	.sort();

let checked = 0;
for (const slug of slugs) {
	try {
		const [a, b] = await Promise.all([
			snapshot(`${args.old}/events/${slug}`, EVENT_CARD),
			snapshot(`${args.new}/events/${slug}`, EVENT_CARD),
		]);
		compare(`/events/${slug}`, a, b);
	} catch (error) {
		problems.push(`/events/${slug}: ${(error as Error).message.split("\n")[0]}`);
	}
	if (++checked % 20 === 0) console.log(`  ${checked}/${slugs.length} event pages`);
}
console.log(`Checked ${checked} event pages.`);

if (!args.only) {
	// ---- Home page: both columns ----
	for (const region of ["main", "aside"]) {
		const [a, b] = await Promise.all([
			snapshot(`${args.old}/`, region, ".calendar-day"),
			snapshot(`${args.new}/`, region, ".calendar-day"),
		]);
		compare(`/ <${region}>`, a, b);
	}
	console.log("Checked the home page.");

	// ---- Feed: the same items, links, and descriptions; pubDate may differ ----
	const items = (xml: string) =>
		[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
			.map(([, item]) => item.replace(/<pubDate>.*?<\/pubDate>/, "").replace(/\s+/g, " ").trim())
			.sort();
	const [oldFeed, newFeed] = await Promise.all(
		[args.old, args.new].map(async (base) => items(await (await fetch(`${base}/feed.xml`)).text())),
	);
	const missing = oldFeed.filter((i) => !newFeed.includes(i));
	const extra = newFeed.filter((i) => !oldFeed.includes(i));
	if (missing.length || extra.length) {
		problems.push(
			`/feed.xml: ${missing.length} item(s) only in the old feed, ${extra.length} only in the new` +
				(missing[0] ? `\n      e.g. old: ${missing[0].slice(0, 200)}\n           new: ${(extra[0] ?? "").slice(0, 200)}` : ""),
		);
	}
	console.log(`Checked the feed (${oldFeed.length} old items, ${newFeed.length} new).`);

	// ---- Unknown URL: same message; the new site should also answer 404 ----
	const [a, b] = await Promise.all([
		snapshot(`${args.old}/events/no-such-event`, EVENT_CARD),
		snapshot(`${args.new}/events/no-such-event`, EVENT_CARD),
	]);
	compare("/events/no-such-event", a, b);
	const status = (await fetch(`${args.new}/events/no-such-event`)).status;
	if (status !== 404) problems.push(`/events/no-such-event: new site answered ${status}, expected 404`);
	console.log("Checked an unknown event URL.");
}

await browser.close();

if (problems.length) {
	console.error(`\n${problems.length} difference(s):\n  ${problems.join("\n  ")}`);
	process.exit(1);
}
console.log("\nNo differences.");
