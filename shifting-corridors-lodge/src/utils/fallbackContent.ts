import { CalendarEvent, GameMaster, NewsArticle, FallbackContent } from '../types';

/**
 * Fallback content for when markdown files cannot be loaded
 * This ensures the site remains functional even with network issues
 */

export const FALLBACK_EVENTS: CalendarEvent[] = [
  {
    id: 'fallback-pathfinder-event',
    title: 'Pathfinder Society Game Night',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    description: 'Join us for an exciting Pathfinder Society adventure! Check back later for specific scenario details and registration information.',
    content: `# Pathfinder Society Game Night

We're preparing an exciting Pathfinder Society session for you!

## What to Expect
- Classic Pathfinder 2E gameplay
- Organized Play credit
- Friendly community atmosphere
- All experience levels welcome

## Next Steps
Please check back soon for:
- Specific scenario information
- Registration links
- Location details
- Time confirmation

*This is placeholder content. Actual event details will be loaded when available.*`,
    gameType: 'Pathfinder',
    maxPlayers: 6
  },
  {
    id: 'fallback-starfinder-event',
    title: 'Starfinder Society Adventure',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks
    description: 'Experience the future of roleplaying with Starfinder Society! Details will be available soon.',
    content: `# Starfinder Society Adventure

Get ready for sci-fi adventure in the Starfinder universe!

## What to Expect
- Starfinder 2E gameplay
- Space exploration and combat
- High-tech equipment and abilities
- Organized Play credit

## Coming Soon
- Scenario selection
- Character creation guidance
- Registration information
- Venue details

*This is placeholder content. Actual event details will be loaded when available.*`,
    gameType: 'Starfinder',
    maxPlayers: 6
  }
];

export const FALLBACK_GAMEMASTERS: GameMaster[] = [
  {
    id: 'fallback-gm-1',
    name: 'Game Master',
    organizedPlayId: '00000',
    games: ['Pathfinder', 'Starfinder'],
    bio: `Our experienced Game Masters are dedicated to providing excellent gaming experiences for all players.

**What Our GMs Offer:**
- Welcoming atmosphere for new and experienced players
- Knowledge of current Organized Play rules
- Engaging storytelling and fair gameplay
- Support for character development and growth

*Individual GM profiles will be loaded when available.*`
  }
];

export const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: 'fallback-welcome',
    title: 'Welcome to Shifting Corridors Lodge',
    date: new Date(),
    excerpt: 'Welcome to our gaming community! We host regular Pathfinder and Starfinder Society games.',
    content: `# Welcome to Shifting Corridors Lodge

Thank you for visiting our gaming community website!

## About Us
Shifting Corridors Lodge is a welcoming community for tabletop RPG enthusiasts. We regularly host Pathfinder Society and Starfinder Society games, providing opportunities for both new and experienced players to enjoy organized play.

## What We Offer
- **Regular Game Sessions**: Scheduled Pathfinder and Starfinder Society games
- **Experienced Game Masters**: Knowledgeable GMs who create engaging experiences
- **Welcoming Community**: Friendly atmosphere for players of all experience levels
- **Organized Play Credit**: Official scenarios that count toward your character's advancement

## Getting Started
- Check our calendar for upcoming events
- Review our Game Master profiles
- Join us for your next adventure!

## Stay Connected
Keep checking back for:
- Event announcements
- Schedule updates
- Community news
- Special events

*This is placeholder content. Current news and updates will be loaded when available.*`,
    author: 'Lodge Administration'
  }
];

/**
 * Get fallback content for all content types
 */
export const getFallbackContent = (): FallbackContent => ({
  events: FALLBACK_EVENTS,
  gamemasters: FALLBACK_GAMEMASTERS,
  news: FALLBACK_NEWS
});

/**
 * Get fallback content for specific content type
 */
export const getFallbackEvents = (): CalendarEvent[] => FALLBACK_EVENTS;
export const getFallbackGameMasters = (): GameMaster[] => FALLBACK_GAMEMASTERS;
export const getFallbackNews = (): NewsArticle[] => FALLBACK_NEWS;

/**
 * Check if content appears to be fallback content
 */
export const isFallbackContent = (content: any[]): boolean => {
  if (!Array.isArray(content) || content.length === 0) {
    return false;
  }

  // Check if any items have fallback IDs
  return content.some(item => 
    item.id && typeof item.id === 'string' && item.id.startsWith('fallback-')
  );
};

/**
 * Merge fallback content with partial real content
 */
export const mergeWithFallback = <T extends { id: string }>(
  realContent: T[],
  fallbackContent: T[]
): T[] => {
  if (!realContent || realContent.length === 0) {
    return fallbackContent;
  }

  // If we have some real content, use it
  // Only add fallback items if we have very little real content
  if (realContent.length >= 2) {
    return realContent;
  }

  // Merge real content with fallback, avoiding duplicates
  const realIds = new Set(realContent.map(item => item.id));
  const additionalFallback = fallbackContent.filter(item => !realIds.has(item.id));
  
  return [...realContent, ...additionalFallback];
};

/**
 * Create error-specific fallback content
 */
export const getErrorFallbackContent = (errorType: string): FallbackContent => {
  const baseContent = getFallbackContent();
  
  // Customize fallback content based on error type
  switch (errorType) {
    case 'network':
      return {
        ...baseContent,
        news: [{
          id: 'network-error-notice',
          title: 'Connection Issue',
          date: new Date(),
          excerpt: 'We\'re having trouble loading the latest content. Please check your connection and try again.',
          content: `# Connection Issue

We're currently unable to load the latest content from our servers.

## What This Means
- You're seeing cached or placeholder content
- Some information may be outdated
- New events might not be visible

## What You Can Do
- Check your internet connection
- Try refreshing the page
- Come back in a few minutes

We apologize for the inconvenience and are working to resolve this issue.`,
          author: 'System'
        }, ...baseContent.news]
      };
      
    case 'parsing':
      return {
        ...baseContent,
        news: [{
          id: 'parsing-error-notice',
          title: 'Content Loading Issue',
          date: new Date(),
          excerpt: 'Some content couldn\'t be processed correctly. We\'re showing available information.',
          content: `# Content Loading Issue

We encountered an issue while processing some of our content files.

## Current Status
- Basic functionality is available
- Some details may be missing
- We're working to fix the issue

## What's Available
- General event information
- Game Master contacts
- Basic community information

Please check back soon for complete information.`,
          author: 'System'
        }, ...baseContent.news]
      };
      
    default:
      return baseContent;
  }
};