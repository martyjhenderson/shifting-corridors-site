# Shifting Corridors Lodge Website

A modern, responsive React-based website for the Shifting Corridors Lodge gaming community. This static site serves tabletop gaming enthusiasts in the Iowa City and Cedar Rapids areas with comprehensive information about events, game masters, and community news.

## Overview

The Shifting Corridors Lodge website is built with React 18+ and TypeScript, providing a type-safe, performant platform for the gaming community. The site features a dual-theme system (medieval and sci-fi), mobile-responsive design, and privacy-focused analytics. All content is managed through markdown files, making it easy to update events, game master profiles, and news articles.

### Key Features

- **Interactive Calendar**: View upcoming gaming events with detailed information
- **Upcoming Events Panel**: Quick access to the next 3 upcoming events
- **Game Master Profiles**: Comprehensive information about lodge GMs and their specialties
- **Community News**: Latest announcements and updates
- **Dual Theme System**: Switch between medieval and sci-fi themes
- **Mobile Responsive**: Optimized experience across all devices
- **Privacy-First Analytics**: GDPR-compliant tracking with Fathom Analytics
- **Static Site Deployment**: Fast, cost-effective hosting on AWS S3 + CloudFront

## Components

### Calendar Component
- Interactive calendar displaying gaming events from markdown files
- Event metadata parsed from frontmatter (title, date, game type, game master)
- Click events to view detailed information including full descriptions
- Responsive design adapts to mobile devices with touch-friendly interactions
- Supports Pathfinder, Starfinder, and Legacy game types

### Upcoming Events Panel
- Side panel showing the next 3 upcoming events chronologically
- Automatically sorts events with nearest first
- Click navigation to detailed event views
- Converts to bottom panel on mobile devices for optimal mobile experience
- Gracefully handles fewer than 3 upcoming events

### Game Masters Component
- Comprehensive profiles for all active lodge game masters
- Displays name, organized play ID, and games they run (Pathfinder/Starfinder/Legacy)
- Click functionality reveals detailed bio from markdown content
- Responsive grid layout: 3 columns on desktop, adapts to 1 column on mobile
- Avatar support for game master photos

### News Component
- Community news and announcements from markdown files
- Newest-first sorting for timely information
- Full article view with markdown content rendering
- Responsive layout optimized for readability on all devices
- Support for article excerpts and author attribution

### Event Details Component
- Dedicated detailed view for individual events
- Full markdown content rendering for event descriptions
- Navigation back to calendar view
- Mobile-optimized layout with touch interactions
- Displays all event metadata (game master, game type, player limits)

## Theme System

The site features a comprehensive dual-theme system with persistent user preferences:

### Medieval Theme (Default)
- Traditional tabletop gaming aesthetic
- Color palette: rich browns, deep reds, and golden accents
- Serif fonts for classic readability
- Warm, inviting visual elements

### Sci-Fi Theme
- Modern science fiction aesthetic
- Color palette: cool blues with orange highlights
- Sans-serif and futuristic typography
- Clean, high-tech visual elements

### Theme Features
- **Theme Selector**: Accessible theme switcher component
- **Persistent Preferences**: User theme choice saved across browser sessions using localStorage
- **Responsive Theming**: All themes adapt properly to mobile devices
- **CSS Modules**: Modular theme implementation for maintainability
- **Context-Based**: React Context provides theme state throughout the application

## Technical Stack

### Core Technologies
- **React 18+**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application
- **Create React App**: Build tooling and development server
- **React Markdown**: Markdown content rendering with frontmatter support
- **Gray-Matter**: Frontmatter parsing for markdown files
- **CSS Modules**: Modular styling with theme support

### Analytics & Performance
- **Fathom Analytics**: Privacy-first, GDPR-compliant user analytics
- **Code Splitting**: Lazy loading for optimal performance
- **Bundle Optimization**: Tree shaking and dependency optimization
- **Core Web Vitals**: Performance monitoring and optimization

### Deployment & Infrastructure
- **AWS S3**: Static website hosting
- **CloudFront CDN**: Global content delivery network
- **GitHub Actions**: Automated CI/CD pipeline
- **Infrastructure as Code**: CloudFormation templates for AWS resources

### Development & Testing
- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **ESLint & Prettier**: Code quality and formatting
- **TypeScript Compiler**: Static type checking

