# Shifting Corridors Lodge on EmDash

This is the in-progress rewrite of the site on [EmDash](https://docs.emdashcms.com), a CMS built on Astro and
running as a Cloudflare Worker with D1 and R2. The live site is still the React app in the repo root, on
S3/CloudFront; nothing here is deployed yet.

## Migration steps

1. **Schema and scaffold** (done): `events`, `news`, and `gamemasters` collections in `seed/seed.json`.
2. **Import and design port** (done): `scripts/import-content.ts` loads the markdown; the pages are ported
   from the React site; `scripts/check-parity.ts` confirms every page matches it.
3. Deploy to `workers.dev` alongside S3 and have a few GMs try it.
4. Move the DNS zone to Cloudflare and point `shiftingcorridors.com` at the Worker.
5. Retire AWS, Sveltia, and the content-branch workflows.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:4321/_emdash/admin. The first request applies `seed/seed.json` to the local D1 database
(in `.wrangler/`). The dev server prints a **Dev bypass** link that signs you in as an admin without a passkey.

The database starts empty. Load the site's content from `../src/content` with:

```bash
npm run import-content -- --dry-run                       # check every file maps, write nothing
npm run import-content -- --url http://localhost:4321
```

Node 22.18 or later runs the TypeScript scripts directly.

## Importing content

`scripts/import-content.ts` reads every markdown file, maps its front-matter onto the EmDash fields
(`scripts/lib/map-content.ts`), and creates and publishes one entry per file, with the filename as its slug.

- Every file is checked before anything is written. An unknown front-matter key, a date that isn't
  `YYYY-MM-DD`, or a time that isn't `HH:MM` stops the run, rather than being dropped.
- An entry that already exists is skipped, so a re-run never overwrites edits made in the admin.
  `--overwrite` replaces them with the markdown version.
- Localhost needs no credentials. For a deployed site, create a token under **Settings → API Tokens** and pass
  it as `EMDASH_TOKEN`.

Two things don't carry over exactly:

- Four Game Master files have no `title`; they get `Game Master: <First> <L>.`, which only the admin list shows.
- `tempest-jan-15-2026` has a numbered list starting at 2. Portable Text lists always start at 1. The list
  number isn't visible text, so the parity check doesn't flag it.

EmDash's markdown converter reads `_italic_` but leaves `*italic*` as literal asterisks, so the importer
rewrites one to the other first.

## Checking parity with the React site

The pages must read the same as the React site's. With both running (the React site with `npm run dev` in the
repo root, on :3000):

```bash
npm run check-parity -- --new http://localhost:4321
```

It renders all 103 event pages, the home page, and a 404 on both sites in Chrome, and compares their visible
text and links; it also compares the RSS feed item by item. A difference fails the run.

The repo's mobile layout tests also run against this site:

```bash
cd .. && E2E_BASE_URL=http://localhost:4321 npx playwright test
```

Both sites fail the same three tests: calendar day cells are 40px tall, under the spec's 44px tap target.

### Deliberate differences

- An unknown URL answers **404** with the "Event Not Found" page; the React site answered 200.
- The theme choice is remembered across pages and visits. The React site kept it in memory, which was enough
  for a single-page app.
- Event pages have their own `<title>` (`<event> — Shifting Corridors Lodge`) instead of the site name alone.
- Calendar days are buttons, so they can be reached with the keyboard.
- An RSS item's `pubDate` is when the entry was last updated; it was the markdown file's last commit. Links and
  GUIDs are unchanged, so readers don't see items as new.
- `/admin.html` redirects to the EmDash admin.
- `/submit-event` isn't ported. It sends GM submissions to GitHub, which EmDash replaces; whether to keep a
  public form is still open.

## Schema

`seed/seed.json` only sets up a **fresh** database. Once a site exists, change its schema in the admin under
**Content Types** (or `npx emdash schema`), then export the result back into the seed. See
[Evolve a deployed site's schema](https://docs.emdashcms.com/deployment/schema-evolution/).

It mirrors the Sveltia form in `../public/admin-config.yml` until that is retired, and
`../src/tests/emdashSeed.test.ts` fails if they drift. Differences from the markdown front-matter:

| Markdown | EmDash | Why |
| --- | --- | --- |
| `startTime`, `playerCap`, … | `start_time`, `player_cap`, … | Field slugs must be snake_case |
| filename | entry slug | The slug is the URL: `/events/{slug}` |
| news `id` | entry slug | `id` is reserved |
| markdown body | `body` (Portable Text); `bio` for Game Masters | Rich text is stored as Portable Text |
| `date` | `string`, `YYYY-MM-DD`, with a date picker | EmDash's `datetime` is an instant in UTC, and an event date is a calendar date |

`date`, `start_time`, and `end_time` reject anything that isn't `YYYY-MM-DD` or 24-hour `HH:MM`. Scenario
start and end times are typed as text and aren't checked, because fields inside a repeater can't carry a
pattern or a custom widget.

### Date and time pickers

EmDash only ships a date-*and-time* picker, for its `datetime` type. `plugins/date-field` is a small native
plugin that adds date-only and time-only pickers (the browser's `<input type="date">` and `<input type="time">`)
for `string` fields. A field opts in with `"widget": "date-field:date"` or `"widget": "date-field:time"`. Values
stay plain `YYYY-MM-DD` and 24-hour `HH:MM` strings, so they still sort, index, and validate as before, and
removing the plugin just turns the pickers back into text boxes.

The plugin is linked as a local `file:` dependency and has no build step: Vite compiles its TypeScript source.

## Review workflow

Every collection supports drafts. Give Game Masters the **Contributor** role: they can create and edit drafts
but not publish them, so an Editor or Admin reviews and publishes. A draft returns 404 on the public site until
it's published.
