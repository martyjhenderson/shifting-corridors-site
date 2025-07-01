import matter from 'gray-matter';
import { 
  CalendarEvent, 
  GameMaster, 
  NewsArticle, 
  MarkdownContent, 
  ContentLoader,
  ContentError
} from '../types';
import { 
  validateEventFrontmatter,
  validateGameMasterFrontmatter,
  validateNewsFrontmatter,
  validateCalendarEvent,
  validateGameMaster,
  validateNewsArticle,
  sanitizeContent,
  extractExcerpt,
  parseDate
} from '../utils/validation';
import { 
  getFallbackEvents,
  getFallbackGameMasters,
  getFallbackNews,
  mergeWithFallback
} from '../utils/fallbackContent';
import { contentCache, markdownCache } from '../utils/performance';

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
 * with comprehensive error handling and fallback mechanisms
 */
class ContentLoaderService implements ContentLoader {
  private errorCache: Map<string, ContentError> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Parse a markdown file content with comprehensive error handling
   */
  async parseMarkdownFile(filePath: string): Promise<MarkdownContent> {
    try {
      // For static builds, we don't actually fetch files by path
      // This method is kept for interface compatibility
      const { data, content } = matter('');
      
      // Validate and sanitize content
      const sanitizedContent = sanitizeContent(content || '');
      
      return {
        frontmatter: data || {},
        content: sanitizedContent
      };
    } catch (error) {
      const contentError: ContentError = {
        type: 'parsing',
        message: `Failed to parse markdown file: ${filePath}`,
        details: error,
        timestamp: new Date(),
        retryable: false
      };
      
      this.logError('parseMarkdownFile', contentError);
      
      return {
        frontmatter: {},
        content: ''
      };
    }
  }

  /**
   * Parse markdown content string with validation and error handling
   */
  private parseMarkdownContent(markdownContent: string, fileName: string): MarkdownContent {
    try {
      if (!markdownContent || typeof markdownContent !== 'string') {
        throw new Error('Invalid markdown content');
      }

      const parsed = matter(markdownContent);
      if (!parsed) {
        throw new Error('Failed to parse markdown');
      }
      
      // Sanitize content
      const sanitizedContent = sanitizeContent(parsed.content || '');
      
      return {
        frontmatter: parsed.data,
        content: sanitizedContent
      };
    } catch (error) {
      const contentError: ContentError = {
        type: 'parsing',
        message: `Failed to parse markdown content for ${fileName}`,
        details: error,
        timestamp: new Date(),
        retryable: false
      };
      
      this.logError('parseMarkdownContent', contentError);
      
      // Return minimal valid structure
      return {
        frontmatter: { 
          title: 'Content Loading Error',
          date: new Date().toISOString()
        },
        content: 'Content could not be loaded. Please try again later.'
      };
    }
  }

