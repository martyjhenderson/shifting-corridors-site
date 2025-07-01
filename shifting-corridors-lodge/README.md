# Shifting Corridors Lodge Website

A static React-based website for the Shifting Corridors Lodge, a Paizo Organized Play Lodge focused on the Iowa City and Cedar Rapids areas.

## Overview

This website centralizes information for players and game masters, providing a calendar of events, a list of game masters, contact information, and news articles. The site features a dual-theme system with a medieval and sci-fi aesthetic.

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
- Features the lodge email: lodge@shiftingcorridor.com

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
- React
- TypeScript
- Styled Components
- React Router
- React Markdown
- React Calendar
- AWS S3 + CloudFront (for deployment)

### Project Structure
```
shifting-corridors-lodge/
├── public/                  # Static files
├── src/
│   ├── components/          # React components
│   │   ├── Calendar.tsx     # Calendar component
│   │   ├── Contact.tsx      # Contact information component
│   │   ├── GameMasters.tsx  # Game masters list component
│   │   └── News.tsx         # News articles component
│   ├── content/             # Markdown content
│   │   ├── calendar/        # Calendar events markdown files
│   │   ├── gamemasters/     # Game master information markdown files
│   │   └── news/            # News articles markdown files
│   ├── styles/              # Style-related files
│   │   └── themes.ts        # Theme definitions
│   ├── tests/               # Component tests
│   │   └── Calendar.test.tsx # Calendar component tests
│   ├── utils/               # Utility functions and contexts
│   │   └── ThemeContext.tsx # Theme context provider
│   ├── App.tsx              # Main application component
│   └── index.tsx            # Entry point
├── aws/                     # AWS deployment configuration
│   ├── cloudformation-template.yml  # Infrastructure as Code
│   └── deploy-infrastructure.sh     # Deployment script
└── package.json             # Dependencies and scripts
```

## Testing

The project includes comprehensive tests for all components using React Testing Library. Run tests with:

```bash
npm test
```

Tests verify that:
- Components render correctly
- Theme switching works as expected
- Calendar displays events properly
- Game masters list renders correctly
- Contact information is displayed
- News articles are rendered from markdown

## Deployment

### Deploying to AWS S3 + CloudFront

This project is configured to deploy to AWS S3 with CloudFront distribution for global content delivery.

#### Prerequisites

1. Install and configure AWS CLI:

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
```

#### Infrastructure Setup

1. Deploy the AWS infrastructure using CloudFormation:

```bash
cd aws
./deploy-infrastructure.sh
```

2. Configure GitHub Actions secrets with the values from the CloudFormation outputs:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `S3_BUCKET_NAME`
   - `CLOUDFRONT_DISTRIBUTION_ID`

#### Manual Deployment

For manual deployment, you can use the deployment script:

```bash
npm run deploy:aws
```

Make sure to set the required environment variables:

```bash
export S3_BUCKET_NAME=your-bucket-name
export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

Alternatively, you can deploy the static files manually:

1. Build the production version:
```bash
npm run build
```

2. The build folder will contain static files that can be deployed to any static hosting service.

3. For optimal performance, consider using a CDN and enabling caching for static assets.

## Development

To run the development server:

```bash
npm start
```

This will start the development server at http://localhost:3000.

## Adding Content

### Adding Calendar Events
Create markdown files in the `src/content/calendar` directory with the following format:

```markdown
---
title: Event Title
date: 2025-07-15
url: /events/event-url
---

Event description goes here.
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

## License

This project is licensed under the MIT License - see the LICENSE file for details.