### Project Structure
```
shifting-corridors-lodge/
├── public/                          # Static files and assets
│   ├── index.html                   # Main HTML template with Fathom Analytics
│   └── manifest.json                # PWA manifest
├── src/
│   ├── components/                  # React components
│   │   ├── Calendar.tsx             # Interactive calendar component
│   │   ├── EventDetails.tsx         # Detailed event view component
│   │   ├── GameMasters.tsx          # Game masters profiles component
│   │   ├── News.tsx                 # News articles component
│   │   ├── ThemeSelector.tsx        # Theme switching component
│   │   ├── UpcomingEvents.tsx       # Upcoming events panel
│   │   └── ErrorBoundary.tsx        # Error handling boundary
│   ├── content/                     # Markdown content files
│   │   ├── calendar/                # Event markdown files
│   │   │   ├── event-name.md        # Individual event files
│   │   │   └── ...
│   │   ├── gamemasters/             # GM profile markdown files
│   │   │   ├── gm-name.md           # Individual GM profiles
│   │   │   └── ...
│   │   └── news/                    # News article markdown files
│   │       ├── article-name.md      # Individual news articles
│   │       └── ...
│   ├── services/                    # Business logic services
│   │   ├── contentLoader.ts         # Markdown content loading service
│   │   └── analyticsService.ts      # Fathom Analytics integration
│   ├── styles/                      # Styling and themes
│   │   ├── themes.ts                # Theme definitions and configurations
│   │   ├── medieval.css             # Medieval theme styles
│   │   ├── sci-fi.css               # Sci-fi theme styles
│   │   └── mobile.css               # Mobile-responsive styles
│   ├── types/                       # TypeScript type definitions
│   │   └── index.ts                 # Shared interfaces and types
│   ├── utils/                       # Utility functions and contexts
│   │   ├── ThemeContext.tsx         # Theme state management
│   │   ├── ContentContext.tsx       # Content state management
│   │   ├── validation.ts            # Data validation utilities
│   │   ├── fallbackContent.ts       # Error handling and fallbacks
│   │   └── markdown/                # Markdown processing utilities
│   │       └── markdownUtils.ts     # Markdown parsing and processing
│   ├── tests/                       # Comprehensive test suite
│   │   ├── Calendar.test.tsx        # Calendar component tests
│   │   ├── GameMasters.test.tsx     # Game masters component tests
│   │   ├── News.test.tsx            # News component tests
│   │   ├── Integration.test.tsx     # Integration tests
│   │   └── MobileResponsiveness.test.tsx # Mobile testing
│   ├── App.tsx                      # Main application component
│   └── index.tsx                    # Application entry point
├── aws/                             # AWS deployment configuration
│   ├── cloudformation-template.yml  # Infrastructure as Code template
│   └── deploy-infrastructure.sh     # AWS infrastructure deployment script
├── deploy-aws.js                    # Application deployment script
├── package.json                     # Dependencies and build scripts
└── README.md                        # This documentation
```

## Testing

The project includes a comprehensive testing suite covering unit tests, integration tests, and mobile responsiveness testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode during development
npm test -- --watch

# Run specific test file
npm test Calendar.test.tsx
```

### Test Coverage

The test suite verifies:

#### Component Testing
- **Calendar Component**: Event display, date navigation, event selection
- **Game Masters Component**: Profile rendering, bio display, responsive layout
- **News Component**: Article loading, sorting, content rendering
- **Event Details Component**: Detailed view rendering, navigation
- **Theme Selector**: Theme switching, persistence, visual updates
- **Upcoming Events**: Event sorting, display logic, mobile adaptation

#### Service Testing
- **Content Loader**: Markdown parsing, frontmatter extraction, error handling
- **Analytics Service**: Event tracking, page view tracking, privacy compliance
- **Validation Utilities**: Data validation, type checking, error scenarios

#### Integration Testing
- **Complete Content Flow**: End-to-end content loading and display
- **Theme System**: Complete theme switching workflow
- **Navigation**: Component interaction and routing
- **Error Handling**: Graceful degradation and error boundaries

#### Mobile Responsiveness Testing
- **Layout Adaptation**: Breakpoint testing across device sizes
- **Touch Interactions**: Tap target validation, gesture support
- **Performance**: Mobile-specific performance optimization validation

### Test Configuration

Tests use:
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking for content loading tests
- **Custom Test Utilities**: Shared testing helpers and mock data

## Deployment

The website is designed for static hosting on AWS S3 with CloudFront CDN for optimal performance and global distribution. The deployment process is fully automated through GitHub Actions.

### AWS Architecture

- **S3 Bucket**: Static website hosting with public read access
- **CloudFront Distribution**: Global CDN with caching optimization
- **Route 53** (Optional): Custom domain configuration
- **GitHub Actions**: Automated CI/CD pipeline

### Prerequisites

1. **AWS CLI Installation and Configuration**:

```bash
# Install AWS CLI (macOS)
brew install awscli

