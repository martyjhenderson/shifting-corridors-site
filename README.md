# Shifting Corridors Lodge Website

Website for the Cedar Rapids-Iowa City Corridor Paizo Society Games.

## Project Overview

This repository contains the website for the Shifting Corridors Lodge, a Paizo Organized Play Lodge focused on the Iowa City and Cedar Rapids areas. The website provides information about upcoming events, game masters, and lodge news.

## Project Structure

The main project is located in the `shifting-corridors-lodge` directory. This is a React-based static site that is deployed to Cloudflare Workers.

```
shifting-corridors-site/
└── shifting-corridors-lodge/   # Main project directory
    ├── src/                    # Source code
    │   ├── components/         # React components
    │   ├── content/            # Markdown content for events, news, etc.
    │   ├── utils/              # Utility functions
    │   └── ...
    ├── workers-site/           # Cloudflare Workers configuration
    ├── public/                 # Static assets
    └── ...
```

For more detailed information about the project, please see the [project README](shifting-corridors-lodge/README.md).

## Getting Started

To work with this project:

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shifting-corridors-site.git
cd shifting-corridors-site
```

2. Navigate to the project directory:
```bash
cd shifting-corridors-lodge
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

## Deployment

The website is deployed to Cloudflare Workers. For deployment instructions, see the [project README](shifting-corridors-lodge/README.md#deployment).

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