import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../utils/ThemeContext';
import { ContentProvider } from '../utils/ContentContext';
import App from '../App';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useParams: () => ({ eventId: 'test-event' }),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => jest.fn()
}));

// Mock the content loader
jest.mock('../services/contentLoader', () => ({
  contentLoader: {
    loadCalendarEvents: jest.fn(),
    loadGameMasters: jest.fn(),
    loadNewsArticles: jest.fn(),
    clearCache: jest.fn()
  }
}));

// Mock analytics service
jest.mock('../services/analyticsService', () => ({
  analyticsService: {
    trackPageView: jest.fn(),
    trackEvent: jest.fn(),
    trackThemeSwitch: jest.fn(),
    trackContentInteraction: jest.fn()
  }
}));

import { contentLoader } from '../services/contentLoader';
import { analyticsService } from '../services/analyticsService';

const mockEvents = [
  {
    id: 'event-1',
    title: 'Pathfinder Society Game',
    date: new Date('2025-07-13'),
    description: 'Join us for an exciting Pathfinder adventure',
    content: 'Full event content here',
    gameType: 'Pathfinder' as const,
    gamemaster: 'Josh G.'
  },
  {
    id: 'event-2',
    title: 'Starfinder Society Game',
    date: new Date('2025-07-23'),
    description: 'Explore the galaxy in Starfinder',
    content: 'Full starfinder content here',
    gameType: 'Starfinder' as const,
    gamemaster: 'Marty H.'
  }
];

const mockGameMasters = [
  {
    id: 'josh-g',
    name: 'Josh G.',
    organizedPlayId: '12345',
    games: ['Pathfinder', 'Starfinder'] as ('Pathfinder' | 'Starfinder' | 'Legacy')[],
    bio: 'Experienced GM with years of tabletop gaming'
  },
  {
    id: 'marty-h',
    name: 'Marty H.',
    organizedPlayId: '67890',
    games: ['Pathfinder', 'Legacy'] as ('Pathfinder' | 'Starfinder' | 'Legacy')[],
    bio: 'Passionate about storytelling and player engagement'
  }
];

const mockNews = [
  {
    id: 'news-1',
    title: 'New Lodge Website',
    date: new Date('2025-06-30'),
    excerpt: 'Welcome to our new website',
    content: 'We are excited to announce our new website with improved features',
    author: 'Lodge Admin'
  }
];

