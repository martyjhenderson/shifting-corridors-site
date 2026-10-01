import { defineMiddleware } from "astro:middleware";
import { isProductionHost } from "./utils/hosts";

/**
 * Keep every copy of the site except the real one out of search results. The
 * workers.dev trial runs beside the live site with the same content, and an
 * indexed duplicate would compete with it.
 */
export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();
	if (!isProductionHost(context.url)) response.headers.set("X-Robots-Tag", "noindex, nofollow");
	return response;
});
