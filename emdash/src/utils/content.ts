import { getEmDashCollection, type CollectionFilter } from "emdash";
import type { EmDashCollections } from "emdash";

type Slug = keyof EmDashCollections;

/**
 * Every published entry in a collection, following the cursor past the
 * per-query limit. The calendar and the feed need all ~100 events, and a
 * single query would silently stop at the limit as the lodge adds more.
 */
export async function getAllEntries<C extends Slug>(
	collection: C,
	options: Pick<CollectionFilter, "where" | "orderBy" | "locale"> = {},
) {
	const entries = [];
	const cacheHints = [];
	let cursor: string | undefined;
	do {
		const page = await getEmDashCollection(collection, { ...options, limit: 100, cursor });
		if (page.error) throw page.error;
		entries.push(...page.entries);
		cacheHints.push(page.cacheHint);
		cursor = page.nextCursor;
	} while (cursor);
	return { entries, cacheHints };
}
