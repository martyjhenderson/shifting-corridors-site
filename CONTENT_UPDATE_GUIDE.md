# Content Update Guide

This guide explains how to update calendar events, news articles, and game master information on the Shifting Corridors Lodge website.

## 📋 Overview

The website uses markdown files for all content, which are converted to JSON data at build time. This makes the site fast and allows for easy content updates through pull requests.

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

Create a new markdown file in `src/content/calendar/` with a descriptive filename:
- Format: `venue-event-name-date.md`
- Examples: `tempest-jan-15-2026.md`, `gcg-furys-toll-oct.md`

### 2. Event File Format

```markdown
---
title: "Event Title Here"
date: 2026-01-15
url: /events/your-event-slug
location: Venue Name
address: Full Address Here
---

# Event Title Here

Event description in markdown format.

## Details

- **Date:** January 15, 2026
- **Time:** 5:30 PM Central Time
- **Location:** Venue Name
- **Address:** Full Address Here

## Available Scenarios

1. **Scenario Name** - [Sign up here](https://signup-link.com)

## Registration

Registration instructions here.
```

### 3. Required Fields

- `title`: Event title (use quotes if it contains colons)
- `date`: Date in YYYY-MM-DD format
- `url`: URL path for the event page (should match filename)
- `location`: Venue name
- `address`: Full venue address

### 4. Common Venues

**Tempest Games:**
- Location: `Tempest Games`
- Address: `212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405`

**Geek City Games:**
- Location: `Geek City Games`
- Address: `365 Beaver Kreek Center suite b, North Liberty, IA 52317`

**Diversions:**
- Location: `Diversions`
- Address: `Address for Diversions`

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

### Method 1: Direct File Editing (Recommended)

1. **Navigate to the content file** you want to update
2. **Edit the markdown file** directly
3. **Commit your changes** with a descriptive message
4. **Push to trigger deployment**

### Method 2: Pull Request Workflow

1. **Fork the repository** (if you don't have write access)
2. **Create a new branch** for your changes
3. **Add/edit the content files** as needed
4. **Commit your changes** with descriptive messages
5. **Create a pull request** with details about your changes
6. **Wait for review and merge**

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
- Ensure proper indentation for arrays (games list)
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
title: "Pathfinder Society at Tempest Games - Within the Glacier"
date: 2026-01-15
url: /events/tempest-jan-15-2026
location: Tempest Games
address: 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405
---

# Pathfinder Society at Tempest Games

Join us for Pathfinder Society games at Tempest Games in Cedar Rapids!

## Details

- **Date:** January 15, 2026
- **Time:** 5:30 PM Central Time
- **Location:** Tempest Games
- **Address:** 212 Edgewood Road NW, Suite K, Cedar Rapids, IA 52405

## Available Scenarios

1. **Within the Glacier** - [Sign up here](https://www.rpgchronicles.net/session/1f272ada-19a3-4ac9-9359-b2496bf2c04a/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!
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