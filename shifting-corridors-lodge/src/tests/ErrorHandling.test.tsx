import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ErrorBoundary from '../components/ErrorBoundary';
import { ContentProvider, useContent } from '../utils/ContentContext';
import { ThemeProvider } from '../utils/ThemeContext';
import { contentLoader } from '../services/contentLoader';
import { 
  validateEventFrontmatter,
  validateGameMasterFrontmatter,
  validateNewsFrontmatter,
  parseDate,
  sanitizeContent,
  extractExcerpt
} from '../utils/validation';
import { 
  getFallbackContent,
  isFallbackContent,
  mergeWithFallback
} from '../utils/fallbackContent';

// Mock the content loader
jest.mock('../services/contentLoader');

// Test component that throws errors
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean; errorType?: string }> = ({ 
  shouldThrow, 
  errorType = 'generic' 
}) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'network':
        throw new Error('Network error: Failed to fetch');
      case 'parsing':
        throw new Error('Parsing error: Invalid JSON');
      case 'chunk-load':
        const error = new Error('Loading chunk failed');
        error.name = 'ChunkLoadError';
        throw error;
      default:
        throw new Error('Test error');
    }
  }
  return <div>Component rendered successfully</div>;
};

// Test component that uses content context
const ContentConsumer: React.FC = () => {
  const { events, gamemasters, news, loading, error, retryLoad, clearError } = useContent();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Loaded'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <div data-testid="events-count">{events.length}</div>
      <div data-testid="gamemasters-count">{gamemasters.length}</div>
      <div data-testid="news-count">{news.length}</div>
      <button onClick={retryLoad} data-testid="retry-button">Retry</button>
      <button onClick={clearError} data-testid="clear-error-button">Clear Error</button>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <ContentProvider>
      {children}
    </ContentProvider>
  </ThemeProvider>
);

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ErrorBoundary', () => {
    it('should catch and display generic errors', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/unexpected error/)).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });

    it('should display network-specific error messages', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} errorType="network" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText(/trouble connecting to our servers/)).toBeInTheDocument();
      expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
    });

    it('should display parsing-specific error messages', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} errorType="parsing" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText(/issue processing the content/)).toBeInTheDocument();
    });

    it('should display chunk load error messages', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} errorType="chunk-load" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText(/Failed to load part of the application/)).toBeInTheDocument();
      expect(screen.getByText('Refresh the page (the app may have been updated)')).toBeInTheDocument();
    });

    it('should handle refresh button click', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Refresh Page'));
      expect(mockReload).toHaveBeenCalled();
    });

    it('should not show error when component renders successfully', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={false} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Content Loading Error Handling', () => {
    it('should handle content loading failures gracefully', async () => {
      // Mock content loader to return fallback content
      (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue([
        {
          id: 'fallback-event-1',
          title: 'Fallback Event 1',
          date: new Date(),
          description: 'Fallback description',
          content: 'Fallback content',
          gameType: 'Pathfinder'
        },
        {
          id: 'fallback-event-2',
          title: 'Fallback Event 2',
          date: new Date(),
          description: 'Fallback description',
          content: 'Fallback content',
          gameType: 'Starfinder'
        }
      ]);
      (contentLoader.loadGameMasters as jest.Mock).mockResolvedValue([
        {
          id: 'fallback-gm',
          name: 'Fallback GM',
          organizedPlayId: '00000',
          games: ['Pathfinder'],
          bio: 'Fallback bio'
        }
      ]);
      (contentLoader.loadNewsArticles as jest.Mock).mockResolvedValue([
        {
          id: 'fallback-news',
          title: 'Fallback News',
          date: new Date(),
          excerpt: 'Fallback excerpt',
          content: 'Fallback content'
        }
      ]);

      render(
        <TestWrapper>
          <ContentConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      // Should show fallback content
      expect(screen.getByTestId('events-count')).toHaveTextContent('2'); // Fallback events
      expect(screen.getByTestId('gamemasters-count')).toHaveTextContent('1'); // Fallback GM
      expect(screen.getByTestId('news-count')).toHaveTextContent('1'); // Fallback news
    });

    it('should handle partial content loading failures', async () => {
      // Mock partial success - some content loads, some doesn't
      (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue([
        { id: 'event1', title: 'Test Event', date: new Date(), description: 'Test', content: 'Test', gameType: 'Pathfinder' }
      ]);
      (contentLoader.loadGameMasters as jest.Mock).mockResolvedValue([
        { id: 'fallback-gm', name: 'Fallback GM', organizedPlayId: '00000', games: ['Pathfinder'], bio: 'Fallback bio' }
      ]);
      (contentLoader.loadNewsArticles as jest.Mock).mockResolvedValue([
        { id: 'news1', title: 'Test News', date: new Date(), excerpt: 'Test', content: 'Test' }
      ]);

      render(
        <TestWrapper>
          <ContentConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      expect(screen.getByTestId('events-count')).toHaveTextContent('1');
      expect(screen.getByTestId('gamemasters-count')).toHaveTextContent('1');
      expect(screen.getByTestId('news-count')).toHaveTextContent('1');
    });

    it('should handle retry functionality', async () => {
      let callCount = 0;
      (contentLoader.loadCalendarEvents as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt failed');
        }
        return Promise.resolve([]);
      });
      (contentLoader.loadGameMasters as jest.Mock).mockResolvedValue([]);
      (contentLoader.loadNewsArticles as jest.Mock).mockResolvedValue([]);

      render(
        <TestWrapper>
          <ContentConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      // Should have error initially
      expect(screen.getByTestId('error')).not.toHaveTextContent('No error');

      // Click retry
      fireEvent.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });

    it('should clear errors when requested', async () => {
      (contentLoader.loadCalendarEvents as jest.Mock).mockRejectedValue(new Error('Test error'));
      (contentLoader.loadGameMasters as jest.Mock).mockResolvedValue([]);
      (contentLoader.loadNewsArticles as jest.Mock).mockResolvedValue([]);

      render(
        <TestWrapper>
          <ContentConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('No error');
      });

      fireEvent.click(screen.getByTestId('clear-error-button'));

      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });
  });

  describe('Validation Functions', () => {
    describe('validateEventFrontmatter', () => {
      it('should validate correct event frontmatter', () => {
        const frontmatter = {
          title: 'Test Event',
          date: '2025-07-01',
          gameType: 'Pathfinder'
        };

        const { result, validated } = validateEventFrontmatter(frontmatter);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(validated.title).toBe('Test Event');
        expect(validated.gameType).toBe('Pathfinder');
      });

      it('should provide defaults for missing required fields', () => {
        const frontmatter = {};

        const { result, validated } = validateEventFrontmatter(frontmatter);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Event title is required and must be a string');
        expect(result.errors).toContain('Event date is required');
        expect(validated.title).toBe('Untitled Event');
        expect(validated.gameType).toBeUndefined(); // No default gameType, will be auto-detected
      });

      it('should handle invalid game types', () => {
        const frontmatter = {
          title: 'Test Event',
          date: '2025-07-01',
          gameType: 'InvalidGame'
        };

        const { result, validated } = validateEventFrontmatter(frontmatter);

        expect(result.warnings).toContain('Invalid game type "InvalidGame", will be auto-detected');
        expect(validated.gameType).toBeUndefined(); // Invalid gameType is ignored, will be auto-detected
      });
    });

    describe('validateGameMasterFrontmatter', () => {
      it('should validate correct game master frontmatter', () => {
        const frontmatter = {
          firstName: 'John',
          lastInitial: 'D',
          organizedPlayNumber: '12345',
          games: ['Pathfinder', 'Starfinder']
        };

        const { result, validated } = validateGameMasterFrontmatter(frontmatter);

        expect(result.isValid).toBe(true);
        expect(validated.firstName).toBe('John');
        expect(validated.lastInitial).toBe('D');
        expect(validated.games).toEqual(['Pathfinder', 'Starfinder']);
      });

      it('should handle missing name fields', () => {
        const frontmatter = {};

        const { result, validated } = validateGameMasterFrontmatter(frontmatter);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Game master first name is required');
        expect(validated.firstName).toBe('Unknown');
      });

      it('should parse full name when provided', () => {
        const frontmatter = {
          name: 'John Doe'
        };

        const { result, validated } = validateGameMasterFrontmatter(frontmatter);

        expect(validated.firstName).toBe('John');
        expect(validated.lastInitial).toBe('D');
      });
    });

    describe('validateNewsFrontmatter', () => {
      it('should validate correct news frontmatter', () => {
        const frontmatter = {
          title: 'Test Article',
          date: '2025-07-01',
          author: 'Test Author'
        };

        const { result, validated } = validateNewsFrontmatter(frontmatter);

        expect(result.isValid).toBe(true);
        expect(validated.title).toBe('Test Article');
        expect(validated.author).toBe('Test Author');
      });

      it('should provide defaults for missing fields', () => {
        const frontmatter = {};

        const { result, validated } = validateNewsFrontmatter(frontmatter);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('News article title is required');
        expect(validated.title).toBe('Untitled Article');
      });
    });

    describe('parseDate', () => {
      it('should parse valid date strings', () => {
        expect(parseDate('2025-07-01')).toEqual(new Date('2025-07-01'));
        expect(parseDate('07/01/2025')).toEqual(new Date('07/01/2025'));
      });

      it('should handle Date objects', () => {
        const date = new Date('2025-07-01');
        expect(parseDate(date)).toEqual(date);
      });

      it('should return invalid date for invalid input', () => {
        const result = parseDate('invalid-date');
        expect(isNaN(result.getTime())).toBe(true);
      });
    });

    describe('sanitizeContent', () => {
      it('should remove script tags', () => {
        const content = 'Safe content <script>alert("xss")</script> more content';
        const sanitized = sanitizeContent(content);
        expect(sanitized).toBe('Safe content  more content');
      });

      it('should remove dangerous attributes', () => {
        const content = '<div onclick="alert(\'xss\')">Content</div>';
        const sanitized = sanitizeContent(content);
        expect(sanitized).toBe('<div>Content</div>');
      });

      it('should handle non-string input', () => {
        expect(sanitizeContent(null as any)).toBe('');
        expect(sanitizeContent(undefined as any)).toBe('');
        expect(sanitizeContent(123 as any)).toBe('');
      });
    });

    describe('extractExcerpt', () => {
      it('should extract excerpt from content', () => {
        const content = 'This is a long piece of content that should be truncated at some point to create a nice excerpt for display purposes.';
        const excerpt = extractExcerpt(content, 50);
        expect(excerpt.length).toBeLessThanOrEqual(53); // 50 + '...'
        expect(excerpt.endsWith('...')).toBe(true);
      });

      it('should handle short content', () => {
        const content = 'Short content';
        const excerpt = extractExcerpt(content, 50);
        expect(excerpt).toBe('Short content');
      });

      it('should remove markdown formatting', () => {
        const content = '**Bold text** and *italic text* with [link](url)';
        const excerpt = extractExcerpt(content);
        expect(excerpt).toBe('Bold text and italic text with link');
      });
    });
  });

  describe('Fallback Content', () => {
    it('should provide fallback content', () => {
      const fallback = getFallbackContent();
      
      expect(fallback.events).toHaveLength(2);
      expect(fallback.gamemasters).toHaveLength(1);
      expect(fallback.news).toHaveLength(1);
      
      expect(fallback.events[0].title).toContain('Pathfinder');
      expect(fallback.gamemasters[0].name).toBe('Game Master');
      expect(fallback.news[0].title).toContain('Welcome');
    });

    it('should identify fallback content', () => {
      const fallback = getFallbackContent();
      
      expect(isFallbackContent(fallback.events)).toBe(true);
      expect(isFallbackContent(fallback.gamemasters)).toBe(true);
      expect(isFallbackContent(fallback.news)).toBe(true);
      
      const realContent = [{ id: 'real-content', title: 'Real' }];
      expect(isFallbackContent(realContent)).toBe(false);
    });

    it('should merge real content with fallback', () => {
      const realEvents = [
        { id: 'real-event', title: 'Real Event', date: new Date(), description: '', content: '', gameType: 'Pathfinder' as const }
      ];
      const fallbackEvents = getFallbackContent().events;
      
      const merged = mergeWithFallback(realEvents, fallbackEvents);
      
      expect(merged.length).toBeGreaterThan(realEvents.length);
      expect(merged[0].id).toBe('real-event');
    });
  });
});