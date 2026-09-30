# Shifting Corridors Lodge on EmDash

This is the in-progress rewrite of the site on [EmDash](https://docs.emdashcms.com), a CMS built on Astro and
running as a Cloudflare Worker with D1 and R2. The live site is still the React app in the repo root, on
S3/CloudFront; nothing here is deployed yet.

## Migration steps

1. **Schema and scaffold** (done): `events`, `news`, and `gamemasters` collections in `seed/seed.json`, plus
   placeholder pages at `/` and `/events/<slug>` that prove the queries and URLs work.
2. Import script from `src/content/**/*.md`; check that every current `/events/<slug>` and `/feed.xml` has a
   matching page. Port the real design.
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
