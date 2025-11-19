# Shifting Corridors Lodge Website

A static React-based website for the Shifting Corridors Lodge, a Paizo Organized Play Lodge focused on the Iowa City and Cedar Rapids areas.

## Overview

This website centralizes information for players and game masters, providing a calendar of events, a list of game masters, contact information, and news articles. The site features a dual-theme system with a medieval and sci-fi aesthetic.

## Getting Started

To work with this project:

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shifting-corridors-site.git
cd shifting-corridors-site
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
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
- AWS Amplify (for deployment)

### Project Structure
```
shifting-corridors-site/
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
├── amplify.yml              # AWS Amplify build configuration
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

### Deploying to AWS Amplify

This project is configured to deploy to AWS Amplify using Git-based deployment:

1. **Connect your repository to AWS Amplify:**
   - Log in to the AWS Amplify Console
   - Click "New app" > "Host web app"
   - Connect your Git repository (GitHub, GitLab, Bitbucket, etc.)
   - Select the repository and branch you want to deploy

2. **Configure build settings:**
   AWS Amplify will automatically detect the React app and configure the build settings. The default configuration should work:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: build
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Deploy:**
   - AWS Amplify will automatically build and deploy your app
   - Every push to the connected branch will trigger a new deployment
   - You can view build logs and deployment status in the Amplify Console

4. **Custom domain (optional):**
   - In the Amplify Console, go to "Domain management"
   - Add your custom domain and follow the DNS configuration instructions

### Manual Build

To build the production version locally:

```bash
npm run build
```

The build folder will contain static files that can be deployed to any static hosting service.

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

For questions or more information about the Shifting Corridors Lodge, please contact:
- Email: lodge@shiftingcorridor.com
- Website: [shiftingcorridor.com](https://shiftingcorridor.com)