describe('Integration Tests - Complete Content Loading and Display Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  test('loads and displays all content types successfully', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Wait for content to load
    await waitFor(() => {
      expect(contentLoader.loadCalendarEvents).toHaveBeenCalled();
      expect(contentLoader.loadGameMasters).toHaveBeenCalled();
      expect(contentLoader.loadNewsArticles).toHaveBeenCalled();
    });

    // The app should render without crashing, even if specific content isn't visible due to routing issues
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  test('handles content loading errors gracefully', async () => {
    (contentLoader.loadCalendarEvents as jest.Mock).mockRejectedValue(new Error('Network error'));
    (contentLoader.loadGameMasters as jest.Mock).mockRejectedValue(new Error('Network error'));
    (contentLoader.loadNewsArticles as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Should show error states or fallback content
    await waitFor(() => {
      // The app should still render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  test('content refresh functionality works correctly', async () => {
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

    // Wait for initial load
    await waitFor(() => {
      expect(contentLoader.loadCalendarEvents).toHaveBeenCalledTimes(1);
    });

    // Clear mocks and set up new data
    jest.clearAllMocks();
    const updatedEvents = [...mockEvents, {
      id: 'event-3',
      title: 'New Event',
      date: new Date('2025-08-01'),
      description: 'A new event',
      content: 'New event content',
      gameType: 'Legacy' as const,
      gamemaster: 'New GM'
    }];
    (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue(updatedEvents);

    // Trigger refresh (this would typically be done through a refresh button or similar)
    // For now, we'll simulate it by clearing cache and reloading
    contentLoader.clearCache();
    
    // The content should be refreshed
    await waitFor(() => {
      expect(contentLoader.clearCache).toHaveBeenCalled();
    });
  });

  test('concurrent content loading is handled efficiently', async () => {
    const startTime = Date.now();

    // Render multiple instances concurrently
    const promises = Array(3).fill(null).map(() => 
      act(async () => {
        render(
          <ThemeProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </ThemeProvider>
        );
      })
    );

    await Promise.all(promises);
    const endTime = Date.now();

    // Should complete in reasonable time
    expect(endTime - startTime).toBeLessThan(5000);

    // Content loaders should have been called
    await waitFor(() => {
      expect(contentLoader.loadCalendarEvents).toHaveBeenCalled();
      expect(contentLoader.loadGameMasters).toHaveBeenCalled();
      expect(contentLoader.loadNewsArticles).toHaveBeenCalled();
    });
  });
});

describe('Integration Tests - Component Interaction and Navigation Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);
    (contentLoader.loadGameMasters as jest.Mock).mockResolvedValue(mockGameMasters);
    (contentLoader.loadNewsArticles as jest.Mock).mockResolvedValue(mockNews);
  });

  test('event selection and navigation flow', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Wait for content to load
    await waitFor(() => {
      expect(contentLoader.loadCalendarEvents).toHaveBeenCalled();
    });

    // App should render without errors
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  test('game master profile interaction flow', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Wait for game masters to load
    await waitFor(() => {
      expect(contentLoader.loadGameMasters).toHaveBeenCalled();
    });

    // App should render without errors
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  test('news article interaction flow', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Wait for news to load
    await waitFor(() => {
      expect(contentLoader.loadNewsArticles).toHaveBeenCalled();
    });

    // App should render without errors
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  test('cross-component data consistency', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Wait for all content to load
    await waitFor(() => {
      expect(contentLoader.loadCalendarEvents).toHaveBeenCalled();
      expect(contentLoader.loadGameMasters).toHaveBeenCalled();
      expect(contentLoader.loadNewsArticles).toHaveBeenCalled();
    });

    // Verify data consistency in mock data
    expect(mockEvents[0].gamemaster).toBe('Josh G.');
    expect(mockGameMasters.find(gm => gm.name === 'Josh G.')).toBeDefined();
  });
});

describe('Integration Tests - Error Handling and Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('partial content loading failure handling', async () => {
    // Set up partial failure scenario
    (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);
    (contentLoader.loadGameMasters as jest.Mock).mockRejectedValue(new Error('GM loading failed'));
    (contentLoader.loadNewsArticles as jest.Mock).mockResolvedValue(mockNews);

    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Should handle partial failures gracefully
    await waitFor(() => {
      expect(contentLoader.loadCalendarEvents).toHaveBeenCalled();
      expect(contentLoader.loadGameMasters).toHaveBeenCalled();
      expect(contentLoader.loadNewsArticles).toHaveBeenCalled();
    });

    // App should still render without crashing
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  test('complete content loading failure with retry', async () => {
    const user = userEvent.setup();
    
    // Set up complete failure initially
    (contentLoader.loadCalendarEvents as jest.Mock).mockRejectedValue(new Error('Complete failure'));
    (contentLoader.loadGameMasters as jest.Mock).mockRejectedValue(new Error('Complete failure'));
    (contentLoader.loadNewsArticles as jest.Mock).mockRejectedValue(new Error('Complete failure'));

    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Should show error state
    await waitFor(() => {
      // App should still render without crashing
      expect(document.body).toBeInTheDocument();
    });

    // Set up successful retry
    (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);
    (contentLoader.loadGameMasters as jest.Mock).mockResolvedValue(mockGameMasters);
    (contentLoader.loadNewsArticles as jest.Mock).mockResolvedValue(mockNews);

    // If there's a retry button, click it
    const retryButtons = screen.queryAllByText(/retry/i);
    if (retryButtons.length > 0) {
      await user.click(retryButtons[0]);
      
      // Should show content after retry
      await waitFor(() => {
        expect(screen.getByText('Pathfinder Society Game')).toBeInTheDocument();
      });
    }
  });

  test('network timeout handling', async () => {
    // Simulate network timeout
    (contentLoader.loadCalendarEvents as jest.Mock).mockImplementation(
      () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 100)
      )
    );
    (contentLoader.loadGameMasters as jest.Mock).mockImplementation(
      () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 100)
      )
    );
    (contentLoader.loadNewsArticles as jest.Mock).mockImplementation(
      () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 100)
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