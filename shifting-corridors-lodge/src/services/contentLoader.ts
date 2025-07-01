import matter from 'gray-matter';
import { CalendarEvent, GameMaster, NewsArticle, MarkdownContent, ContentLoader } from '../types';

// Static content data extracted from markdown files
// This approach ensures the content is available at build time for static deployment
const STATIC_CONTENT = {
  calendar: [
    {
      filename: 'diversions-game-night.md',
      content: `---
title: Pathfinder Society at Diversions
date: 2025-06-25
url: /events/diversions-game-night
location: Diversions
address: 119 2nd St #300, Coralville, IA 52241
---

# Pathfinder Society at Diversions

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** June 25, 2025
- **Time:** 5:30 PM - 9:30 PM
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Silver Bark, Golden Blades** - [Sign up here](https://www.rpgchronicles.net/session/ec927ed1-61f4-4441-af7f-de92051b4367/pregame)
2. **All That Glitters** - [Sign up here](https://www.rpgchronicles.net/session/2d61cf38-9249-43b0-a514-5c849bd3d7e6/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!`
    },
    {
      filename: 'gcg-29-july.md',
      content: `---
title: Pathfinder Society at Geek City Games
date: 2025-06-29
url: /events/gcg-29Jun2025
location: Geek City Games
address: 365 Beaver Kreek Center suite b, North Liberty, IA 52317
---

# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** June 29, 2025
- **Time:** 12:00 noon - 4:30pm
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317

## Available Scenarios

1. **Negotiations for the Star Gun** - [Sign up here](https://www.rpgchronicles.net/session/1f7ab80c-4cdc-44c3-b13d-dcdb33d45d54/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!`
    },
    {
      filename: 'diversions-symposium-fallen-god.md',
      content: `---
title: Pathfinder Society at Diversions - Symposium on a Fallen God
date: 2025-07-09
url: /events/diversions-symposium-fallen-god
location: Diversions
address: 119 2nd St #300, Coralville, IA 52241
---

# Pathfinder Society at Diversions - Symposium on a Fallen God

Join us for Pathfinder Society games at Diversions in Coralville!

## Details

- **Date:** July 9, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Symposium on a Fallen God** - [Sign up here](https://www.rpgchronicles.net/session/cabe4362-50e0-4447-b5fc-b7361b3d586c/pregame)

## Registration

Please register in advance using the link above. Space is limited, so sign up early!`
    },
    {
      filename: 'gcg-13-july.md',
      content: `---
title: Pathfinder Society at Geek City Games
date: 2025-07-13
url: /events/gcg-13Jul2025
location: Geek City Games
address: 365 Beaver Kreek Center suite b, North Liberty, IA 52317
---

# Pathfinder Society at Geek City Games

Join us for Pathfinder Society games at Geek City Games in North Liberty!

## Details

- **Date:** July 13, 2025
- **Time:** 12:00 noon - 5:00pm
- **Location:** Geek City Games
- **Address:** 365 Beaver Kreek Center suite b, North Liberty, IA 52317

## Available Scenarios

1. **Within the Prairies** - [Sign up here](https://www.rpgchronicles.net/session/5a519ffb-56a6-4eab-982f-9b8da8d232e2/pregame)

## Registration

Please register in advance using the links above. Space is limited, so sign up early!`
    },
    {
      filename: 'diversions-battle-nova-rush.md',
      content: `---
title: Starfinder Society at Diversions - Battle for Nova Rush
date: 2025-07-23
url: /events/diversions-battle-nova-rush
location: Diversions
address: 119 2nd St #300, Coralville, IA 52241
---

# Starfinder Society at Diversions - Battle for Nova Rush

Join us for Starfinder Society games at Diversions in Coralville!

## Details

- **Date:** July 23, 2025
- **Time:** 5:30 PM - 9:30 PM Central Time
- **Location:** Diversions
- **Address:** 119 2nd St #300, Coralville, IA 52241

## Available Scenarios

1. **Battle for Nova Rush** - [Sign up here](https://www.rpgchronicles.net/session/3793181b-71db-4409-91b3-b4a2cd28d469/pregame)

## Special Note

**This is the first Starfinder Second Edition game available for Organized Play credit!** Don't miss this opportunity to be among the first to play Starfinder 2E in an official Organized Play setting.

## Registration

Please register in advance using the link above. Space is limited, so sign up early!`
    }
  ],
  gamemasters: [
    {
      filename: 'marty-h.md',
      content: `---
firstName: Marty
lastInitial: H
organizedPlayNumber: 30480
games:
  - Pathfinder
  - Starfinder
---

Marty is the Corridor Venture-Lieutenant and a Game Master who runs scenarios for Pathfinder 2E and Starfinder 2E. He specializes in creating immersive roleplaying experiences and his collection of maps and lending of dice.`
    },
    {
      filename: 'josh-g.md',
      content: `---
firstName: Josh
lastInitial: G
organizedPlayNumber: 13151
games:
  - Pathfinder
---

Josh is an experienced Game Master with a legacy of running games stretching back before Pathfinder existed. His sense of humor and desire to see the players laugh makes for a great experience.`
    }
  ],
  news: [
    {
      filename: 'new-lodge-website.md',
      content: `---
title: New Lodge Website Launched
date: 2025-06-23
id: new-lodge-website
---

# New Lodge Website Launched

We're excited to announce the launch of our new Shifting Corridors Lodge website!

This new site will help us better coordinate events and share information with our community.

## Features

- Event calendar with upcoming games
- List of Game Masters
- News updates
- Contact information

Stay tuned for more updates and events!`
    }
  ]
};

