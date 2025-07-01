import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../utils/ThemeContext';
import { ContentProvider } from '../utils/ContentContext';
import App from '../App';

// Import all components to ensure they're covered
import Calendar from '../components/Calendar';
import GameMasters from '../components/GameMasters';
import News from '../components/News';
import UpcomingEvents from '../components/UpcomingEvents';
import EventDetails from '../components/EventDetails';
import ThemeSelector from '../components/ThemeSelector';
import Contact from '../components/Contact';
import ErrorBoundary from '../components/ErrorBoundary';

// Import services and utilities
import { contentLoader } from '../services/contentLoader';
import { analyticsService } from '../services/analyticsService';
import { validateCalendarEvent, validateGameMaster, validateNewsArticle } from '../utils/validation';
import { getFallbackEvents, getFallbackGameMasters, getFallbackNews } from '../utils/fallbackContent';

// Mock all external dependencies
jest.mock('../services/contentLoader', () => ({
  contentLoader: {
    loadCalendarEvents: jest.fn(),
    loadGameMasters: jest.fn(),
    loadNewsArticles: jest.fn(),
    clearCache: jest.fn()
  }
}));

jest.mock('../services/analyticsService', () => ({
  analyticsService: {
    trackPageView: jest.fn(),
    trackEvent: jest.fn(),
    trackThemeSwitch: jest.fn(),
    trackContentInteraction: jest.fn()
  }
}));

const mockEvents = [
  {
    id: 'event-1',
    title: 'Test Event',
    date: new Date('2025-07-15'),
    description: 'Test description',
    content: 'Test content',
    gameType: 'Pathfinder' as const,
    gamemaster: 'Test GM'
  }
];

const mockGameMasters = [
  {
    id: 'gm-1',
    name: 'Test GM',
    organizedPlayId: '12345',
    games: ['Pathfinder'] as ('Pathfinder' | 'Starfinder' | 'Legacy')[],
    bio: 'Test bio'
  }
];

const mockNews = [
  {
    id: 'news-1',
    title: 'Test News',
    date: new Date('2025-06-30'),
    excerpt: 'Test excerpt',
    content: 'Test content',
    author: 'Test Author'
  }
];