# Install AWS CLI (Linux)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI with your credentials
aws configure
```

2. **Required AWS Permissions**:
   - S3: CreateBucket, PutObject, PutBucketPolicy, PutBucketWebsite
   - CloudFront: CreateDistribution, CreateInvalidation
   - CloudFormation: CreateStack, UpdateStack, DescribeStacks

### Infrastructure Deployment

#### Automated Infrastructure Setup

Deploy the complete AWS infrastructure using the provided CloudFormation template:

```bash
cd aws
chmod +x deploy-infrastructure.sh
./deploy-infrastructure.sh
```

This script will:
- Create an S3 bucket configured for static website hosting
- Set up a CloudFront distribution with optimal caching
- Configure proper CORS and security policies
- Output the necessary values for GitHub Actions

#### Manual Infrastructure Setup

If you prefer manual setup:

```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name shifting-corridors-lodge \
  --template-body file://aws/cloudformation-template.yml \
  --parameters ParameterKey=BucketName,ParameterValue=your-unique-bucket-name

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name shifting-corridors-lodge \
  --query 'Stacks[0].Outputs'
```

### Application Deployment

#### Automated Deployment (Recommended)

The project includes GitHub Actions workflow for automated deployment:

1. **Configure GitHub Secrets** with values from CloudFormation outputs:
   ```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
   ```

2. **Push to main branch** triggers automatic deployment:
   - Runs test suite
   - Builds production bundle
   - Deploys to S3
   - Invalidates CloudFront cache

#### Manual Deployment

For manual deployment or testing:

```bash
# Build the production version
npm run build

# Deploy using the deployment script
npm run deploy:aws

# Or deploy manually with AWS CLI
aws s3 sync build/ s3://your-bucket-name --delete
aws cloudfront create-invalidation \
  --distribution-id your-distribution-id \
  --paths "/*"
```

### Environment Variables

Set these environment variables for deployment:

```bash
# Required for deployment script
export S3_BUCKET_NAME=your-bucket-name
export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
export AWS_REGION=us-east-1

# Optional: Custom domain
export CUSTOM_DOMAIN=yourdomain.com
```

### Deployment Verification

After deployment, verify the site is working:

1. **S3 Website Endpoint**: Check the S3 website URL from CloudFormation outputs
2. **CloudFront Distribution**: Verify the CloudFront domain is serving content
3. **Custom Domain** (if configured): Test your custom domain
4. **Performance**: Run Lighthouse audit to verify performance metrics
5. **Analytics**: Confirm Fathom Analytics is tracking page views

### Troubleshooting Deployment

Common issues and solutions:

- **Build Failures**: Check Node.js version compatibility (requires Node 16+)
- **S3 Access Denied**: Verify bucket policy allows public read access
- **CloudFront Caching**: Use cache invalidation after updates
- **CORS Issues**: Ensure proper CORS configuration in S3 bucket
- **Analytics Not Working**: Verify Fathom site ID in index.html

## Local Development

### Getting Started

1. **Clone the repository**:
```bash
git clone <repository-url>
cd shifting-corridors-lodge
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the development server**:
```bash
npm start
```

The development server will start at http://localhost:3000 with hot reloading enabled.

### Development Scripts

```bash
# Start development server
npm start

# Run test suite
npm test

# Run tests with coverage
npm test -- --coverage

# Build production bundle
npm run build

# Deploy to AWS (requires configuration)
npm run deploy:aws

# Lint code
npm run lint

# Format code
npm run format
```

### Development Environment

- **Node.js**: Version 16 or higher required
- **npm**: Version 7 or higher recommended
- **TypeScript**: Integrated with Create React App
- **Hot Reloading**: Automatic browser refresh on file changes
- **Error Overlay**: Development error display in browser

### Code Quality

The project enforces code quality through:

- **TypeScript**: Static type checking
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Automatic code formatting
- **Husky**: Git hooks for pre-commit checks
- **Jest**: Unit and integration testing

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Edit components, add tests, update documentation
3. **Run Tests**: `npm test` to ensure all tests pass
4. **Commit Changes**: Use conventional commit messages
5. **Push and Create PR**: Push branch and create pull request
6. **Automated Checks**: GitHub Actions runs tests and deployment

## Content Management

