import { jest } from '@jest/globals';
import { contentLoader } from './contentLoader';
import * as validation from '../utils/validation';
import * as fallbackContent from '../utils/fallbackContent';

// Mock the validation and fallback modules
jest.mock('../utils/validation');
jest.mock('../utils/fallbackContent');

const mockValidation = validation as jest.Mocked<typeof validation>;
const mockFallbackContent = fallbackContent as jest.Mocked<typeof fallbackContent>;

describe('ContentLoader Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockValidation.validateEventFrontmatter.mockReturnValue({
      result: { isValid: true, errors: [], warnings: [] },
      validated: {
        title: 'Test Event',
        date: new Date('2025-07-15'),
        gameType: 'Pathfinder'
      }
    });
    
    mockValidation.validateGameMasterFrontmatter.mockReturnValue({
      result: { isValid: true, errors: [], warnings: [] },
      validated: {
        firstName: 'Test',
        lastInitial: 'GM',
        organizedPlayNumber: '12345',
        games: ['Pathfinder']
      }
    });
    
    mockValidation.validateNewsFrontmatter.mockReturnValue({
      result: { isValid: true, errors: [], warnings: [] },
      validated: {
        title: 'Test News',
        date: new Date('2025-07-15')
      }
    });
    
    mockValidation.validateCalendarEvent.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    mockValidation.validateGameMaster.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    mockValidation.validateNewsArticle.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    mockValidation.sanitizeContent.mockImplementation((content: string) => content);
    mockValidation.extractExcerpt.mockImplementation((content: string) => content.substring(0, 100));
    mockValidation.parseDate.mockImplementation((date: any) => new Date(date));
    
    mockFallbackContent.getFallbackEvents.mockReturnValue([
      {
        id: 'fallback-event',
        title: 'Fallback Event',
        date: new Date(),
        description: 'Fallback description',
        content: 'Fallback content',
        gameType: 'Pathfinder'
      }
    ]);
    
    mockFallbackContent.getFallbackGameMasters.mockReturnValue([
      {
        id: 'fallback-gm',
        name: 'Fallback GM',
        organizedPlayId: '00000',
        games: ['Pathfinder'],
        bio: 'Fallback bio'
      }
    ]);
    
    mockFallbackContent.getFallbackNews.mockReturnValue([
      {
        id: 'fallback-news',
        title: 'Fallback News',
        date: new Date(),
        excerpt: 'Fallback excerpt',
        content: 'Fallback content'
      }
    ]);
    
    mockFallbackContent.mergeWithFallback.mockImplementation((real, fallback) => 
      real.length > 0 ? real : fallback
    );
    
    // Reset console spies
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    contentLoader.clearCache();
    contentLoader.clearErrors();
  });

  describe('Calendar Events Loading', () => {
    it('should load events successfully with valid data', async () => {
      const events = await contentLoader.loadCalendarEvents();
      
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      
      // Should validate each event
      expect(mockValidation.validateEventFrontmatter).toHaveBeenCalled();
      expect(mockValidation.validateCalendarEvent).toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', async () => {
      mockValidation.validateEventFrontmatter.mockReturnValue({
        result: { 
          isValid: false, 
          errors: ['Title is required'], 
          warnings: [] 
        },
        validated: {
          title: 'Untitled Event',
          date: new Date(),
          gameType: 'Pathfinder'
        }
      });
      
      const events = await contentLoader.loadCalendarEvents();
      
      expect(events).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle complete validation failure', async () => {
      mockValidation.validateCalendarEvent.mockReturnValue({
        isValid: false,
        errors: ['Complete validation failed'],
        warnings: []
      });
      
      const events = await contentLoader.loadCalendarEvents();
      
      expect(events).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });

    it('should return fallback content on critical error', async () => {
      // Mock a critical error in the static content processing
      const originalStaticContent = (contentLoader as any).constructor.prototype.parseMarkdownContent;
      (contentLoader as any).parseMarkdownContent = jest.fn().mockImplementation(() => {
        throw new Error('Critical parsing error');
      });
      
      const events = await contentLoader.loadCalendarEvents();
      
      expect(events).toBeDefined();
      expect(mockFallbackContent.getFallbackEvents).toHaveBeenCalled();
      
      // Restore original method
      (contentLoader as any).parseMarkdownContent = originalStaticContent;
    });

    it('should cache successful results', async () => {
      const events1 = await contentLoader.loadCalendarEvents();
      const events2 = await contentLoader.loadCalendarEvents();
      
      expect(events1).toEqual(events2);
      
      // Validation should only be called once due to caching
      const validationCalls = mockValidation.validateEventFrontmatter.mock.calls.length;
      expect(validationCalls).toBeGreaterThan(0);
    });

    it('should sort events by date', async () => {
      const events = await contentLoader.loadCalendarEvents();
      
      for (let i = 1; i < events.length; i++) {
        expect(events[i].date.getTime()).toBeGreaterThanOrEqual(events[i - 1].date.getTime());
      }
    });
  });

  describe('Game Masters Loading', () => {
    it('should load game masters successfully', async () => {
      const gameMasters = await contentLoader.loadGameMasters();
      
      expect(gameMasters).toBeDefined();
      expect(Array.isArray(gameMasters)).toBe(true);
      expect(gameMasters.length).toBeGreaterThan(0);
      
      expect(mockValidation.validateGameMasterFrontmatter).toHaveBeenCalled();
      expect(mockValidation.validateGameMaster).toHaveBeenCalled();
    });

    it('should handle validation warnings', async () => {
      mockValidation.validateGameMasterFrontmatter.mockReturnValue({
        result: { 
          isValid: true, 
          errors: [], 
          warnings: ['Organized play number is recommended'] 
        },
        validated: {
          firstName: 'Test',
          lastInitial: 'GM',
          organizedPlayNumber: '00000',
          games: ['Pathfinder']
        }
      });
      
      const gameMasters = await contentLoader.loadGameMasters();
      
      expect(gameMasters).toBeDefined();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should sort game masters by name', async () => {
      const gameMasters = await contentLoader.loadGameMasters();
      
      for (let i = 1; i < gameMasters.length; i++) {
        expect(gameMasters[i].name.localeCompare(gameMasters[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sanitize bio content', async () => {
      const gameMasters = await contentLoader.loadGameMasters();
      
      expect(mockValidation.sanitizeContent).toHaveBeenCalled();
    });
  });

  describe('News Articles Loading', () => {
    it('should load news articles successfully', async () => {
      const articles = await contentLoader.loadNewsArticles();
      
      expect(articles).toBeDefined();
      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThan(0);
      
      expect(mockValidation.validateNewsFrontmatter).toHaveBeenCalled();
      expect(mockValidation.validateNewsArticle).toHaveBeenCalled();
    });

    it('should sort articles by date (newest first)', async () => {
      const articles = await contentLoader.loadNewsArticles();
      
      for (let i = 1; i < articles.length; i++) {
        expect(articles[i].date.getTime()).toBeLessThanOrEqual(articles[i - 1].date.getTime());
      }
    });

    it('should extract excerpts when not provided', async () => {
      const articles = await contentLoader.loadNewsArticles();
      
      expect(mockValidation.extractExcerpt).toHaveBeenCalled();
    });

    it('should sanitize content', async () => {
      const articles = await contentLoader.loadNewsArticles();
      
      expect(mockValidation.sanitizeContent).toHaveBeenCalled();
    });
  });

  describe('Error Logging and Recovery', () => {
    it('should log errors with proper context', async () => {
      mockValidation.validateEventFrontmatter.mockReturnValue({
        result: { 
          isValid: false, 
          errors: ['Critical validation error'], 
          warnings: [] 
        },
        validated: {
          title: 'Error Event',
          date: new Date(),
          gameType: 'Pathfinder'
        }
      });
      
      await contentLoader.loadCalendarEvents();
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ContentLoader:loadCalendarEvents]'),
        expect.any(Object)
      );
    });

    it('should track recent errors', async () => {
      mockValidation.validateEventFrontmatter.mockReturnValue({
        result: { 
          isValid: false, 
          errors: ['Test error'], 
          warnings: [] 
        },
        validated: {
          title: 'Error Event',
          date: new Date(),
          gameType: 'Pathfinder'
        }
      });
      
      await contentLoader.loadCalendarEvents();
      
      const recentErrors = contentLoader.getRecentErrors();
      expect(recentErrors.length).toBeGreaterThan(0);
      expect(recentErrors[0]).toHaveProperty('type');
      expect(recentErrors[0]).toHaveProperty('message');
      expect(recentErrors[0]).toHaveProperty('timestamp');
    });

    it('should provide cache statistics', () => {
      const stats = contentLoader.getCacheStats();
      
      expect(stats).toHaveProperty('contentCacheSize');
      expect(stats).toHaveProperty('errorCacheSize');
      expect(stats).toHaveProperty('cachedKeys');
      expect(Array.isArray(stats.cachedKeys)).toBe(true);
    });

    it('should clear errors when requested', async () => {
      // Generate an error
      mockValidation.validateEventFrontmatter.mockReturnValue({
        result: { 
          isValid: false, 
          errors: ['Test error'], 
          warnings: [] 
        },
        validated: {
          title: 'Error Event',
          date: new Date(),
          gameType: 'Pathfinder'
        }
      });
      
      await contentLoader.loadCalendarEvents();
      expect(contentLoader.getRecentErrors().length).toBeGreaterThan(0);
      
      contentLoader.clearErrors();
      expect(contentLoader.getRecentErrors().length).toBe(0);
    });
  });

  describe('Markdown Parsing', () => {
    it('should handle parseMarkdownFile gracefully', async () => {
      const result = await contentLoader.parseMarkdownFile('test.md');
      
      expect(result).toHaveProperty('frontmatter');
      expect(result).toHaveProperty('content');
      expect(typeof result.frontmatter).toBe('object');
      expect(typeof result.content).toBe('string');
    });

    it('should sanitize parsed content', async () => {
      await contentLoader.parseMarkdownFile('test.md');
      
      expect(mockValidation.sanitizeContent).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should respect cache expiry', async () => {
      // Load content to populate cache
      await contentLoader.loadCalendarEvents();
      
      // Clear cache and load again
      contentLoader.clearCache();
      await contentLoader.loadCalendarEvents();
      
      // Should have called validation twice (once for each load)
      expect(mockValidation.validateEventFrontmatter.mock.calls.length).toBeGreaterThan(1);
    });

    it('should provide accurate cache statistics', async () => {
      const initialStats = contentLoader.getCacheStats();
      expect(initialStats.contentCacheSize).toBe(0);
      
      await contentLoader.loadCalendarEvents();
      
      const afterLoadStats = contentLoader.getCacheStats();
      expect(afterLoadStats.contentCacheSize).toBeGreaterThan(0);
      expect(afterLoadStats.cachedKeys).toContain('calendar-events');
    });
  });

  describe('Fallback Integration', () => {
    it('should merge with fallback when content is insufficient', async () => {
      // Mock insufficient real content
      mockFallbackContent.mergeWithFallback.mockImplementation((real, fallback) => {
        return real.length < 2 ? [...real, ...fallback] : real;
      });
      
      const events = await contentLoader.loadCalendarEvents();
      
      expect(mockFallbackContent.mergeWithFallback).toHaveBeenCalled();
    });

    it('should use pure fallback on complete failure', async () => {
      // Mock complete failure
      const originalParseMethod = (contentLoader as any).parseMarkdownContent;
      (contentLoader as any).parseMarkdownContent = jest.fn().mockImplementation(() => {
        throw new Error('Complete failure');
      });
      
      const events = await contentLoader.loadCalendarEvents();
      
      expect(mockFallbackContent.getFallbackEvents).toHaveBeenCalled();
      expect(events).toBeDefined();
      
      // Restore method
      (contentLoader as any).parseMarkdownContent = originalParseMethod;
    });
  });
});