/**
 * Content loading service that handles markdown file parsing and content transformation
 */
class ContentLoaderService implements ContentLoader {
  private contentCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Parse a markdown file content
   */
  async parseMarkdownFile(filePath: string): Promise<MarkdownContent> {
    try {
      // For static builds, we don't actually fetch files by path
      // This method is kept for interface compatibility
      const { data, content } = matter('');
      return {
        frontmatter: data,
        content
      };
    } catch (error) {
      console.error(`Error parsing markdown file ${filePath}:`, error);
      return {
        frontmatter: {},
        content: ''
      };
    }
  }

  /**
   * Parse markdown content string
   */
  private parseMarkdownContent(markdownContent: string, fileName: string): MarkdownContent {
    try {
      const parsed = matter(markdownContent);
      if (!parsed) {
        throw new Error('Failed to parse markdown');
      }
      
      return {
        frontmatter: {
          ...parsed.data,
          id: fileName.replace('.md', '')
        },
        content: parsed.content || ''
      };
    } catch (error) {
      console.error(`Error parsing markdown content for ${fileName}:`, error);
      return {
        frontmatter: { id: fileName.replace('.md', '') },
        content: markdownContent || ''
      };
    }
  }

  /**
   * Load calendar events from markdown files
   */
  async loadCalendarEvents(): Promise<CalendarEvent[]> {
    const cacheKey = 'calendar-events';
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }

