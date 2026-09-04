# Content Update Guide

This guide explains how to update calendar events, news articles, and game master information on the Shifting Corridors Lodge website.

## 📋 Overview

Most content changes are best made through the **content manager** at
[shiftingcorridors.com/admin.html](https://shiftingcorridors.com/admin.html) — a
web form that writes these files for you and opens a pull request. See
[docs/CMS_SETUP.md](docs/CMS_SETUP.md).

This guide covers the underlying files, for when you'd rather edit them directly.
The website stores all content as markdown, which is converted to JSON at build
time.

## 🗂️ Content Structure

All content is stored in the `src/content/` directory:

```
src/content/
├── calendar/        # Event information
├── news/           # News articles  
└── gamemasters/    # Game master profiles
```

## 📅 Adding Calendar Events

### 1. Create a New Event File

Create a new markdown file in `src/content/calendar/`. **The filename is the
event's URL** — `tempest-jan-15-2026.md` is served at `/events/tempest-jan-15-2026`
— so pick it carefully and don't rename it once the event is public.

### 2. Event File Format

Everything about the event lives in the front-matter; the site renders the date,
time, scenario list and registration note from these fields. The markdown body is
only for sections the fields can't express.

```markdown
---
title: Pathfinder Society at Tempest Games
date: 2026-01-15
startTime: '17:30'
endTime: '21:30'
location: Tempest Games
address: '212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'
playerCap: 6
intro: Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!
scenarios:
  - name: Within the Glacier
    system: Pathfinder
    type: Scenario
    levels: '1-4'
    signupUrl: 'https://www.rpgchronicles.net/session/1f272ada-.../pregame'
---
```

Don't write out the date, time, location, scenarios or a "Please register in
advance…" line in the body — all of that is generated. Repeating it puts it on
the page twice.

### 3. Fields

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Quote it if it contains a colon |
| `date` | yes | `YYYY-MM-DD` |
| `startTime` / `endTime` | no | 24-hour `'HH:MM'`, quoted |
| `allDay` | no | `true` for conventions with no single start time |
| `location` / `address` | no | Quote any address containing `#` |
| `playerCap` | no | Seats per table; drives the registration note |
| `levels` | no | e.g. `'1-4'`, when it's the same for every table |
| `cancelled` | no | `true` shows a banner — don't put `[CANCELLED]` in the title |
| `intro` | no | A sentence or two above the details |
| `specialNote` | no | Highlighted note in the details list |
| `gamemaster` | no | Only when one GM runs the whole event |
| `scenarios` | no | List — see below |

Each entry under `scenarios` takes `name` (required) plus any of `system`
(`Pathfinder` / `Starfinder`), `edition` (`1E` / `2E`), `type` (`Scenario`,
`Quest`, `Adventure`, `Bounty`, `Module`, `One-Shot`), `levels`, `startTime`,
`endTime`, `playerCap`, `gamemaster`, `repeatable`, `pregens`, `cancelled`, and
`signupUrl`.

### 4. Common Venues

**Tempest Games:**
- Location: `Tempest Games`
- Address: `'212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405'`

**Geek City Games:**
- Location: `Geek City Games`
- Address: `'365 Beaver Kreek Center suite b, North Liberty, IA 52317'`

**Diversions:**
- Location: `Diversions`
- Address: `'119 2nd St #300, Coralville, IA 52241'`

## 📰 Adding News Articles

### 1. Create a News File

Create a new markdown file in `src/content/news/` with a descriptive filename:
- Format: `article-title-slug.md`
- Examples: `new-lodge-website.md`, `gamicon-bromine-2026.md`

### 2. News File Format

```markdown
---
title: "Article Title Here"
date: 2025-06-23
id: unique-article-id
---

# Article Title Here

Article content in markdown format.

## Features

- Feature 1
- Feature 2
- Feature 3

More content here...
```

### 3. Required Fields

- `title`: Article title
- `date`: Publication date in YYYY-MM-DD format
- `id`: Unique identifier for the article

## 👥 Adding Game Masters

### 1. Create a GM File

Create a new markdown file in `src/content/gamemasters/` with the format:
- Format: `firstname-lastinitial.md`
- Examples: `marty-h.md`, `josh-e.md`

### 2. GM File Format

```markdown
---
firstName: FirstName
lastInitial: L
organizedPlayNumber: 12345
games:
  - Pathfinder
  - Starfinder
---

Optional biography or description in markdown format.
```

### 3. Required Fields

- `firstName`: GM's first name
- `lastInitial`: GM's last initial
- `organizedPlayNumber`: Organized Play number
- `games`: Array of games they run (Pathfinder, Starfinder, etc.)

## 🔧 Making Updates

### Method 1: The content manager (Recommended)

1. Open [shiftingcorridors.com/admin.html](https://shiftingcorridors.com/admin.html)
2. Sign in with GitHub
3. Add or edit the entry and click **Save**
4. A preview builds at [dev.shiftingcorridors.com](https://dev.shiftingcorridors.com),
   and a pull request opens automatically
5. A maintainer merges it, and the change is live in about two minutes

### Method 2: Editing the files directly

1. **Create a branch** off `main`
2. **Add or edit the content files** as needed
3. **Commit** with a descriptive message
4. **Open a pull request** — it gets the same dev preview
5. **Wait for review and merge**

## 📝 Content Guidelines

### Writing Style
- Use clear, concise language
- Include all relevant event details
- Provide registration links when available
- Use proper markdown formatting

### Date Formats
- Always use YYYY-MM-DD format for dates
- Be consistent with time zones (Central Time)
- Include both date and time for events

### YAML Frontmatter Rules
- Use quotes around titles that contain colons
- **Quote any value containing `#`.** Unquoted, YAML treats ` #` as the start of
  a comment: `address: 119 2nd St #300, Coralville, IA 52241` silently becomes
  just `119 2nd St`. This went unnoticed across 30 event files.
- Quote times and level ranges (`'17:30'`, `'1-4'`) so they stay text
- Ensure proper indentation for arrays (games list, scenarios)
- Don't use tabs, only spaces
- Required fields must be present

### File Naming
- Use lowercase letters and hyphens
- Be descriptive but concise
- Include venue and date for events
- Use consistent patterns

## 🚀 Deployment

The site automatically rebuilds when content changes are pushed to the main branch. The build process:

1. **Content Build**: Converts markdown files to JSON data
2. **React Build**: Builds the static React application
3. **AWS Deploy**: Uploads to S3 and invalidates CloudFront cache

### Build Commands

```bash
# Build content data from markdown files
npm run prebuild

# Build the full application
npm run build

# Deploy to production
npm run aws:deploy:prod

# Deploy to development
npm run aws:deploy:dev
```

## 🐛 Troubleshooting

### Common Issues

**YAML Parsing Errors:**
- Check for unquoted colons in titles
- Ensure proper indentation
- Verify all required fields are present

**Build Failures:**
- Check the build logs for specific errors
- Ensure all markdown files have valid frontmatter
- Verify file names don't contain special characters

**Content Not Appearing:**
- Check that the file is in the correct directory
- Verify the frontmatter format is correct
- Ensure the build process completed successfully

### Getting Help

1. Check the build logs for error messages
2. Verify your markdown syntax
3. Compare with existing working files
4. Create an issue in the repository if problems persist

## 📚 Examples

### Complete Event Example

```markdown
---
title: Pathfinder & Starfinder Society at Diversions
date: 2026-01-14
startTime: '17:30'
endTime: '21:30'
location: Diversions
address: '119 2nd St #300, Coralville, IA 52241'
playerCap: 6
intro: Join us for Pathfinder and Starfinder Society games at Diversions in Coralville!
scenarios:
  - name: Intro to Unfettered Exploration
    system: Pathfinder
    type: Scenario
    levels: '1-4'
    signupUrl: 'https://www.rpgchronicles.net/session/28f5a541-.../pregame'
  - name: Invasion's Edge
    system: Starfinder
    type: Scenario
    levels: '1-2'
    gamemaster: Bret I
    signupUrl: 'https://www.rpgchronicles.net/session/83ebcbe8-.../pregame'
---
```

An event only needs a markdown body when it has something the fields can't
express — character requirements, a venue notice, unusual registration steps:

```markdown
## Character Requirements

- **Level:** 2 only
- **Starting Gear:** 30 gp worth of equipment
```

### Complete News Example

```markdown
---
title: "New Lodge Website Launched"
date: 2025-06-23
id: new-lodge-website
---

# New Lodge Website Launched

We're excited to announce the launch of our new Shifting Corridors Lodge website!

This new site will help us better coordinate events and share information with our community.

## Features

- Event calendar with upcoming games
- List of Game Masters
- News updates
- Contact information

Stay tuned for more updates and events!
```

### Complete GM Example

```markdown
---
firstName: Marty
lastInitial: H
organizedPlayNumber: 30480
games:
  - Pathfinder
  - Starfinder
---

Marty is the Corridor Venture-Lieutenant and a Game Master who runs scenarios for Pathfinder 2E and Starfinder 2E. He specializes in creating immersive roleplaying experiences and his collection of maps and lending of dice.
```