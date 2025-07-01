# Requirements Document

## Introduction

The Shifting Corridors Lodge website is a React-based gaming community platform that displays information about game masters, upcoming events, and news. The site loads content from markdown files and provides a themed experience for tabletop gaming enthusiasts. The platform supports both medieval and sci-fi themes, is mobile-responsive, and deploys as a static site to AWS S3.

## Requirements

### Requirement 1

**User Story:** As a gaming community member, I want to view upcoming events in a calendar format, so that I can plan my gaming sessions.

#### Acceptance Criteria

1. WHEN the user visits the site THEN the system SHALL display a calendar component showing events from markdown files in content/calendar
2. WHEN an event exists in the calendar THEN the system SHALL display the event title, date, and basic information
3. WHEN the user clicks on a calendar event THEN the system SHALL show detailed event information from the markdown content
4. WHEN events are loaded THEN the system SHALL parse markdown frontmatter for event metadata (date, title, description)

### Requirement 2

**User Story:** As a gaming community member, I want to see the next three upcoming events prominently displayed, so that I don't miss important gaming sessions.

#### Acceptance Criteria

1. WHEN the user visits the site THEN the system SHALL display a side panel showing the next 3 upcoming events
2. WHEN events are displayed in the side panel THEN the system SHALL sort them chronologically with the nearest event first
3. WHEN an event is clicked in the side panel THEN the system SHALL navigate to the detailed event view
4. WHEN there are fewer than 3 upcoming events THEN the system SHALL display only the available events

### Requirement 3

**User Story:** As a gaming community member, I want to view information about game masters, so that I can learn about who runs the games I'm interested in.

#### Acceptance Criteria

1. WHEN the user visits the site THEN the system SHALL display a game masters section with all active GMs
2. WHEN a game master is displayed THEN the system SHALL show their name, organized play ID, and games they run (Pathfinder, Starfinder, or Legacy)
3. WHEN the user clicks on a game master's name THEN the system SHALL display their detailed bio from the markdown file
4. WHEN game master data is loaded THEN the system SHALL parse markdown files from content/gamemasters directory

### Requirement 4

**User Story:** As a gaming community member, I want to read recent news about the lodge, so that I stay informed about community updates.

#### Acceptance Criteria

1. WHEN the user visits the site THEN the system SHALL display a news panel with recent announcements
2. WHEN news items are displayed THEN the system SHALL sort them with newest articles first
3. WHEN news content is loaded THEN the system SHALL parse markdown files from content/news directory
4. WHEN a news item is clicked THEN the system SHALL display the full article content

### Requirement 5

**User Story:** As a user with theme preferences, I want to choose between medieval and sci-fi themes, so that the site matches my gaming interests.

#### Acceptance Criteria

1. WHEN the user visits the site THEN the system SHALL provide a theme selector with medieval and sci-fi options
2. WHEN the user selects a theme THEN the system SHALL apply the corresponding visual styling throughout the site
3. WHEN a theme is selected THEN the system SHALL persist the user's choice across browser sessions
4. WHEN the site loads THEN the system SHALL apply the user's previously selected theme or default to medieval

### Requirement 6

**User Story:** As a mobile user, I want the website to work well on my phone or tablet, so that I can access lodge information on the go.

#### Acceptance Criteria

1. WHEN the user accesses the site on a mobile device THEN the system SHALL display a responsive layout optimized for small screens
2. WHEN viewed on mobile THEN the system SHALL maintain readability and usability of all content
3. WHEN navigation elements are displayed on mobile THEN the system SHALL provide touch-friendly interface elements
4. WHEN the side panel is viewed on mobile THEN the system SHALL adapt the layout to fit smaller screens appropriately

### Requirement 7

**User Story:** As a site administrator, I want the website deployed as a static site on AWS S3, so that it's cost-effective and performant.

#### Acceptance Criteria

1. WHEN the site is built THEN the system SHALL generate static files compatible with AWS S3 hosting
2. WHEN deployed to S3 THEN the system SHALL serve all content without requiring server-side processing
3. WHEN the build process runs THEN the system SHALL remove all Cloudflare Workers dependencies and references
4. WHEN packages are updated THEN the system SHALL use the latest compatible versions of all dependencies

### Requirement 8

**User Story:** As a developer, I want comprehensive tests for all features, so that the site remains reliable as it evolves.

#### Acceptance Criteria

1. WHEN code is written THEN the system SHALL include unit tests for all React components
2. WHEN markdown parsing functionality is implemented THEN the system SHALL include tests for content loading and parsing
3. WHEN theme switching is implemented THEN the system SHALL include tests for theme persistence and application
4. WHEN the test suite runs THEN the system SHALL achieve comprehensive coverage of critical functionality

### Requirement 9

**User Story:** As a developer, I want the codebase built with TypeScript and React, so that it's maintainable and type-safe.

#### Acceptance Criteria

1. WHEN components are created THEN the system SHALL use TypeScript for all React components
2. WHEN data structures are defined THEN the system SHALL use proper TypeScript interfaces and types
3. WHEN the project is built THEN the system SHALL compile without TypeScript errors
4. WHEN dependencies are managed THEN the system SHALL use React 18+ and compatible TypeScript versions

### Requirement 10

**User Story:** As a developer or user, I want current documentation, so that I understand the site's capabilities and setup process.

#### Acceptance Criteria

1. WHEN the README is updated THEN the system SHALL document all current features and specifications
2. WHEN setup instructions are provided THEN the system SHALL include steps for local development and AWS deployment
3. WHEN the documentation is written THEN the system SHALL reflect the removal of Cloudflare dependencies
4. WHEN technical details are documented THEN the system SHALL include information about the markdown content structure