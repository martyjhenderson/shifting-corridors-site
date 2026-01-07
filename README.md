# Shifting Corridors Lodge Website

A modern React-based website for the Shifting Corridors Lodge, a Paizo Organized Play Lodge serving the Iowa City and Cedar Rapids areas. Built with Vite, TypeScript, and deployed on AWS.

## Overview

This website centralizes information for players and game masters, providing a calendar of events, game master profiles, contact information, and news articles. The site features a dual-theme system with medieval and sci-fi aesthetics, optimized for both desktop and mobile experiences.

## Getting Started

To work with this project:

1. Clone the repository:
```bash
git clone https://github.com/martyjhenderson/shifting-corridors-site.git
cd shifting-corridors-site
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
# or
npm start
```

The application will open at http://localhost:3000.

## Components

### Calendar
- Displays upcoming events in a calendar view
- Events are stored as markdown files
- Clicking on dates shows events for that day
- Events include links to specific URLs

### Game Masters
- Lists Game Masters with their first name, last initial, and organized play number
- Information is generated from markdown files
- Displays games each GM runs

### Contact
- Provides contact information for the lodge
- Features a Discord server link for community engagement

### News
- Displays news articles created in markdown
- Each article is an independent post
- Shows title, date, and content

## Theming

The site features two theme options:

### Medieval Theme (Default)
- Clean, medieval feel
- Color palette: browns, deep reds, and golden yellow
- Serif fonts for a traditional look

### Sci-Fi Theme
- Clean, science fiction feel
- Color palette: blues and oranges
- Sans-serif and futuristic fonts

A toggle button in the top right corner allows users to switch between themes.

## Technical Details

### Built With
- **React 19.1.0** - Modern React with latest features
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Vite 7.3.0** - Fast build tool and dev server
- **Styled Components 6.1.19** - CSS-in-JS styling
- **React Router 6.30.2** - Client-side routing
- **React Markdown 10.1.0** - Markdown rendering
- **Vitest 4.0.16** - Fast unit testing framework
- **AWS S3 + CloudFront** - Static hosting and CDN

### Project Structure
```
shifting-corridors-site/
├── public/                  # Static files and assets
├── src/
│   ├── components/          # React components
│   │   ├── Calendar.tsx     # Calendar component with event display
│   │   ├── Contact.tsx      # Contact information component
│   │   ├── EventDetails.tsx # Individual event detail component
│   │   ├── GameMasters.tsx  # Game masters list component
│   │   └── News.tsx         # News articles component
│   ├── content/             # Markdown content files
│   │   ├── calendar/        # Calendar events (markdown files)
│   │   ├── gamemasters/     # Game master profiles (markdown files)
│   │   └── news/            # News articles (markdown files)
│   ├── data/                # Generated JSON data files
│   │   ├── calendar.json    # Processed calendar data
│   │   ├── gamemasters.json # Processed GM data
│   │   └── news.json        # Processed news data
│   ├── styles/              # Styling and theme files
│   │   └── themes.ts        # Theme definitions (medieval/sci-fi)
│   ├── tests/               # Component tests
│   │   ├── Calendar.test.tsx
│   │   ├── EventDetails.test.tsx
│   │   └── GameMasters.test.tsx
│   ├── utils/               # Utility functions and contexts
│   │   ├── staticData.ts    # Data loading utilities
│   │   └── ThemeContext.tsx # Theme context provider
│   ├── __mocks__/           # Test mocks
│   ├── App.tsx              # Main application component
│   └── index.tsx            # Entry point
├── scripts/                 # Build and utility scripts
│   └── build-content.js     # Content processing script
├── aws/                     # AWS deployment configuration
│   ├── cloudformation/      # CloudFormation templates
│   └── scripts/             # Deployment scripts
├── vite.config.ts           # Vite configuration
├── vitest.config.ts         # Vitest test configuration
└── package.json             # Dependencies and scripts
```

## Testing

The project includes comprehensive tests using Vitest and React Testing Library. Run tests with:

