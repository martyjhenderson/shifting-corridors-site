/**
 * Front-matter parsing with a modern YAML schema.
 *
 * gray-matter bundles js-yaml 3.x, which implements YAML 1.1. That spec reads
 * an unquoted `17:30` as a base-60 integer — 1050 — so a time written without
 * quotes silently becomes a number and renders as "1050" instead of "5:30 PM".
 * Only hours 00-09 escape it, because the sexagesimal pattern requires a
 * leading 1-9. YAML 1.1 also coerces `2026-10-06` into a Date object.
 *
 * The CMS writes times unquoted, so every event a Game Master creates for an
 * evening game hit this. Routing gray-matter through js-yaml 5 (YAML 1.2 core)
 * fixes it at the reader: scalars stay strings unless they're unambiguously
 * something else, which is what the rest of the pipeline already assumes.
 */

const matter = require('gray-matter');
const yaml = require('js-yaml');

const engines = {
  yaml: {
    parse: str => yaml.load(str),
    stringify: (obj, options) => yaml.dump(obj, options),
  },
};

/** Drop-in for `matter(input)` that parses front-matter as YAML 1.2. */
const parseFrontMatter = input => matter(input, { engines });

/** Drop-in for `matter.stringify(body, data, options)`. */
const stringifyFrontMatter = (body, data, options = {}) =>
  matter.stringify(body, data, { ...options, engines });

module.exports = { parseFrontMatter, stringifyFrontMatter, engines };
