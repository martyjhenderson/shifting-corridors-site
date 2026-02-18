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

### Adding Content

To add a new calendar event, create a new `.md` file in `src/content/calendar/` following the existing front-matter schema. The build script handles the rest.