  /**
   * Load calendar events from markdown files with comprehensive error handling
   */
  async loadCalendarEvents(): Promise<CalendarEvent[]> {
    const cacheKey = 'calendar-events';
    
    // Check cache first
    const cached = contentCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const events: CalendarEvent[] = [];
      const errors: ContentError[] = [];

      for (const file of STATIC_CONTENT.calendar) {
        try {
          const parsed = this.parseMarkdownContent(file.content, file.filename);
          
          // Validate frontmatter
          const { result: validationResult, validated } = validateEventFrontmatter(parsed.frontmatter);
          
          if (!validationResult.isValid) {
            errors.push({
              type: 'validation',
              message: `Event validation failed for ${file.filename}: ${validationResult.errors.join(', ')}`,
              details: { errors: validationResult.errors, warnings: validationResult.warnings },
              timestamp: new Date(),
              retryable: false
            });
          }

          // Log warnings
          if (validationResult.warnings.length > 0) {
            console.warn(`Event warnings for ${file.filename}:`, validationResult.warnings);
          }
          
          // Transform markdown content to CalendarEvent with validated data
          const event: CalendarEvent = {
            id: file.filename.replace('.md', ''),
            title: validated.title || 'Untitled Event',
            date: validated.date instanceof Date ? validated.date : parseDate(validated.date),
            description: this.extractDescription(parsed.content),
            content: parsed.content,
            gamemaster: validated.gamemaster,
            gameType: validated.gameType || this.determineGameType(validated.title || '', parsed.content) || 'Pathfinder',
            maxPlayers: validated.maxPlayers
          };

          // Final validation of the complete event object
          const eventValidation = validateCalendarEvent(event);
          if (eventValidation.isValid) {
            events.push(event);
          } else {
            errors.push({
              type: 'validation',
              message: `Complete event validation failed for ${file.filename}`,
              details: eventValidation,
              timestamp: new Date(),
              retryable: false
            });
          }

        } catch (fileError) {
          errors.push({
            type: 'parsing',
            message: `Failed to process event file ${file.filename}`,
            details: fileError,
            timestamp: new Date(),
            retryable: true
          });
        }
      }

      // Log errors but don't fail completely
      if (errors.length > 0) {
        errors.forEach(error => this.logError('loadCalendarEvents', error));
      }

      // Sort events by date
      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      // If we have some events, use them; otherwise use fallback
      const finalEvents = events.length > 0 
        ? mergeWithFallback(events, getFallbackEvents())
        : getFallbackEvents();

      // Cache the results
      contentCache.set(cacheKey, finalEvents, this.CACHE_DURATION);

      return finalEvents;
    } catch (error) {
      const contentError: ContentError = {
        type: 'unknown',
        message: 'Critical error loading calendar events',
        details: error,
        timestamp: new Date(),
        retryable: true
      };
      
      this.logError('loadCalendarEvents', contentError);
      return getFallbackEvents();
    }
  }

  /**
   * Load game masters from markdown files with comprehensive error handling
   */
  async loadGameMasters(): Promise<GameMaster[]> {
    const cacheKey = 'game-masters';
    
    // Check cache first
    const cached = contentCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const gameMasters: GameMaster[] = [];
      const errors: ContentError[] = [];

      for (const file of STATIC_CONTENT.gamemasters) {
        try {
          const parsed = this.parseMarkdownContent(file.content, file.filename);
          
          // Validate frontmatter
          const { result: validationResult, validated } = validateGameMasterFrontmatter(parsed.frontmatter);
          
          if (!validationResult.isValid) {
            errors.push({
              type: 'validation',
              message: `Game master validation failed for ${file.filename}: ${validationResult.errors.join(', ')}`,
              details: { errors: validationResult.errors, warnings: validationResult.warnings },
              timestamp: new Date(),
              retryable: false
            });
          }

          // Log warnings
          if (validationResult.warnings.length > 0) {
            console.warn(`Game master warnings for ${file.filename}:`, validationResult.warnings);
          }
          
          // Transform markdown content to GameMaster with validated data
          const gameMaster: GameMaster = {
            id: file.filename.replace('.md', ''),
            name: this.formatGameMasterName(validated.firstName, validated.lastInitial),
            organizedPlayId: String(validated.organizedPlayNumber || '00000'),
            games: (validated.games || ['Pathfinder']) as ('Pathfinder' | 'Starfinder' | 'Legacy')[],
            bio: sanitizeContent(parsed.content.trim()),
            avatar: validated.avatar
          };

          // Final validation of the complete game master object
          const gmValidation = validateGameMaster(gameMaster);
          if (gmValidation.isValid) {
            gameMasters.push(gameMaster);
          } else {
            errors.push({
              type: 'validation',
              message: `Complete game master validation failed for ${file.filename}`,
              details: gmValidation,
              timestamp: new Date(),
              retryable: false
            });
          }

        } catch (fileError) {
          errors.push({
            type: 'parsing',
            message: `Failed to process game master file ${file.filename}`,
            details: fileError,
            timestamp: new Date(),
            retryable: true
          });
        }
      }

      // Log errors but don't fail completely
      if (errors.length > 0) {
        errors.forEach(error => this.logError('loadGameMasters', error));
      }

      // Sort by name
      gameMasters.sort((a, b) => a.name.localeCompare(b.name));

      // If we have some game masters, use them; otherwise use fallback
      const finalGameMasters = gameMasters.length > 0 
        ? mergeWithFallback(gameMasters, getFallbackGameMasters())
        : getFallbackGameMasters();

      // Cache the results
      contentCache.set(cacheKey, finalGameMasters, this.CACHE_DURATION);

      return finalGameMasters;
    } catch (error) {
      const contentError: ContentError = {
        type: 'unknown',
        message: 'Critical error loading game masters',
        details: error,
        timestamp: new Date(),
        retryable: true
      };
      
      this.logError('loadGameMasters', contentError);
      return getFallbackGameMasters();
    }
  }

  /**
   * Load news articles from markdown files with comprehensive error handling
   */
  async loadNewsArticles(): Promise<NewsArticle[]> {
    const cacheKey = 'news-articles';
    
    // Check cache first
    const cached = contentCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const articles: NewsArticle[] = [];
      const errors: ContentError[] = [];

      for (const file of STATIC_CONTENT.news) {
        try {
          const parsed = this.parseMarkdownContent(file.content, file.filename);
          
          // Validate frontmatter
          const { result: validationResult, validated } = validateNewsFrontmatter(parsed.frontmatter);
          
          if (!validationResult.isValid) {
            errors.push({
              type: 'validation',
              message: `News article validation failed for ${file.filename}: ${validationResult.errors.join(', ')}`,
              details: { errors: validationResult.errors, warnings: validationResult.warnings },
              timestamp: new Date(),
              retryable: false
            });
          }

          // Log warnings
          if (validationResult.warnings.length > 0) {
            console.warn(`News article warnings for ${file.filename}:`, validationResult.warnings);
          }
          
          // Transform markdown content to NewsArticle with validated data
          const article: NewsArticle = {
            id: (validated as any).id || file.filename.replace('.md', ''),
            title: validated.title || 'Untitled Article',
            date: validated.date instanceof Date ? validated.date : parseDate(validated.date),
            excerpt: validated.excerpt || extractExcerpt(parsed.content),
            content: sanitizeContent(parsed.content),
            author: validated.author
          };

          // Final validation of the complete article object
          const articleValidation = validateNewsArticle(article);
          if (articleValidation.isValid) {
            articles.push(article);
          } else {
            errors.push({
              type: 'validation',
              message: `Complete news article validation failed for ${file.filename}`,
              details: articleValidation,
              timestamp: new Date(),
              retryable: false
            });
          }

        } catch (fileError) {
          errors.push({
            type: 'parsing',
            message: `Failed to process news file ${file.filename}`,
            details: fileError,
            timestamp: new Date(),
            retryable: true
          });
        }
      }

      // Log errors but don't fail completely
      if (errors.length > 0) {
        errors.forEach(error => this.logError('loadNewsArticles', error));
      }

      // Sort by date (newest first)
      articles.sort((a, b) => b.date.getTime() - a.date.getTime());

      // If we have some articles, use them; otherwise use fallback
      const finalArticles = articles.length > 0 
        ? mergeWithFallback(articles, getFallbackNews())
        : getFallbackNews();

      // Cache the results
      contentCache.set(cacheKey, finalArticles, this.CACHE_DURATION);

      return finalArticles;
    } catch (error) {
      const contentError: ContentError = {
        type: 'unknown',
        message: 'Critical error loading news articles',
        details: error,
        timestamp: new Date(),
        retryable: true
      };
      
      this.logError('loadNewsArticles', contentError);
      return getFallbackNews();
    }
  }

  // Helper methods

  private extractDescription(content: string): string {
    return extractExcerpt(content, 200);
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



  // Error handling and logging methods

  private logError(context: string, error: ContentError): void {
    console.error(`[ContentLoader:${context}] ${error.type.toUpperCase()}: ${error.message}`, {
      details: error.details,
      timestamp: error.timestamp,
      retryable: error.retryable
    });
    
    // Store error for potential retry logic
    this.errorCache.set(`${context}-${error.timestamp.getTime()}`, error);
    
    // Clean up old errors (keep only last 10)
    if (this.errorCache.size > 10) {
      const oldestKey = Array.from(this.errorCache.keys())[0];
      this.errorCache.delete(oldestKey);
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(): ContentError[] {
    return Array.from(this.errorCache.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }



  /**
   * Clear the content cache
   */
  clearCache(): void {
    contentCache.clear();
  }

  /**
   * Clear error cache
   */
  clearErrors(): void {
    this.errorCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    contentCacheSize: number;
    errorCacheSize: number;
    cachedKeys: string[];
  } {
    return {
      contentCacheSize: contentCache.size(),
      errorCacheSize: this.errorCache.size,
      cachedKeys: []
    };
  }
}

// Export singleton instance
export const contentLoader = new ContentLoaderService();
export default contentLoader;