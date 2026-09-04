# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start dev server at http://localhost:3000
- `npm run build` - Production build (runs content build script first)
- `npm test` - Run Vitest unit tests
- `npm run type-check` - TypeScript type checking
- `npm run preview` - Preview production build locally

Run a single test file:
```
npx vitest run src/tests/Calendar.test.tsx
```

## Architecture

This is a React + TypeScript site for the Shifting Corridors Lodge (a tabletop RPG gaming group), built with Vite and deployed to AWS S3/CloudFront.

### Content Pipeline

All site content lives as markdown files with YAML front-matter in `src/content/`:
- `calendar/` - Event entries (date, title, URL, location, address)
- `gamemasters/` - GM profiles (name, OP number, games they run)
- `news/` - News articles

At build time (and dev start), `scripts/build-content.js` parses these markdown files and writes JSON to `src/data/`. This means **editing content = editing markdown files**, not source code.

### Data Flow

`src/content/*.md` → (build script) → `src/data/*.json` → `src/utils/staticData.ts` → components

`staticData.ts` exports async functions (`getCalendarEvents()`, `getNewsArticles()`, `getGameMasters()`) that filter and sort the generated JSON.

### Theme System

Two themes (medieval and sci-fi) are defined in `src/styles/themes.ts` and toggled via `src/utils/ThemeContext.tsx`. Components access the theme through styled-components' `ThemeProvider`.

### Routing

- `/` - Home: Calendar + News in main column, Contact + GameMasters in sidebar
- `/events/:eventId` - Individual event detail page

### Content Manager

`public/admin.html` serves [Sveltia CMS](https://sveltiacms.app), a git-based CMS, so Game Masters can add events through a form instead of writing markdown. Saving commits to the `content` branch; `.github/workflows/content-pr.yml` opens a PR into `main`. See `docs/CMS_SETUP.md`.

It's served at `/admin.html`, not `/admin/` — CloudFront fronts the S3 REST endpoint, which doesn't serve directory index files, and the distribution's `404 → /index.html` rule would silently return the React app instead.

### Adding Content

To add a calendar event by hand, create a `.md` file in `src/content/calendar/`. **The filename is the URL** (`/events/<filename>`); there is no `url` front-matter field.

Everything renders from front-matter — date, time, scenarios, and the registration note are all generated, so don't repeat them in the body. The body is only for sections the schema can't express. `CONTENT_UPDATE_GUIDE.md` documents the full field list.

The CMS form (`public/admin-config.yml`), the `MarkdownMeta`/`Scenario` types (`src/utils/staticData.ts`), and the rendering (`src/components/EventDetails.tsx`) are three descriptions of one schema — change all three together. `src/tests/cmsConfig.test.ts` fails if content uses a key the form doesn't declare.

Quote any front-matter value containing `#`: unquoted, YAML reads ` #` as a comment, which silently truncated the Diversions address in 30 files.