    try {
      const events: CalendarEvent[] = [];

      for (const file of STATIC_CONTENT.calendar) {
        const parsed = this.parseMarkdownContent(file.content, file.filename);
        
        // Transform markdown content to CalendarEvent
        const event: CalendarEvent = {
          id: parsed.frontmatter.id || file.filename.replace('.md', ''),
          title: parsed.frontmatter.title || 'Untitled Event',
          date: this.parseDate(parsed.frontmatter.date),
          description: this.extractDescription(parsed.content),
          content: parsed.content,
          gamemaster: parsed.frontmatter.gamemaster,
          gameType: this.determineGameType(parsed.frontmatter.title || '', parsed.content),
          maxPlayers: parsed.frontmatter.maxPlayers
        };

        events.push(event);
      }

      // Sort events by date
      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Cache the results
      this.contentCache.set(cacheKey, events);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return events;
    } catch (error) {
      console.error('Error loading calendar events:', error);
      return this.getFallbackCalendarEvents();
    }
  }

  /**
   * Load game masters from markdown files
   */
  async loadGameMasters(): Promise<GameMaster[]> {
    const cacheKey = 'game-masters';
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }

    try {
      const gameMasters: GameMaster[] = [];

      for (const file of STATIC_CONTENT.gamemasters) {
        const parsed = this.parseMarkdownContent(file.content, file.filename);
        
        // Transform markdown content to GameMaster
        const gameMaster: GameMaster = {
          id: parsed.frontmatter.id || file.filename.replace('.md', ''),
          name: this.formatGameMasterName(parsed.frontmatter.firstName, parsed.frontmatter.lastInitial),
          organizedPlayId: String(parsed.frontmatter.organizedPlayNumber || ''),
          games: this.parseGames(parsed.frontmatter.games),
          bio: parsed.content.trim(),
          avatar: parsed.frontmatter.avatar
        };

        gameMasters.push(gameMaster);
      }

      // Sort by name
      gameMasters.sort((a, b) => a.name.localeCompare(b.name));

      // Cache the results
      this.contentCache.set(cacheKey, gameMasters);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return gameMasters;
    } catch (error) {
      console.error('Error loading game masters:', error);
      return this.getFallbackGameMasters();
    }
  }

  /**
   * Load news articles from markdown files
   */
  async loadNewsArticles(): Promise<NewsArticle[]> {
    const cacheKey = 'news-articles';
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }

    try {
      const articles: NewsArticle[] = [];

      for (const file of STATIC_CONTENT.news) {
        const parsed = this.parseMarkdownContent(file.content, file.filename);
        
        // Transform markdown content to NewsArticle
        const article: NewsArticle = {
          id: parsed.frontmatter.id || file.filename.replace('.md', ''),
          title: parsed.frontmatter.title || 'Untitled Article',
          date: this.parseDate(parsed.frontmatter.date),
          excerpt: parsed.frontmatter.excerpt || this.extractExcerpt(parsed.content),
          content: parsed.content,
          author: parsed.frontmatter.author
        };

        articles.push(article);
      }

      // Sort by date (newest first)
      articles.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Cache the results
      this.contentCache.set(cacheKey, articles);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return articles;
    } catch (error) {
      console.error('Error loading news articles:', error);
      return this.getFallbackNewsArticles();
    }
  }

  // Helper methods

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private parseDate(dateString: any): Date {
    if (!dateString) return new Date();
    
    // Handle various date formats
    if (typeof dateString === 'string') {
      // Try parsing ISO format first
      const isoDate = new Date(dateString);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
    }
    
    return new Date(dateString);
  }

  private extractDescription(content: string): string {
    // Extract first paragraph or first 200 characters
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const firstParagraph = lines[0] || '';
    return firstParagraph.length > 200 
      ? firstParagraph.substring(0, 200) + '...'
      : firstParagraph;
  }

  private extractExcerpt(content: string): string {
    // Extract first 150 characters of meaningful content
    const cleanContent = content
      .replace(/^#.*$/gm, '') // Remove headers
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .trim();
    
    return cleanContent.length > 150 
      ? cleanContent.substring(0, 150) + '...'
      : cleanContent;
  }

  private determineGameType(title: string, content: string): 'Pathfinder' | 'Starfinder' | 'Legacy' {
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('starfinder')) return 'Starfinder';
    if (text.includes('pathfinder')) return 'Pathfinder';
    return 'Legacy';
  }

  private formatGameMasterName(firstName?: string, lastInitial?: string): string {
    if (firstName && lastInitial) {
      return `${firstName} ${lastInitial}.`;
    }
    return firstName || 'Unknown GM';
  }

  private parseGames(games: any): ('Pathfinder' | 'Starfinder' | 'Legacy')[] {
    if (!games) return [];
    if (Array.isArray(games)) {
      return games.filter(game => 
        ['Pathfinder', 'Starfinder', 'Legacy'].includes(game)
      );
    }
    return [];
  }

  // Fallback data methods for error handling

  private getFallbackCalendarEvents(): CalendarEvent[] {
    return [
      {
        id: 'fallback-event',
        title: 'Gaming Event',
        date: new Date(),
        description: 'Check back later for event details.',
        content: 'Event information will be available soon.',
        gameType: 'Pathfinder'
      }
    ];
  }

  private getFallbackGameMasters(): GameMaster[] {
    return [
      {
        id: 'fallback-gm',
        name: 'Game Master',
        organizedPlayId: '00000',
        games: ['Pathfinder'],
        bio: 'Game Master information will be available soon.'
      }
    ];
  }

  private getFallbackNewsArticles(): NewsArticle[] {
    return [
      {
        id: 'fallback-news',
        title: 'Welcome to Shifting Corridors Lodge',
        date: new Date(),
        excerpt: 'Stay tuned for news and updates.',
        content: 'News and updates will be posted here.'
      }
    ];
  }

  /**
   * Clear the content cache
   */
  clearCache(): void {
    this.contentCache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const contentLoader = new ContentLoaderService();
export default contentLoader;