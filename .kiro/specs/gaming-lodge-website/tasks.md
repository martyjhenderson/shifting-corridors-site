# Implementation Plan

- [x] 1. Project setup and dependency management
  - Remove all Cloudflare Workers dependencies and references from package.json and configuration files
  - Update to latest compatible versions of React, TypeScript, and other core dependencies
  - Install required packages: react-markdown, gray-matter for frontmatter parsing, and Fathom analytics
  - Update build configuration to generate static files compatible with AWS S3 hosting
  - _Requirements: 7.3, 7.4, 9.3, 9.4_

- [x] 2. Core TypeScript interfaces and types
  - Create interfaces for CalendarEvent, GameMaster, NewsArticle, and Theme data structures
  - Define MarkdownContent interface for frontmatter and content parsing
  - Create ContentState and ContentActions interfaces for state management
  - Implement AnalyticsConfig and AnalyticsService interfaces for Fathom integration
  - _Requirements: 9.1, 9.2_

- [x] 3. Theme system implementation
  - Create ThemeContext with medieval and sci-fi theme configurations
  - Implement theme persistence using localStorage
  - Create CSS modules for both themes with proper variable definitions
  - Build theme selector component with switching functionality
  - Write unit tests for theme context and persistence
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.3_

- [x] 4. Markdown content loading service
  - Implement ContentLoader service to parse markdown files from content directories
  - Create markdown parser utility using gray-matter for frontmatter extraction
  - Build content caching mechanism for performance optimization
  - Add error handling for missing or malformed markdown files
  - Write comprehensive tests for content loading and parsing functionality
  - _Requirements: 1.4, 3.4, 4.3, 8.2_

- [x] 5. Calendar component implementation
  - Create Calendar component that displays events from markdown files
  - Implement event sorting and filtering by date
  - Add event selection functionality with detailed view
  - Create responsive calendar layout for mobile devices
  - Write unit tests for calendar component and event handling
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 8.1_

- [x] 6. UpcomingEvents side panel component
  - Build UpcomingEvents component that shows next 3 upcoming events
  - Implement chronological sorting with nearest event first
  - Add click navigation to detailed event views
  - Create responsive layout that adapts to mobile (converts to bottom panel)
  - Write tests for event sorting and display logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.4, 8.1_

- [x] 7. GameMasters component implementation
  - Create GameMasters component displaying all active game masters
  - Implement game master profile display with name, organized play ID, and games
  - Add click functionality to show detailed bio from markdown content
  - Create responsive grid layout that adapts from 3 columns to 1 on mobile
  - Write unit tests for game master display and interaction
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 8.1_

- [x] 8. News component implementation
  - Build News component that loads and displays articles from markdown files
  - Implement newest-first sorting for news articles
  - Add full article view functionality when news items are clicked
  - Create responsive news panel layout for mobile devices
  - Write tests for news loading, sorting, and display
  - _Requirements: 4.1, 4.2, 4.4, 6.1, 6.2, 8.1_

- [x] 9. EventDetails component for detailed views
  - Create EventDetails component for displaying full event information
  - Implement markdown content rendering for event descriptions
  - Add navigation back to calendar view
  - Ensure mobile-friendly layout and touch interactions
  - Write tests for event detail display and navigation
  - _Requirements: 1.3, 6.1, 6.3, 8.1_

- [x] 10. Fathom Analytics integration
  - Add Fathom Analytics script to index.html with site configuration
  - Create AnalyticsService for tracking page views and custom events
  - Implement event tracking for theme switches, content interactions, and navigation
  - Add privacy-compliant tracking without cookies
  - Write tests for analytics service functionality
  - _Requirements: Analytics integration from design document_

- [x] 11. Mobile responsiveness implementation
  - Implement responsive breakpoints and layout adaptations for all components
  - Create touch-friendly navigation with minimum 44px tap targets
  - Add swipe navigation for calendar component
  - Ensure proper layout adaptation for side panel on mobile devices
  - Test and validate mobile user experience across different screen sizes
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 12. Main App component integration
  - Create main App component that integrates all feature components
  - Implement content loading and state management using React Context
  - Add error boundaries for component-level failure handling
  - Create responsive main layout with proper component positioning
  - Wire up theme context throughout the application
  - _Requirements: 5.1, 5.2, 8.1_

- [ ] 13. Error handling and fallback implementation
  - Add graceful degradation for missing markdown files
  - Implement user-friendly error messages for content loading failures
  - Create fallback content for network issues
  - Add validation for markdown frontmatter structure with default values
  - Write tests for error scenarios and fallback behavior
  - _Requirements: Error handling from design document_

- [ ] 14. Performance optimization
  - Implement code splitting for non-critical components
  - Add lazy loading for non-visible content
  - Optimize bundle size through tree shaking and dependency analysis
  - Add browser caching strategies for markdown content
  - Test and validate Core Web Vitals performance metrics
  - _Requirements: Performance considerations from design document_

- [ ] 15. Comprehensive testing suite
  - Create integration tests for complete content loading and display workflow
  - Add end-to-end tests for theme switching functionality
  - Implement mobile responsiveness testing across breakpoints
  - Create tests for component interaction and navigation flows
  - Ensure test coverage meets comprehensive requirements for all critical functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 16. AWS S3 deployment configuration
  - Remove all Cloudflare Workers references from deployment scripts
  - Create AWS S3 bucket configuration for static website hosting
  - Set up CloudFront distribution for global content delivery
  - Configure GitHub Actions workflow for automated deployment
  - Test deployment process and validate static site functionality
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 17. Documentation and README update
  - Update README.md with current specifications and features
  - Document local development setup process
  - Add AWS deployment instructions and configuration details
  - Include information about markdown content structure and theme system
  - Document removal of Cloudflare dependencies and new AWS-based architecture
  - _Requirements: 10.1, 10.2, 10.3, 10.4_