```bash
npm test
```

For interactive testing with UI:
```bash
npx vitest --ui
```

Tests verify that:
- Components render correctly with proper data
- Theme switching works as expected
- Calendar displays events properly with correct dates
- Game masters list renders with accurate information
- Contact information displays correctly
- News articles render from markdown
- Event details show proper formatting
- Responsive design works across screen sizes

## Deployment

### AWS S3 + CloudFront Deployment

This project is deployed using AWS S3 for static hosting with CloudFront for global CDN distribution:

#### Available Scripts
```bash
# Development deployment
npm run aws:deploy:dev

# Production deployment  
npm run aws:deploy:prod

# Staging deployment
npm run aws:deploy:staging

# Test production domains
npm run aws:test-prod

# Check SSL certificates
npm run aws:check-ssl:prod

# Invalidate CloudFront cache
npm run aws:invalidate-cache:prod
```

#### Manual Deployment Steps

1. **Build the project:**
```bash
npm run build
```

2. **Deploy to AWS:**
```bash
npm run aws:deploy:prod
```

3. **Verify deployment:**
```bash
npm run aws:test-prod
```

The deployment process:
- Builds the React application with Vite
- Processes markdown content into JSON
- Uploads static files to S3
- Invalidates CloudFront cache for immediate updates
- Configures proper headers for SPA routing

### Local Build

To build the production version locally:

```bash
npm run build
```

The build folder will contain optimized static files ready for deployment.

## Development

### Development Server
To run the development server with hot reloading:

```bash
npm run dev
# or
npm start
```

This will:
- Process markdown content into JSON data
- Start the Vite dev server at http://localhost:3000
- Enable hot module replacement for fast development
- Open the browser automatically

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm test             # Run tests
npm run type-check   # TypeScript type checking
npm run verify-build # Verify build integrity
```

### Content Processing

The site uses a build-time content processing system:
- Markdown files in `src/content/` are processed into JSON
- The `scripts/build-content.js` script runs before each build
- Generated JSON files are stored in `src/data/`
- This enables fast runtime performance with static data

## Adding Content

### Adding Calendar Events
Create markdown files in the `src/content/calendar` directory with the following format:

```markdown
---
title: Event Title
date: 2026-01-15
url: /events/event-url
location: Venue Name
address: 123 Main St, City, State 12345
---

# Event Title

Event description and details go here.

## Available Scenarios

1. **Scenario Name** (Game System, Levels X-Y) - [Sign up here](https://signup-url.com)

## Registration

Registration details and instructions.
```

### Adding Game Masters
Create markdown files in the `src/content/gamemasters` directory with the following format:

```markdown
---
firstName: John
lastInitial: D
organizedPlayNumber: 123456-789
games:
  - Pathfinder
  - Starfinder
---

Additional information about the GM can go here.
```

### Adding News Articles
Create markdown files in the `src/content/news` directory with the following format:

```markdown
---
title: News Article Title
date: 2025-06-23
id: unique-article-id
---

# News Article Title

Content of the news article goes here.

## Subheading

More content...
```

## Contributing

Contributions to the Shifting Corridors Lodge website are welcome! Here's how you can contribute:

1. **Fork the repository** - Create your own fork of the project.

2. **Create a feature branch** - Make your changes in a new branch:
```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes** - Implement your feature or bug fix.

4. **Test your changes** - Ensure your changes work as expected.

5. **Submit a pull request** - Open a PR against the main branch.

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Include tests for new features when possible
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or more information about the Shifting Corridors Lodge:

- **Website:** [shiftingcorridor.com](https://shiftingcorridor.com)
- **Discord:** [Join Our Discord Server](https://discord.gg/X6gmXYVDJA)
- **GitHub:** [Project Repository](https://github.com/martyjhenderson/shifting-corridors-site)

### Lodge Information
- **Focus Areas:** Iowa City and Cedar Rapids, Iowa
- **Games:** Pathfinder Society, Starfinder Society
- **Meeting Locations:** Various game stores and venues in the area