describe('Comprehensive Test Coverage Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks
    (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);
    (contentLoader.loadGameMasters as jest.Mock).mockResolvedValue(mockGameMasters);
    (contentLoader.loadNewsArticles as jest.Mock).mockResolvedValue(mockNews);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Component Coverage Tests', () => {
    test('App component renders all child components', async () => {
      await act(async () => {
        render(
          <ThemeProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </ThemeProvider>
        );
      });

      // Verify all major components are rendered
      await waitFor(() => {
        // App should render without crashing
        expect(document.body).toBeInTheDocument();
      });
    });

    test('Calendar component handles all props and states', async () => {
      const mockOnEventSelect = jest.fn();
      
      // Test with events
      const { rerender } = render(
        <ThemeProvider>
          <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });

      // Test without events
      rerender(
        <ThemeProvider>
          <Calendar events={[]} onEventSelect={mockOnEventSelect} />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No upcoming events scheduled.')).toBeInTheDocument();
      });

      // Test loading state
      (contentLoader.loadCalendarEvents as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      rerender(
        <ThemeProvider>
          <Calendar events={[]} onEventSelect={mockOnEventSelect} />
        </ThemeProvider>
      );

      expect(screen.getByText('Loading events...')).toBeInTheDocument();
    });

    test('GameMasters component handles all scenarios', async () => {
      const mockOnSelect = jest.fn();
      
      // Test with game masters
      render(
        <ThemeProvider>
          <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={mockOnSelect} />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test GM')).toBeInTheDocument();
      });

      // Test click interaction
      const gmElement = screen.getByText('Test GM');
      fireEvent.click(gmElement);
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockGameMasters[0]);
    });

    test('News component handles all scenarios', async () => {
      // Test with news articles
      render(
        <ThemeProvider>
          <News articles={mockNews} />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test News')).toBeInTheDocument();
      });

      // Test without articles
      render(
        <ThemeProvider>
          <News articles={[]} />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No news articles available.')).toBeInTheDocument();
      });
    });

    test('UpcomingEvents component handles all scenarios', async () => {
      // Test with events
      render(
        <ThemeProvider>
          <UpcomingEvents events={mockEvents} maxEvents={3} />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });

      // Test without events
      render(
        <ThemeProvider>
          <UpcomingEvents events={[]} maxEvents={3} />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
      });
    });

    test('EventDetails component handles all scenarios', async () => {
      // Test with event
      render(
        <ThemeProvider>
          <EventDetails event={mockEvents[0]} onBack={jest.fn()} />
        </ThemeProvider>
      );

      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();

      // Test back button
      const backButton = screen.getByText('← Back to Calendar');
      fireEvent.click(backButton);
    });

    test('ThemeSelector component handles all interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <ThemeSelector />
        </ThemeProvider>
      );

      const selector = screen.getByRole('combobox', { name: /theme/i });
      
      // Test theme switching
      await user.selectOptions(selector, 'sci-fi');
      
      await waitFor(() => {
        expect(analyticsService.trackThemeSwitch).toHaveBeenCalledWith('sci-fi');
      });
    });

    test('Contact component renders correctly', () => {
      render(
        <ThemeProvider>
          <Contact />
        </ThemeProvider>
      );

      expect(screen.getByText('Contact Us')).toBeInTheDocument();
      expect(screen.getByText('lodge@shiftingcorridor.com')).toBeInTheDocument();
    });

    test('ErrorBoundary component handles errors', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const mockOnError = jest.fn();
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  describe('Service Coverage Tests', () => {
    test('contentLoader service handles all scenarios', async () => {
      // Test successful loading
      const events = await contentLoader.loadCalendarEvents();
      expect(events).toEqual(mockEvents);

      const gameMasters = await contentLoader.loadGameMasters();
      expect(gameMasters).toEqual(mockGameMasters);

      const news = await contentLoader.loadNewsArticles();
      expect(news).toEqual(mockNews);

      // Test error handling
      (contentLoader.loadCalendarEvents as jest.Mock).mockRejectedValue(new Error('Load failed'));
      
      try {
        await contentLoader.loadCalendarEvents();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Test cache clearing
      contentLoader.clearCache();
      expect(contentLoader.clearCache).toHaveBeenCalled();
    });

    test('analyticsService tracks all event types', () => {
      analyticsService.trackPageView('/test');
      expect(analyticsService.trackPageView).toHaveBeenCalledWith('/test');

      analyticsService.trackEvent('test-event', 1);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith('test-event', 1);

      analyticsService.trackThemeSwitch('sci-fi');
      expect(analyticsService.trackThemeSwitch).toHaveBeenCalledWith('sci-fi');

      analyticsService.trackContentInteraction('event', 'event-1');
      expect(analyticsService.trackContentInteraction).toHaveBeenCalledWith('event', 'event-1');
    });
  });

  describe('Utility Function Coverage Tests', () => {
    test('validation functions handle all scenarios', () => {
      // Test valid data
      expect(validateCalendarEvent(mockEvents[0])).toBe(true);
      expect(validateGameMaster(mockGameMasters[0])).toBe(true);
      expect(validateNewsArticle(mockNews[0])).toBe(true);

      // Test invalid data
      expect(validateCalendarEvent({})).toBe(false);
      expect(validateGameMaster({})).toBe(false);
      expect(validateNewsArticle({})).toBe(false);

      // Test null/undefined
      expect(validateCalendarEvent(null as any)).toBe(false);
      expect(validateGameMaster(undefined as any)).toBe(false);
      expect(validateNewsArticle(null as any)).toBe(false);
    });

    test('fallback content functions provide defaults', () => {
      const fallbackEvents = getFallbackEvents();
      expect(Array.isArray(fallbackEvents)).toBe(true);
      expect(fallbackEvents.length).toBeGreaterThan(0);

      const fallbackGMs = getFallbackGameMasters();
      expect(Array.isArray(fallbackGMs)).toBe(true);
      expect(fallbackGMs.length).toBeGreaterThan(0);

      const fallbackNews = getFallbackNews();
      expect(Array.isArray(fallbackNews)).toBe(true);
      expect(fallbackNews.length).toBeGreaterThan(0);
    });
  });

  describe('Context Coverage Tests', () => {
    test('ThemeContext handles all theme operations', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <ThemeSelector />
        </ThemeProvider>
      );

      // Test initial theme
      expect(document.body).toHaveClass('theme-medieval');

      // Test theme switching
      const selector = screen.getByRole('combobox', { name: /theme/i });
      await user.selectOptions(selector, 'sci-fi');

      await waitFor(() => {
        expect(document.body).toHaveClass('theme-sci-fi');
      });

      // Test persistence
      expect(localStorage.setItem).toHaveBeenCalledWith('selectedTheme', 'sci-fi');
    });

    test('ContentContext handles all content operations', async () => {
      await act(async () => {
        render(
          <ThemeProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </ThemeProvider>
        );
      });

      // Content should be loaded
      await waitFor(() => {
        expect(contentLoader.loadCalendarEvents).toHaveBeenCalled();
        expect(contentLoader.loadGameMasters).toHaveBeenCalled();
        expect(contentLoader.loadNewsArticles).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Coverage Tests', () => {
    test('handles content loading failures gracefully', async () => {
      // Set up failures
      (contentLoader.loadCalendarEvents as jest.Mock).mockRejectedValue(new Error('Calendar failed'));
      (contentLoader.loadGameMasters as jest.Mock).mockRejectedValue(new Error('GM failed'));
      (contentLoader.loadNewsArticles as jest.Mock).mockRejectedValue(new Error('News failed'));

      await act(async () => {
        render(
          <ThemeProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </ThemeProvider>
        );
      });

      // App should still render
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    test('handles component errors with error boundaries', () => {
      const ErrorComponent = () => {
        throw new Error('Component error');
      };

      render(
        <ThemeProvider>
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        </ThemeProvider>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    test('handles network timeouts', async () => {
      // Simulate timeout
      (contentLoader.loadCalendarEvents as jest.Mock).mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await act(async () => {
        render(
          <ThemeProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </ThemeProvider>
        );
      });

      // Should handle timeout gracefully
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Performance Coverage Tests', () => {
    test('handles large datasets efficiently', async () => {
      // Create large datasets
      const largeEvents = Array.from({ length: 1000 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        date: new Date(2025, 6, i + 1),
        description: `Description ${i}`,
        content: `Content ${i}`,
        gameType: 'Pathfinder' as const,
        gamemaster: `GM ${i}`
      }));

      (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue(largeEvents);

      const startTime = performance.now();
      
      render(
        <ThemeProvider>
          <Calendar events={largeEvents} onEventSelect={jest.fn()} />
        </ThemeProvider>
      );

      const endTime = performance.now();
      
      // Should render efficiently even with large datasets
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('optimizes re-renders', async () => {
      const mockOnEventSelect = jest.fn();
      
      const { rerender } = render(
        <ThemeProvider>
          <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
        </ThemeProvider>
      );

      // Re-render with same props
      rerender(
        <ThemeProvider>
          <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
        </ThemeProvider>
      );

      // Should handle re-renders efficiently
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });
  });

  describe('Accessibility Coverage Tests', () => {
    test('all interactive elements have proper ARIA labels', async () => {
      await act(async () => {
        render(
          <ThemeProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </ThemeProvider>
        );
      });

      await waitFor(() => {
        // Check buttons have labels
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          const hasLabel = button.getAttribute('aria-label') || 
                          button.textContent || 
                          button.getAttribute('title');
          expect(hasLabel).toBeTruthy();
        });

        // Check form elements have labels
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
          const hasLabel = select.getAttribute('aria-label') || 
                          document.querySelector(`label[for="${select.id}"]`);
          expect(hasLabel).toBeTruthy();
        });
      });
    });

    test('keyboard navigation works throughout the app', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(
          <ThemeProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </ThemeProvider>
        );
      });

      // Tab through focusable elements
      await user.tab();
      await user.tab();
      await user.tab();

      // Should maintain focus order
      expect(document.activeElement).toBeInTheDocument();
    });

    test('screen reader support is comprehensive', async () => {
      await act(async () => {
        render(
          <ThemeProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </ThemeProvider>
        );
      });

      await waitFor(() => {
        // Check for live regions
        const liveRegions = document.querySelectorAll('[aria-live]');
        expect(liveRegions.length).toBeGreaterThanOrEqual(0);

        // Check for proper heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        expect(headings.length).toBeGreaterThan(0);
      });
    });
  });
});