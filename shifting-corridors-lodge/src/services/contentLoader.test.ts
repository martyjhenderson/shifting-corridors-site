import { contentLoader } from './contentLoader';
import { CalendarEvent, GameMaster, NewsArticle } from '../types';

// Don't mock gray-matter - let it work normally since we have static content

describe('ContentLoader', () => {
  beforeEach(() => {
    // Clear cache before each test
    contentLoader.clearCache();
  });

  describe('loadCalendarEvents', () => {
    it('should load and parse calendar events correctly', async () => {
      const events = await contentLoader.loadCalendarEvents();
      
      expect(events).toHaveLength(5);
      expect(events[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        date: expect.any(Date),
        description: expect.any(String),
        content: expect.any(String),
        gameType: expect.stringMatching(/^(Pathfinder|Starfinder|Legacy)$/)
      });
    });

    it('should sort events by date', async () => {
      const events = await contentLoader.loadCalendarEvents();
      
      for (let i = 1; i < events.length; i++) {
        expect(events[i].date.getTime()).toBeGreaterThanOrEqual(events[i - 1].date.getTime());
      }
    });

    it('should determine game type correctly', async () => {
      const events = await contentLoader.loadCalendarEvents();
      
      const pathfinderEvent = events.find(e => e.title.includes('Pathfinder'));
      const starfinderEvent = events.find(e => e.title.includes('Starfinder'));
      
      expect(pathfinderEvent?.gameType).toBe('Pathfinder');
      expect(starfinderEvent?.gameType).toBe('Starfinder');
    });

    it('should extract descriptions from content', async () => {
      const events = await contentLoader.loadCalendarEvents();
      
      events.forEach(event => {
        expect(event.description).toBeTruthy();
        expect(event.description.length).toBeGreaterThan(0);
        expect(event.description.length).toBeLessThanOrEqual(203); // 200 + "..."
      });
    });

    it('should cache results', async () => {
      const events1 = await contentLoader.loadCalendarEvents();
      const events2 = await contentLoader.loadCalendarEvents();
      
      expect(events1).toBe(events2); // Should be the same reference due to caching
    });
  });

  describe('loadGameMasters', () => {
    it('should load and parse game masters correctly', async () => {
      const gameMasters = await contentLoader.loadGameMasters();
      
      expect(gameMasters).toHaveLength(2);
      expect(gameMasters[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        organizedPlayId: expect.any(String),
        games: expect.any(Array),
        bio: expect.any(String)
      });
    });

    it('should format game master names correctly', async () => {
      const gameMasters = await contentLoader.loadGameMasters();
      
      const marty = gameMasters.find(gm => gm.name.includes('Marty'));
      const josh = gameMasters.find(gm => gm.name.includes('Josh'));
      
      expect(marty?.name).toBe('Marty H.');
      expect(josh?.name).toBe('Josh G.');
    });

    it('should parse games arrays correctly', async () => {
      const gameMasters = await contentLoader.loadGameMasters();
      
      const marty = gameMasters.find(gm => gm.name.includes('Marty'));
      const josh = gameMasters.find(gm => gm.name.includes('Josh'));
      
      expect(marty?.games).toContain('Pathfinder');
      expect(marty?.games).toContain('Starfinder');
      expect(josh?.games).toContain('Pathfinder');
    });

    it('should sort game masters by name', async () => {
      const gameMasters = await contentLoader.loadGameMasters();
      
      for (let i = 1; i < gameMasters.length; i++) {
        expect(gameMasters[i].name.localeCompare(gameMasters[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should cache results', async () => {
      const gms1 = await contentLoader.loadGameMasters();
      const gms2 = await contentLoader.loadGameMasters();
      
      expect(gms1).toBe(gms2); // Should be the same reference due to caching
    });
  });

  describe('loadNewsArticles', () => {
    it('should load and parse news articles correctly', async () => {
      const articles = await contentLoader.loadNewsArticles();
      
      expect(articles).toHaveLength(1);
      expect(articles[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        date: expect.any(Date),
        excerpt: expect.any(String),
        content: expect.any(String)
      });
    });

    it('should extract excerpts from content', async () => {
      const articles = await contentLoader.loadNewsArticles();
      
      articles.forEach(article => {
        expect(article.excerpt).toBeTruthy();
        expect(article.excerpt.length).toBeGreaterThan(0);
        expect(article.excerpt.length).toBeLessThanOrEqual(153); // 150 + "..."
      });
    });

    it('should sort articles by date (newest first)', async () => {
      const articles = await contentLoader.loadNewsArticles();
      
      for (let i = 1; i < articles.length; i++) {
        expect(articles[i].date.getTime()).toBeLessThanOrEqual(articles[i - 1].date.getTime());
      }
    });

    it('should cache results', async () => {
      const articles1 = await contentLoader.loadNewsArticles();
      const articles2 = await contentLoader.loadNewsArticles();
      
      expect(articles1).toBe(articles2); // Should be the same reference due to caching
    });
  });

  describe('parseMarkdownFile', () => {
    it('should handle empty content gracefully', async () => {
      const result = await contentLoader.parseMarkdownFile('nonexistent.md');
      
      expect(result).toMatchObject({
        frontmatter: {},
        content: ''
      });
    });
  });

  describe('cache management', () => {
    it('should clear cache when requested', async () => {
      // Load content to populate cache
      await contentLoader.loadCalendarEvents();
      await contentLoader.loadGameMasters();
      await contentLoader.loadNewsArticles();
      
      // Clear cache
      contentLoader.clearCache();
      
      // Loading again should not use cached results
      const events1 = await contentLoader.loadCalendarEvents();
      const events2 = await contentLoader.loadCalendarEvents();
      
      // Second call should use cache again
      expect(events2).toBe(events1);
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', async () => {
      // The service should not throw errors even if parsing fails
      const events = await contentLoader.loadCalendarEvents();
      const gameMasters = await contentLoader.loadGameMasters();
      const articles = await contentLoader.loadNewsArticles();
      
      expect(events).toBeInstanceOf(Array);
      expect(gameMasters).toBeInstanceOf(Array);
      expect(articles).toBeInstanceOf(Array);
    });
  });

  describe('date parsing', () => {
    it('should parse various date formats correctly', async () => {
      const events = await contentLoader.loadCalendarEvents();
      
      events.forEach(event => {
        expect(event.date).toBeInstanceOf(Date);
        expect(event.date.getTime()).not.toBeNaN();
      });
    });
  });

  describe('content extraction', () => {
    it('should extract meaningful descriptions', async () => {
      const events = await contentLoader.loadCalendarEvents();
      
      events.forEach(event => {
        expect(event.description).not.toMatch(/^#/); // Should not start with markdown headers
        expect(event.description.trim()).toBeTruthy();
      });
    });

    it('should extract meaningful excerpts', async () => {
      const articles = await contentLoader.loadNewsArticles();
      
      articles.forEach(article => {
        expect(article.excerpt).not.toMatch(/^#/); // Should not start with markdown headers
        expect(article.excerpt.trim()).toBeTruthy();
      });
    });
  });
});