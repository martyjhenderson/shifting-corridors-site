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

- [x] 13. Error handling and fallback implementation
  - Add graceful degradation for missing markdown files
  - Implement user-friendly error messages for content loading failures
  - Create fallback content for network issues
  - Add validation for markdown frontmatter structure with default values
  - Write tests for error scenarios and fallback behavior
  - _Requirements: Error handling from design document_

- [x] 14. Performance optimization
  - Implement code splitting for non-critical components
  - Add lazy loading for non-visible content
  - Optimize bundle size through tree shaking and dependency analysis
  - Add browser caching strategies for markdown content
  - Test and validate Core Web Vitals performance metrics
  - _Requirements: Performance considerations from design document_

- [x] 15. Comprehensive testing suite
  - Create integration tests for complete content loading and display workflow
  - Add end-to-end tests for theme switching functionality
  - Implement mobile responsiveness testing across breakpoints
  - Create tests for component interaction and navigation flows
  - Ensure test coverage meets comprehensive requirements for all critical functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 16. AWS S3 deployment configuration
  - Remove all Cloudflare Workers references from deployment scripts
  - Create AWS S3 bucket configuration for static website hosting
  - Set up CloudFront distribution for global content delivery
  - Configure GitHub Actions workflow for automated deployment
  - Test deployment process and validate static site functionality
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 17. Documentation and README update
  - Update README.md with current specifications and features
  - Document local development setup process
  - Add AWS deployment instructions and configuration details
  - Include information about markdown content structure and theme system
  - Document removal of Cloudflare dependencies and new AWS-based architecture
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 18. Update existing content to match new format requirements
  - Review and update all existing markdown files in content/calendar to ensure proper frontmatter structure
  - Update content/gamemasters markdown files to include required metadata (name, organizedPlayId, games array)
  - Update content/news markdown files to include proper frontmatter with title, date, author, and excerpt
  - Validate that all content files follow the standardized markdown structure defined in the design document
  - Test content loading with updated files to ensure compatibility with the ContentLoader service
  - _Requirements: 1.4, 3.4, 4.3_

- [x] 19. Verify website functionality and fix runtime errors
  - Run npm install to ensure all dependencies are properly installed
  - Execute npm start to launch the development server and verify the website loads without errors
  - Test all major functionality including theme switching, content loading, and component rendering
  - Identify and resolve any console errors, TypeScript compilation issues, or runtime exceptions
  - Verify that all components render correctly and content loads from markdown files
  - Run npm test to ensure all tests pass and fix any failing test cases
  - _Requirements: 9.3, 8.1, 8.4_

- [x] 20. Fix Contact Information panel content loading issue
  - Investigate why Contact Information panel is loading game event content instead of contact details
  - Ensure Contact component is properly isolated and not receiving event data
  - Verify that the Contact component renders the correct static contact information
  - Test that contact information displays consistently across different themes
  - _Requirements: Contact information display bug fix_

- [x] 21. Fix panel layout alignment and styling issues
  - Fix misaligned text in UpcomingEvents component that appears off the box boundaries
  - Ensure all panel components have consistent box styling and proper spacing
  - Fix boxes near the bottom that appear significantly below the main content area
  - Implement proper CSS Grid/Flexbox alignment for sidebar components
  - Ensure consistent panel heights and proper responsive behavior on mobile and desktop
  - Add missing CSS styles for UpcomingEvents component layout and alignment
  - _Requirements: 6.1, 6.2, 6.4 - Mobile responsiveness and layout consistency_

- [x] 22. Remove duplicate UpcomingEvents section and fix layout
  - Remove the UpcomingEvents component from the sidebar to eliminate duplicate sections
  - Keep only the upcoming events section that appears below the main calendar
  - Ensure the remaining upcoming events display is properly integrated with the calendar
  - _Requirements: Layout cleanup and user experience improvement_

- [x] 23. Fix EventDetails back navigation functionality
  - Fix the "Back to Calendar" button in EventDetails component to properly return to the main calendar view
  - Ensure navigation works correctly instead of going to the next most recent event
  - Implement proper routing back to the home page with calendar view
  - _Requirements: 1.3, 6.3 - Event detail navigation_

- [x] 24. Update Contact Information content
  - Remove the "Game Locations" section from the Contact component
  - Replace with contact email information directing users to "lodge@shiftingcorridor.com"
  - Add appropriate messaging about reaching out for additional information
  - _Requirements: Contact information content update_

- [x] 25. Fix date display offset issue
  - Investigate why events with date "2025-07-13" are showing on 7/12 instead of 7/13
  - Fix date parsing and display logic to show events on the correct calendar dates
  - Ensure timezone handling doesn't cause date shifts
  - _Requirements: 1.1, 1.2 - Calendar event display accuracy_

- [x] 26. Stack Game Masters boxes vertically
  - Change Game Masters component layout from horizontal grid to vertical stack
  - Update CSS to display Game Master cards in a single column layout
  - Ensure proper spacing and alignment in vertical layout
  - _Requirements: 3.1, 6.1 - Game Masters display layout_

- [x] 27. Remove event details box above event content
  - Remove the upper details box that appears above the actual event details
  - Keep only the lower event details section showing
  - Clean up event display layout for better user experience
  - _Requirements: 1.3 - Event detail display cleanup_

- [x] 28. Fix incorrect Game Master assignment in events
  - Investigate why July 8, 2025 event shows GM "josh-g" when markdown says "marty-h"
  - Check content loading and parsing logic for Game Master assignment
  - Ensure events display the correct Game Master from their markdown frontmatter
  - _Requirements: 1.4, 3.4 - Content loading accuracy_

- [x] 29. Remove placeholder news article when real news loads
  - Remove the placeholder news article that appears alongside the real news article
  - Ensure only the actual news content is displayed when it loads successfully
  - Clean up news display to show only legitimate news items
  - _Requirements: 4.1, 4.2 - News display cleanup_

- [x] 30. Swap positions of Contact and Game Masters in sidebar
  - Move Contact Information to appear above Game Masters in the sidebar
  - Ensure Contact appears near the top on desktop browsers
  - Maintain proper responsive behavior on mobile devices
  - _Requirements: Layout improvement and user experience_