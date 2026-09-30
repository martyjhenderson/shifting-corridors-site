This is the Shifting Corridors Lodge site rebuilt on EmDash -- a CMS built on Astro with a full admin UI. It replaces the React site in the repo root; see `README.md` for the migration steps and what's done.

## Commands

```bash
npm run dev              # Start the Astro dev server
npx emdash types      # Regenerate TypeScript types from a running site
npm run import-content -- --url http://localhost:4321   # Load ../src/content/**/*.md into EmDash
npm run check-parity -- --new http://localhost:4321     # Compare every page with the React site on :3000
```

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, database, and storage                    |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                           |
| `seed/seed.json`         | Schema for a fresh database: `events`, `news`, `gamemasters`                       |
| `emdash-env.d.ts`        | Generated types for collections (auto-regenerated on dev server start)             |
| `src/layouts/Layout.astro` | Page shell: header, theme toggle, fonts, analytics                               |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |

## Skills

Agent skills are in `.agents/skills/`. Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines). Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content management, seeding, type generation, and visual editing flow.

## Documentation

The EmDash docs are available as an MCP server at `https://docs.emdashcms.com/mcp`. When you need to verify an API, hook, config option, field type, or pattern, call `search_docs` against the live documentation rather than relying on training-data recall. The docs reflect current behavior; assumptions may not.

This template ships with `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json` so Claude Code, Cursor, and VS Code auto-discover the docs server. Other tools (OpenCode, Windsurf, etc.) need a manual one-time setup -- see [docs.emdashcms.com/docs-mcp](https://docs.emdashcms.com/docs-mcp).

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- When Astro's cache is enabled, pass content-query hints to `Astro.cache.set(cacheHint)`. Use the `WithCacheHint` variants for site settings, menus, taxonomies, and widget areas rendered by cached routes.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).

## This Site

The public pages are a port of the React site (`../src/components`), and must look and read the same: `npm run check-parity` compares every event page, the home page, the feed, and a 404 against it, and `../e2e/mobile-layout.spec.ts` runs against both (`E2E_BASE_URL=http://localhost:4321 npx playwright test` from the repo root).

## Pages

| Page     | Path             | Source                                                                  |
| -------- | ---------------- | ----------------------------------------------------------------------- |
| Home     | `/`              | `src/pages/index.astro`: calendar, about, news; contact and GMs aside   |
| Event    | `/events/[slug]` | `src/pages/events/[slug].astro`; the slug is the old markdown filename  |
| RSS feed | `/feed.xml`      | `src/pages/feed.xml.ts`                                                 |
| 404      | anything else    | `src/pages/404.astro`                                                   |

`/admin.html` (the old Sveltia CMS) redirects to `/_emdash/admin/`.

## Styling

- One stylesheet, `src/styles/site.css`, ported from the React site's styled-components. Keep its class names: the e2e spec selects on them.
- The two themes (medieval, sci-fi) are CSS custom properties switched by `data-theme` on `<html>`, remembered in `localStorage`.
- The calendar is the only hydrated component (`src/components/Calendar.tsx`, `client:load`). Everything else renders on the server.

## Dates and times

- Event `date` is a `YYYY-MM-DD` string and times are `HH:MM` strings, not `datetime` fields: a calendar day must not shift with a timezone. Don't parse them with `new Date(value)`; see `src/utils/eventFormat.ts` and `src/utils/dates.ts`.
- `plugins/date-field` provides the admin's date and time pickers for those string fields.

## Schema changes

`seed/seed.json` only initializes an empty database. It mirrors the Sveltia form (`../public/admin-config.yml`) until that's retired, and `../src/tests/emdashSeed.test.ts` fails if they drift. `scripts/lib/map-content.ts` maps front-matter onto these fields; `../src/tests/emdashImport.test.ts` covers it.