The website uses markdown files for all content, making it easy to add and update information without touching code.

### Markdown Content Structure

All content files use YAML frontmatter for metadata and markdown for content. The frontmatter is parsed automatically and used throughout the application.

### Adding Calendar Events

Create markdown files in `src/content/calendar/` with this structure:

```markdown
---
title: "Pathfinder Society Scenario Night"
date: "2025-07-15"
gamemaster: "josh-g"
gameType: "Pathfinder"
maxPlayers: 6
description: "Join us for an exciting Pathfinder Society scenario"
---

# Event Details

Detailed event description goes here. You can use full markdown formatting including:

- **Bold text** for emphasis
- *Italic text* for highlights
- Lists for requirements or notes
- Links to external resources

## What to Bring

- Character sheets
- Dice
- Pencils
- Enthusiasm for adventure!

## Game Master Notes

Additional information for the GM or special instructions.
```

**Required Frontmatter Fields:**
- `title`: Event name
- `date`: Event date in YYYY-MM-DD format
- `gamemaster`: GM identifier (matches filename in gamemasters directory)
- `gameType`: "Pathfinder", "Starfinder", or "Legacy"

**Optional Frontmatter Fields:**
- `maxPlayers`: Maximum number of players
- `description`: Brief event description
- `location`: Event location if different from default
- `specialNotes`: Any special requirements or notes

### Adding Game Masters

Create markdown files in `src/content/gamemasters/` with this structure:

```markdown
---
name: "Josh G"
organizedPlayId: "123456-789"
games: ["Pathfinder", "Starfinder"]
avatar: "/images/josh-g.jpg"
email: "josh@example.com"
---

# About Josh

Josh has been running Pathfinder games for over 5 years and specializes in both Society scenarios and Adventure Paths. He's known for his engaging storytelling and creative problem-solving challenges.

## Gaming Style

- Emphasis on roleplay and character development
- Tactical combat with creative solutions encouraged
- New player friendly with patient explanations
- Enjoys both serious dramatic moments and lighthearted fun

## Favorite Scenarios

- The Confirmation (perfect for new players)
- The Dragon's Demand (classic adventure path)
- Emerald Spire Superdungeon (epic dungeon crawl)
```

**Required Frontmatter Fields:**
- `name`: Full name or preferred name
- `organizedPlayId`: Official Paizo Organized Play ID
- `games`: Array of games they run ["Pathfinder", "Starfinder", "Legacy"]

**Optional Frontmatter Fields:**
- `avatar`: Path to profile image
- `email`: Contact email (displayed publicly)
- `discord`: Discord username
- `specialties`: Array of specialties or interests

### Adding News Articles

Create markdown files in `src/content/news/` with this structure:

```markdown
---
title: "Welcome to Our New Website"
date: "2025-06-30"
author: "Lodge Admin"
excerpt: "We're excited to announce the launch of our new website with improved features and mobile support."
tags: ["announcement", "website", "community"]
---

# Welcome to Our New Website

We're thrilled to announce the launch of our completely redesigned website! This new platform brings together all the information our gaming community needs in one convenient location.

## What's New

### Enhanced Features
- **Interactive Calendar**: View all upcoming events in an easy-to-read calendar format
- **Mobile Responsive**: Perfect experience on phones, tablets, and desktops
- **Theme Options**: Choose between medieval and sci-fi themes to match your gaming style
- **Game Master Profiles**: Learn more about our amazing GMs and their specialties

### Improved Content Management
- All content is now managed through simple markdown files
- Faster updates and easier maintenance
- Better organization of events, news, and GM information

## Getting Started

Browse the calendar to see upcoming events, check out our game master profiles to learn about who runs our games, and stay updated with the latest news and announcements.

Welcome to the new Shifting Corridors Lodge website!
```

**Required Frontmatter Fields:**
- `title`: Article title
- `date`: Publication date in YYYY-MM-DD format
- `author`: Author name

**Optional Frontmatter Fields:**
- `excerpt`: Brief summary for article previews
- `tags`: Array of tags for categorization
- `featured`: Boolean to mark as featured article
- `image`: Header image for the article

### Content File Naming

Use descriptive, URL-friendly filenames:

- **Events**: `pathfinder-society-july-15.md`, `starfinder-adventure-aug-01.md`
- **Game Masters**: `josh-g.md`, `sarah-m.md`
- **News**: `new-website-launch.md`, `summer-schedule-update.md`

### Content Validation

The application includes validation for:
- Required frontmatter fields
- Date format validation
- Game type validation
- Markdown syntax checking
- Image path validation

