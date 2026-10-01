/** Hostnames that serve the real site. Anything else is a preview or local copy. */
export const PRODUCTION_HOSTS = new Set(["shiftingcorridors.com", "www.shiftingcorridors.com"]);

export const isProductionHost = (url: URL) => PRODUCTION_HOSTS.has(url.hostname);
