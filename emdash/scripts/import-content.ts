/**
 * One-off import of the markdown content in ../src/content into EmDash.
 *
 *   node scripts/import-content.ts --dry-run
 *   node scripts/import-content.ts --url http://localhost:4321
 *   EMDASH_TOKEN=ec_pat_... node scripts/import-content.ts --url https://<worker>.workers.dev
 *
 * Every file is mapped and checked before anything is written, so a bad file
 * stops the run without leaving half an import behind. Each entry is created
 * with the filename as its slug and then published.
 *
 * An entry whose slug already exists is skipped, so re-running after a partial
 * failure is safe and never overwrites edits made in the admin since. Pass
 * --overwrite to replace existing entries with the markdown version.
 *
 * Localhost needs no token: the client uses the dev server's bypass sign-in.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";
import { EmDashApiError, EmDashClient } from "emdash/client";
import { mapEntry, type MappedEntry, type SourceCollection } from "./lib/map-content.ts";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const CONTENT_DIR = path.join(REPO_ROOT, "src/content");
const COLLECTIONS: SourceCollection[] = ["calendar", "news", "gamemasters"];

// The site's own front-matter parser: YAML 1.2, so `17:30` stays a string
// instead of becoming the base-60 integer 1050. See scripts/lib/frontmatter.js.
const require = createRequire(path.join(REPO_ROOT, "scripts/"));
const { parseFrontMatter } = require("./lib/frontmatter.js") as {
	parseFrontMatter: (input: string) => { data: Record<string, unknown>; content: string };
};

const { values: args } = parseArgs({
	options: {
		url: { type: "string", default: "http://localhost:4321" },
		"dry-run": { type: "boolean", default: false },
		overwrite: { type: "boolean", default: false },
	},
});

function readSources(): MappedEntry[] {
	const mapped: MappedEntry[] = [];
	const errors: string[] = [];
	for (const collection of COLLECTIONS) {
		const dir = path.join(CONTENT_DIR, collection);
		for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
			const { data, content } = parseFrontMatter(fs.readFileSync(path.join(dir, file), "utf8"));
			try {
				mapped.push(mapEntry({ collection, slug: path.basename(file, ".md"), meta: data, body: content }));
			} catch (error) {
				errors.push((error as Error).message);
			}
		}
	}
	if (errors.length > 0) {
		console.error(`${errors.length} file(s) can't be imported; nothing was written:\n  ${errors.join("\n  ")}`);
		process.exit(1);
	}
	return mapped;
}

function createClient(): EmDashClient {
	const { hostname } = new URL(args.url);
	const token = process.env.EMDASH_TOKEN;
	const local = hostname === "localhost" || hostname === "127.0.0.1";
	if (!token && !local) {
		console.error("Set EMDASH_TOKEN (Settings → API Tokens in the admin) to import into a remote site.");
		process.exit(1);
	}
	return new EmDashClient({ baseUrl: args.url, token, devBypass: !token && local });
}

async function findBySlug(client: EmDashClient, collection: string, slug: string) {
	try {
		return await client.get(collection, slug);
	} catch (error) {
		if (error instanceof EmDashApiError && error.status === 404) return null;
		throw error;
	}
}

async function main() {
	const entries = readSources();
	const counts = Object.fromEntries(COLLECTIONS.map((c) => [c, 0]));
	for (const e of entries) counts[e.collection === "events" ? "calendar" : e.collection]++;
	console.log(`Read ${entries.length} files: ${JSON.stringify(counts)}`);
	for (const e of entries) for (const note of e.notes) console.log(`  note: ${e.collection}/${e.slug}: ${note}`);

	if (args["dry-run"]) {
		console.log("Dry run: every file maps cleanly. Nothing was written.");
		return;
	}

	const client = createClient();
	const result = { created: 0, overwritten: 0, skipped: 0, failed: 0 };
	for (const entry of entries) {
		const label = `${entry.collection}/${entry.slug}`;
		// The client converts a markdown string in a Portable Text field itself.
		const data = entry.richText ? { ...entry.data, [entry.richText.field]: entry.richText.markdown } : entry.data;
		try {
			const existing = await findBySlug(client, entry.collection, entry.slug);
			let id: string;
			if (!existing) {
				id = (await client.create(entry.collection, { slug: entry.slug, data })).id;
				result.created++;
			} else if (args.overwrite) {
				id = (await client.update(entry.collection, existing.id, { data, _rev: existing._rev })).id;
				result.overwritten++;
			} else {
				result.skipped++;
				continue;
			}
			await client.publish(entry.collection, id);
		} catch (error) {
			result.failed++;
			console.error(`  FAILED ${label}: ${(error as Error).message}`);
		}
	}
	console.log(
		`Done: ${result.created} created, ${result.overwritten} overwritten, ${result.skipped} skipped (already there), ${result.failed} failed.`,
	);
	if (result.failed > 0) process.exit(1);
}

await main();