Invalid content will show error messages in development and fallback content in production.

## Architecture Migration

### Cloudflare to AWS Migration

This website has been migrated from Cloudflare Workers to a static site architecture hosted on AWS. This change provides several benefits:

#### Previous Architecture (Cloudflare Workers)
- Server-side rendering with Cloudflare Workers
- Dynamic content generation
- Complex deployment pipeline
- Higher operational complexity

#### Current Architecture (AWS Static Site)
- **Static Site Generation**: Pre-built HTML, CSS, and JavaScript files
- **AWS S3 Hosting**: Cost-effective static website hosting
- **CloudFront CDN**: Global content delivery with edge caching
- **Simplified Deployment**: Direct file upload to S3 with cache invalidation

#### Migration Benefits
- **Improved Performance**: Static files load faster than server-rendered content
- **Reduced Costs**: S3 hosting is more cost-effective than serverless functions
- **Better Reliability**: Static sites have fewer points of failure
- **Easier Maintenance**: No server-side code to maintain or debug
- **Enhanced Security**: Static sites have a smaller attack surface

#### Removed Dependencies
The following Cloudflare-specific dependencies have been removed:
- `@cloudflare/workers-types`
- `wrangler` CLI tool
- Cloudflare Workers runtime APIs
- Server-side rendering logic
- Dynamic route handling

#### New Dependencies Added
- `gray-matter`: Frontmatter parsing for markdown files
- `react-markdown`: Client-side markdown rendering
- Enhanced build scripts for static site generation
- AWS deployment utilities

### Performance Optimizations

The static site architecture enables several performance optimizations:

- **Aggressive Caching**: Static assets cached at CDN edge locations
- **Code Splitting**: JavaScript bundles split for optimal loading
- **Image Optimization**: Optimized image formats and lazy loading
- **Bundle Analysis**: Regular bundle size monitoring and optimization
- **Core Web Vitals**: Optimized for Google's performance metrics

## Analytics and Privacy

### Fathom Analytics Integration

The website uses Fathom Analytics for privacy-focused user tracking:

- **GDPR Compliant**: No cookies or personal data collection
- **Privacy First**: Anonymous visitor tracking
- **Performance Focused**: Lightweight tracking script
- **Custom Events**: Track theme switches, content interactions, and navigation

### Analytics Configuration

Analytics tracking includes:
- Page views for all routes
- Theme switching events
- Event detail views
- Game master profile views
- News article interactions
- Mobile vs desktop usage patterns

## Performance Monitoring

### Core Web Vitals Tracking

The application monitors key performance metrics:

- **Largest Contentful Paint (LCP)**: Loading performance
- **First Input Delay (FID)**: Interactivity measurement
- **Cumulative Layout Shift (CLS)**: Visual stability
- **First Contentful Paint (FCP)**: Initial render timing

### Performance Optimization Features

- **Lazy Loading**: Non-critical components loaded on demand
- **Image Optimization**: WebP format with fallbacks
- **Bundle Splitting**: Separate chunks for vendor and application code
- **Caching Strategy**: Optimal cache headers for static assets
- **Compression**: Gzip compression for all text-based assets

## Browser Support

The website supports modern browsers with the following minimum versions:

- **Chrome**: Version 88+
- **Firefox**: Version 85+
- **Safari**: Version 14+
- **Edge**: Version 88+
- **Mobile Safari**: iOS 14+
- **Chrome Mobile**: Android 8+

### Progressive Enhancement

The site is built with progressive enhancement principles:
- Core functionality works without JavaScript
- Enhanced features require modern browser APIs
- Graceful degradation for older browsers
- Accessibility features work across all supported browsers

## Contributing

### Development Guidelines

When contributing to the project:

1. **Follow TypeScript Best Practices**: Use proper typing throughout
2. **Write Tests**: Include unit tests for new components and features
3. **Mobile First**: Design and test mobile experience first
4. **Accessibility**: Ensure all features are accessible
5. **Performance**: Consider performance impact of changes
6. **Documentation**: Update documentation for new features

### Code Style

The project uses:
- **Prettier**: Automatic code formatting
- **ESLint**: Code quality and consistency
- **TypeScript**: Static type checking
- **Conventional Commits**: Standardized commit messages

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with appropriate tests
3. Ensure all tests pass locally
4. Update documentation if needed
5. Submit pull request with clear description
6. Address review feedback
7. Merge after approval and passing CI

## License

This project is licensed under the MIT License - see the LICENSE file for details.