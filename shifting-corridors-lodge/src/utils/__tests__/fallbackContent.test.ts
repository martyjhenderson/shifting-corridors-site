import {
  getFallbackContent,
  getFallbackEvents,
  getFallbackGameMasters,
  getFallbackNews,
  isFallbackContent,
  mergeWithFallback,
  getErrorFallbackContent,
  FALLBACK_EVENTS,
  FALLBACK_GAMEMASTERS,
  FALLBACK_NEWS
} from '../fallbackContent';
import { CalendarEvent, GameMaster, NewsArticle } from '../../types';

describe('Fallback Content', () => {
  describe('Basic Fallback Content', () => {
    it('should provide fallback events', () => {
      const events = getFallbackEvents();
      
      expect(events).toHaveLength(2);
      expect(events[0]).toHaveProperty('id');
      expect(events[0]).toHaveProperty('title');
      expect(events[0]).toHaveProperty('date');
      expect(events[0]).toHaveProperty('description');
      expect(events[0]).toHaveProperty('content');
      expect(events[0]).toHaveProperty('gameType');
      
      // Check that IDs are fallback IDs
      events.forEach(event => {
        expect(event.id).toMatch(/^fallback-/);
      });
    });

    it('should provide fallback game masters', () => {
      const gameMasters = getFallbackGameMasters();
      
      expect(gameMasters).toHaveLength(1);
      expect(gameMasters[0]).toHaveProperty('id');
      expect(gameMasters[0]).toHaveProperty('name');
      expect(gameMasters[0]).toHaveProperty('organizedPlayId');
      expect(gameMasters[0]).toHaveProperty('games');
      expect(gameMasters[0]).toHaveProperty('bio');
      
      expect(gameMasters[0].id).toMatch(/^fallback-/);
      expect(gameMasters[0].games).toContain('Pathfinder');
    });

    it('should provide fallback news', () => {
      const news = getFallbackNews();
      
      expect(news).toHaveLength(1);
      expect(news[0]).toHaveProperty('id');
      expect(news[0]).toHaveProperty('title');
      expect(news[0]).toHaveProperty('date');
      expect(news[0]).toHaveProperty('excerpt');
      expect(news[0]).toHaveProperty('content');
      
      expect(news[0].id).toMatch(/^fallback-/);
      expect(news[0].title).toContain('Welcome');
    });

    it('should provide complete fallback content', () => {
      const fallback = getFallbackContent();
      
      expect(fallback).toHaveProperty('events');
      expect(fallback).toHaveProperty('gamemasters');
      expect(fallback).toHaveProperty('news');
      
      expect(fallback.events).toHaveLength(2);
      expect(fallback.gamemasters).toHaveLength(1);
      expect(fallback.news).toHaveLength(1);
    });
  });

  describe('Fallback Content Structure', () => {
    it('should have valid event structure', () => {
      FALLBACK_EVENTS.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.title).toBeDefined();
        expect(event.date).toBeInstanceOf(Date);
        expect(event.description).toBeDefined();
        expect(event.content).toBeDefined();
        expect(event.gameType).toMatch(/^(Pathfinder|Starfinder|Legacy)$/);
        
        if (event.maxPlayers) {
          expect(typeof event.maxPlayers).toBe('number');
          expect(event.maxPlayers).toBeGreaterThan(0);
        }
      });
    });

    it('should have valid game master structure', () => {
      FALLBACK_GAMEMASTERS.forEach(gm => {
        expect(gm.id).toBeDefined();
        expect(gm.name).toBeDefined();
        expect(gm.organizedPlayId).toBeDefined();
        expect(Array.isArray(gm.games)).toBe(true);
        expect(gm.games.length).toBeGreaterThan(0);
        expect(gm.bio).toBeDefined();
        
        gm.games.forEach(game => {
          expect(game).toMatch(/^(Pathfinder|Starfinder|Legacy)$/);
        });
      });
    });

    it('should have valid news structure', () => {
      FALLBACK_NEWS.forEach(article => {
        expect(article.id).toBeDefined();
        expect(article.title).toBeDefined();
        expect(article.date).toBeInstanceOf(Date);
        expect(article.excerpt).toBeDefined();
        expect(article.content).toBeDefined();
        
        if (article.author) {
          expect(typeof article.author).toBe('string');
        }
      });
    });
  });

  describe('Fallback Content Detection', () => {
    it('should identify fallback content correctly', () => {
      const fallbackEvents = getFallbackEvents();
      const fallbackGMs = getFallbackGameMasters();
      const fallbackNews = getFallbackNews();
      
      expect(isFallbackContent(fallbackEvents)).toBe(true);
      expect(isFallbackContent(fallbackGMs)).toBe(true);
      expect(isFallbackContent(fallbackNews)).toBe(true);
    });

    it('should not identify real content as fallback', () => {
      const realEvents: CalendarEvent[] = [
        {
          id: 'real-event-1',
          title: 'Real Event',
          date: new Date(),
          description: 'Real description',
          content: 'Real content',
          gameType: 'Pathfinder'
        }
      ];
      
      const realGMs: GameMaster[] = [
        {
          id: 'real-gm-1',
          name: 'Real GM',
          organizedPlayId: '12345',
          games: ['Pathfinder'],
          bio: 'Real bio'
        }
      ];
      
      const realNews: NewsArticle[] = [
        {
          id: 'real-news-1',
          title: 'Real News',
          date: new Date(),
          excerpt: 'Real excerpt',
          content: 'Real content'
        }
      ];
      
      expect(isFallbackContent(realEvents)).toBe(false);
      expect(isFallbackContent(realGMs)).toBe(false);
      expect(isFallbackContent(realNews)).toBe(false);
    });

    it('should handle empty arrays', () => {
      expect(isFallbackContent([])).toBe(false);
    });

    it('should handle mixed content', () => {
      const mixedContent = [
        { id: 'real-item' },
        { id: 'fallback-item' }
      ];
      
      expect(isFallbackContent(mixedContent)).toBe(true);
    });
  });

  describe('Content Merging', () => {
    it('should use real content when sufficient', () => {
      const realEvents: CalendarEvent[] = [
        {
          id: 'real-1',
          title: 'Real Event 1',
          date: new Date(),
          description: 'Description 1',
          content: 'Content 1',
          gameType: 'Pathfinder'
        },
        {
          id: 'real-2',
          title: 'Real Event 2',
          date: new Date(),
          description: 'Description 2',
          content: 'Content 2',
          gameType: 'Starfinder'
        }
      ];
      
      const fallbackEvents = getFallbackEvents();
      const merged = mergeWithFallback(realEvents, fallbackEvents);
      
      expect(merged).toEqual(realEvents);
    });

    it('should merge when real content is insufficient', () => {
      const realEvents: CalendarEvent[] = [
        {
          id: 'real-1',
          title: 'Real Event 1',
          date: new Date(),
          description: 'Description 1',
          content: 'Content 1',
          gameType: 'Pathfinder'
        }
      ];
      
      const fallbackEvents = getFallbackEvents();
      const merged = mergeWithFallback(realEvents, fallbackEvents);
      
      expect(merged.length).toBeGreaterThan(realEvents.length);
      expect(merged[0]).toEqual(realEvents[0]);
      expect(merged.slice(1)).toEqual(fallbackEvents);
    });

    it('should return fallback when no real content', () => {
      const fallbackEvents = getFallbackEvents();
      const merged = mergeWithFallback([], fallbackEvents);
      
      expect(merged).toEqual(fallbackEvents);
    });

    it('should avoid duplicate IDs when merging', () => {
      const realEvents: CalendarEvent[] = [
        {
          id: 'fallback-pathfinder-event', // Same ID as fallback
          title: 'Real Event',
          date: new Date(),
          description: 'Real description',
          content: 'Real content',
          gameType: 'Pathfinder'
        }
      ];
      
      const fallbackEvents = getFallbackEvents();
      const merged = mergeWithFallback(realEvents, fallbackEvents);
      
      // Should not have duplicates
      const ids = merged.map(event => event.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
      
      // Real content should take precedence
      const duplicateEvent = merged.find(event => event.id === 'fallback-pathfinder-event');
      expect(duplicateEvent?.title).toBe('Real Event');
    });
  });

  describe('Error-Specific Fallback Content', () => {
    it('should provide network error fallback', () => {
      const errorFallback = getErrorFallbackContent('network');
      
      expect(errorFallback.news[0].title).toBe('Connection Issue');
      expect(errorFallback.news[0].content).toContain('unable to load the latest content');
      expect(errorFallback.news[0].content).toContain('Check your internet connection');
    });

    it('should provide parsing error fallback', () => {
      const errorFallback = getErrorFallbackContent('parsing');
      
      expect(errorFallback.news[0].title).toBe('Content Loading Issue');
      expect(errorFallback.news[0].content).toContain('issue while processing');
      expect(errorFallback.news[0].content).toContain('Some details may be missing');
    });

    it('should provide default fallback for unknown errors', () => {
      const errorFallback = getErrorFallbackContent('unknown');
      const defaultFallback = getFallbackContent();
      
      expect(errorFallback).toEqual(defaultFallback);
    });

    it('should include base content with error-specific content', () => {
      const networkFallback = getErrorFallbackContent('network');
      
      // Should have error-specific news plus base content
      expect(networkFallback.news.length).toBeGreaterThan(1);
      expect(networkFallback.events).toEqual(getFallbackEvents());
      expect(networkFallback.gamemasters).toEqual(getFallbackGameMasters());
    });
  });

  describe('Content Quality', () => {
    it('should have meaningful fallback event content', () => {
      const events = getFallbackEvents();
      
      events.forEach(event => {
        expect(event.title.length).toBeGreaterThan(5);
        expect(event.description.length).toBeGreaterThan(10);
        expect(event.content.length).toBeGreaterThan(50);
        expect(event.content).toContain('##'); // Should have markdown headers
      });
    });

    it('should have meaningful fallback GM content', () => {
      const gms = getFallbackGameMasters();
      
      gms.forEach(gm => {
        expect(gm.name.length).toBeGreaterThan(3);
        expect(gm.bio.length).toBeGreaterThan(20);
        expect(gm.organizedPlayId).toMatch(/^\d+$/);
      });
    });

    it('should have meaningful fallback news content', () => {
      const news = getFallbackNews();
      
      news.forEach(article => {
        expect(article.title.length).toBeGreaterThan(5);
        expect(article.excerpt.length).toBeGreaterThan(10);
        expect(article.content.length).toBeGreaterThan(50);
        expect(article.content).toContain('#'); // Should have markdown headers
      });
    });
  });

  describe('Date Handling', () => {
    it('should have reasonable dates for fallback events', () => {
      const events = getFallbackEvents();
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      events.forEach(event => {
        expect(event.date.getTime()).toBeGreaterThan(now.getTime());
        expect(event.date.getTime()).toBeLessThan(oneMonthFromNow.getTime());
      });
    });

    it('should have current or recent dates for fallback news', () => {
      const news = getFallbackNews();
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      news.forEach(article => {
        expect(article.date.getTime()).toBeGreaterThan(oneWeekAgo.getTime());
        expect(article.date.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  describe('Game Type Distribution', () => {
    it('should include multiple game types in fallback events', () => {
      const events = getFallbackEvents();
      const gameTypes = events.map(event => event.gameType);
      
      expect(gameTypes).toContain('Pathfinder');
      expect(gameTypes).toContain('Starfinder');
    });

    it('should include multiple game types in fallback GMs', () => {
      const gms = getFallbackGameMasters();
      const allGames = gms.flatMap(gm => gm.games);
      
      expect(allGames).toContain('Pathfinder');
      expect(allGames).toContain('Starfinder');
    });
  });
});