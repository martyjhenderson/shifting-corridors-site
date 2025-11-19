# Requirements Document

## Introduction

MushroomsAndFrogs.com is a static React website that presents interesting facts about frogs and mushrooms in an engaging, visually appealing format. The site features a single-page design with two prominent fact boxes, uses a teal and red color scheme, and includes proper copyright attribution. The website will be deployed to AWS S3 with automated GitHub Actions deployment.

## Requirements

### Requirement 1

**User Story:** As a visitor, I want to view interesting facts about frogs and mushrooms on a single page, so that I can learn something new in a quick, engaging format.

#### Acceptance Criteria

1. WHEN a user visits the website THEN the system SHALL display a single page with the title "MushroomsAndFrogs.com"
2. WHEN the page loads THEN the system SHALL display two distinct boxes, one containing a fact about frogs and one containing a fact about mushrooms
3. WHEN a user views the page THEN the system SHALL present the facts in a clear, readable format within their respective boxes
4. WHEN the page is accessed THEN the system SHALL load quickly as a static website

### Requirement 2

**User Story:** As a visitor, I want the website to have an appealing visual design with teal and red colors, so that the content is presented in an attractive and memorable way.

#### Acceptance Criteria

1. WHEN a user views the website THEN the system SHALL use teal as a primary color theme
2. WHEN a user views the website THEN the system SHALL use red as a secondary color theme
3. WHEN the page loads THEN the system SHALL include appropriate accent colors that complement the teal and red scheme
4. WHEN a user views the fact boxes THEN the system SHALL present them with distinct visual styling that enhances readability
5. WHEN the page is displayed THEN the system SHALL maintain consistent color usage throughout the design

### Requirement 3

**User Story:** As a content owner, I want proper copyright attribution displayed on the website, so that intellectual property rights are clearly established.

#### Acceptance Criteria

1. WHEN a user views the website THEN the system SHALL display a footer with copyright information
2. WHEN the footer is displayed THEN the system SHALL show the current year in the copyright notice
3. WHEN the footer is displayed THEN the system SHALL attribute copyright to "Sam H"
4. WHEN the footer is displayed THEN the system SHALL include the email address "sam@fivescholars.com"

### Requirement 4

**User Story:** As a developer, I want the website built with React and JavaScript with comprehensive tests, so that the code is maintainable and reliable.

#### Acceptance Criteria

1. WHEN the website is built THEN the system SHALL use React as the frontend framework
2. WHEN the website is built THEN the system SHALL use JavaScript (not TypeScript) for implementation
3. WHEN the codebase is created THEN the system SHALL include unit tests for all components
4. WHEN tests are run THEN the system SHALL achieve good test coverage for the application logic
5. WHEN the project is structured THEN the system SHALL follow React best practices and conventions

### Requirement 5

**User Story:** As a site administrator, I want automated deployment to AWS S3 via GitHub Actions, so that updates can be deployed efficiently without manual intervention.

#### Acceptance Criteria

1. WHEN code is pushed to the main branch THEN the system SHALL automatically trigger a GitHub Actions workflow
2. WHEN the GitHub Actions workflow runs THEN the system SHALL build the React application
3. WHEN the build is successful THEN the system SHALL deploy the static files to AWS S3
4. WHEN deployment occurs THEN the system SHALL use provided AWS credentials securely
5. WHEN the deployment completes THEN the system SHALL make the updated website available via S3 static hosting

### Requirement 6

**User Story:** As a content maintainer, I want clear documentation on how to update facts and manage the website, so that I can easily maintain the content without technical expertise.

#### Acceptance Criteria

1. WHEN the project is delivered THEN the system SHALL include a comprehensive README file
2. WHEN the README is viewed THEN the system SHALL explain how the website works
3. WHEN the README is viewed THEN the system SHALL provide clear instructions for updating frog facts
4. WHEN the README is viewed THEN the system SHALL provide clear instructions for updating mushroom facts
5. WHEN the README is viewed THEN the system SHALL include information about the deployment process
6. WHEN facts need updating THEN the system SHALL allow updates through simple file modifications