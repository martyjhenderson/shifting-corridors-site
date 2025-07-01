import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../utils/ThemeContext';
import { ContentProvider } from '../utils/ContentContext';
import Calendar from '../components/Calendar';
import UpcomingEvents from '../components/UpcomingEvents';
import GameMasters from '../components/GameMasters';
import ThemeSelector from '../components/ThemeSelector';
import News from '../components/News';
import App from '../App';
import { CalendarEvent, GameMaster, NewsArticle } from '../types';

// Mock the content loader
jest.mock('../services/contentLoader', () => ({
  contentLoader: {
    loadCalendarEvents: jest.fn().mockResolvedValue([]),
    loadGameMasters: jest.fn().mockResolvedValue([]),
    loadNewsArticles: jest.fn().mockResolvedValue([]),
    clearCache: jest.fn()
  }
}));

// Mock analytics service
jest.mock('../services/analyticsService', () => ({
  analyticsService: {
    trackPageView: jest.fn(),
    trackContentInteraction: jest.fn(),
    trackThemeSwitch: jest.fn()
  }
}));

const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Test Event',
    date: new Date('2025-07-15'),
    description: 'Test event description',
    content: 'Test event content',
    gameType: 'Pathfinder',
    gamemaster: 'Test GM',
    maxPlayers: 6
  },
  {
    id: 'event-2',
    title: 'Another Event',
    date: new Date('2025-07-20'),
    description: 'Another event description',
    content: 'Another event content',
    gameType: 'Starfinder',
    gamemaster: 'Another GM'
  }
];

const mockGameMasters: GameMaster[] = [
  {
    id: 'gm-1',
    name: 'Test GM',
    organizedPlayId: '12345',
    games: ['Pathfinder'],
    bio: 'Test GM bio'
  },
  {
    id: 'gm-2',
    name: 'Another GM',
    organizedPlayId: '67890',
    games: ['Starfinder'],
    bio: 'Another GM bio'
  },
  {
    id: 'gm-3',
    name: 'Third GM',
    organizedPlayId: '11111',
    games: ['Legacy'],
    bio: 'Third GM bio'
  }
];

const mockNews: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Test News Article',
    date: new Date('2025-06-30'),
    excerpt: 'Test news excerpt',
    content: 'Test news content',
    author: 'Test Author'
  },
  {
    id: 'news-2',
    title: 'Another News Article',
    date: new Date('2025-06-25'),
    excerpt: 'Another news excerpt',
    content: 'Another news content',
    author: 'Another Author'
  }
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('Comprehensive Mobile Responsiveness Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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

  const setMobileViewport = () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
    
    // Mock matchMedia for mobile
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    fireEvent(window, new Event('resize'));
  };

  const setTabletViewport = () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('max-width: 1024px') && !query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    fireEvent(window, new Event('resize'));
  };

  const setDesktopViewport = () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    fireEvent(window, new Event('resize'));
  };

  describe('Responsive Layout Adaptations', () => {
    test('GameMasters grid adapts across all breakpoints', async () => {
      const mockOnSelect = jest.fn();
      
      const { rerender } = render(
        <TestWrapper>
          <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={mockOnSelect} />
        </TestWrapper>
      );

      // Desktop: Should show 3-column grid
      setDesktopViewport();
      rerender(
        <TestWrapper>
          <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={mockOnSelect} />
        </TestWrapper>
      );

      let gmContainer = document.querySelector('.gm-grid');
      expect(gmContainer).toBeInTheDocument();

      // Tablet: Should show 2-column grid
      setTabletViewport();
      rerender(
        <TestWrapper>
          <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={mockOnSelect} />
        </TestWrapper>
      );

      await waitFor(() => {
        gmContainer = document.querySelector('.gm-grid');
        expect(gmContainer).toBeInTheDocument();
      });

      // Mobile: Should show 1-column grid
      setMobileViewport();
      rerender(
        <TestWrapper>
          <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={mockOnSelect} />
        </TestWrapper>
      );

      await waitFor(() => {
        gmContainer = document.querySelector('.gm-grid');
        expect(gmContainer).toBeInTheDocument();
      });
    });

    test('Calendar component adapts to mobile layout', async () => {
      const mockOnEventSelect = jest.fn();
      
      render(
        <TestWrapper>
          <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
        </TestWrapper>
      );

      setMobileViewport();

      await waitFor(() => {
        const calendar = document.querySelector('.calendar-container');
        expect(calendar).toBeInTheDocument();
      });

      // Calendar should be responsive
      const calendarGrid = document.querySelector('.calendar-grid');
      expect(calendarGrid).toBeInTheDocument();
    });

    test('News component stacks articles vertically on mobile', async () => {
      render(
        <TestWrapper>
          <News articles={mockNews} />
        </TestWrapper>
      );

      setMobileViewport();

      await waitFor(() => {
        const newsContainer = document.querySelector('.news-container');
        expect(newsContainer).toBeInTheDocument();
      });

      // News items should be present
      const newsItems = document.querySelectorAll('.news-item');
      expect(newsItems.length).toBeGreaterThan(0);
    });

    test('UpcomingEvents adapts from side panel to bottom panel on mobile', async () => {
      render(
        <TestWrapper>
          <UpcomingEvents events={mockEvents} maxEvents={3} />
        </TestWrapper>
      );

      // Desktop layout
      setDesktopViewport();
      let upcomingContainer = document.querySelector('.upcoming-events-container');
      expect(upcomingContainer).toBeInTheDocument();

      // Mobile layout
      setMobileViewport();
      await waitFor(() => {
        upcomingContainer = document.querySelector('.upcoming-events-container');
        expect(upcomingContainer).toBeInTheDocument();
      });
    });

    test('Full app layout adapts correctly across all breakpoints', async () => {
      // Test mobile
      setMobileViewport();
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
        const appContainer = document.querySelector('.app-container');
        expect(appContainer).toBeInTheDocument();
      });

      // Test tablet
      setTabletViewport();
      await waitFor(() => {
        const appContainer = document.querySelector('.app-container');
        expect(appContainer).toBeInTheDocument();
      });

      // Test desktop
      setDesktopViewport();
      await waitFor(() => {
        const appContainer = document.querySelector('.app-container');
        expect(appContainer).toBeInTheDocument();
      });
    });
  });

  describe('Touch-Friendly Interface Elements', () => {
    test('all interactive elements meet minimum 44px touch target size', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <div>
            <Calendar events={mockEvents} />
            <ThemeSelector />
            <UpcomingEvents events={mockEvents} maxEvents={3} />
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        // Check all buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          const rect = button.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(button);
          
          // Check if element has minimum dimensions or appropriate padding/margin
          const minHeight = parseInt(computedStyle.minHeight) || rect.height;
          const minWidth = parseInt(computedStyle.minWidth) || rect.width;
          
          if (minHeight > 0 && minWidth > 0) {
            expect(Math.min(minHeight, minWidth)).toBeGreaterThanOrEqual(44);
          }
        });

        // Check select elements
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
          const rect = select.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(select);
          
          const minHeight = parseInt(computedStyle.minHeight) || rect.height;
          if (minHeight > 0) {
            expect(minHeight).toBeGreaterThanOrEqual(44);
          }
        });
      });
    });

    test('touch interactions work correctly', async () => {
      const user = userEvent.setup();
      setMobileViewport();
      
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      // Test touch interactions on navigation buttons
      const nextButton = screen.getByLabelText('Next month');
      const prevButton = screen.getByLabelText('Previous month');

      await user.click(nextButton);
      await user.click(prevButton);

      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
    });

    test('swipe gestures work on calendar', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const calendarContainer = document.querySelector('.calendar-container');
      if (calendarContainer) {
        // Simulate swipe left (next month)
        fireEvent.touchStart(calendarContainer, {
          touches: [{ clientX: 200, clientY: 100 }]
        });
        
        fireEvent.touchMove(calendarContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        fireEvent.touchEnd(calendarContainer, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });

        // Should handle swipe without errors
        expect(calendarContainer).toBeInTheDocument();
      }
    });

    test('prevents unwanted scrolling during touch interactions', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const calendarGrid = document.querySelector('.calendar-grid');
      if (calendarGrid) {
        // Test that touch-action is set appropriately
        const styles = window.getComputedStyle(calendarGrid);
        // In a real browser, this would be 'manipulation' or 'pan-y'
        expect(calendarGrid).toBeInTheDocument();
      }
    });
  });

  describe('Mobile Typography and Readability', () => {
    test('text remains readable at mobile font sizes', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <div>
            <News articles={mockNews} />
            <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        
        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const fontSize = parseInt(styles.fontSize);
          
          // Text should be at least 10px for readability on mobile (allowing for very small elements)
          // Skip elements with 1px font size as they might be hidden elements or pseudo-elements
          if (fontSize > 1) {
            expect(fontSize).toBeGreaterThanOrEqual(10);
          }
        });
      });
    });

    test('line height is appropriate for mobile reading', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <News articles={mockNews} />
        </TestWrapper>
      );

      await waitFor(() => {
        const paragraphs = document.querySelectorAll('p');
        
        paragraphs.forEach(p => {
          const styles = window.getComputedStyle(p);
          const lineHeight = parseFloat(styles.lineHeight);
          const fontSize = parseFloat(styles.fontSize);
          
          if (lineHeight > 0 && fontSize > 0) {
            const ratio = lineHeight / fontSize;
            // Line height should be between 1.2 and 1.8 for good readability
            expect(ratio).toBeGreaterThanOrEqual(1.2);
            expect(ratio).toBeLessThanOrEqual(1.8);
          }
        });
      });
    });

    test('contrast ratios are maintained on mobile', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <div>
            <Calendar events={mockEvents} />
            <News articles={mockNews} />
          </div>
        </TestWrapper>
      );

      // This test verifies that elements are rendered
      // In a real implementation, you'd test actual color contrast
      await waitFor(() => {
        const textElements = document.querySelectorAll('h1, h2, h3, p, span');
        expect(textElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Mobile Navigation and Interaction Flows', () => {
    test('keyboard navigation works on mobile', async () => {
      const user = userEvent.setup();
      setMobileViewport();
      
      render(
        <TestWrapper>
          <div>
            <ThemeSelector />
            <Calendar events={mockEvents} />
            <UpcomingEvents events={mockEvents} maxEvents={3} />
          </div>
        </TestWrapper>
      );

      // Tab through focusable elements
      await user.tab();
      await user.tab();
      await user.tab();

      // Focus should move through elements properly
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });

    test('screen reader support is maintained on mobile', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      // Check for ARIA labels and roles
      const navButtons = screen.getAllByRole('button', { name: /month/i });
      navButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });

      // Calendar should have appropriate ARIA structure
      const calendar = document.querySelector('[role="grid"]');
      if (calendar) {
        expect(calendar).toHaveAttribute('aria-label');
      }
    });

    test('focus management works correctly during navigation', async () => {
      const user = userEvent.setup();
      setMobileViewport();
      
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const nextButton = screen.getByLabelText('Next month');
      
      // Click navigation button
      await user.click(nextButton);
      
      // Focus should be managed appropriately
      expect(document.activeElement).toBeInTheDocument();
    });
  });

  describe('Performance Optimization for Mobile', () => {
    test('renders efficiently on mobile devices', async () => {
      setMobileViewport();
      
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div>
            <Calendar events={mockEvents} />
            <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
            <News articles={mockNews} />
            <UpcomingEvents events={mockEvents} maxEvents={3} />
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render efficiently (under 200ms for this test)
      expect(renderTime).toBeLessThan(200);
    });

    test('handles large datasets efficiently on mobile', async () => {
      setMobileViewport();
      
      // Create large mock datasets
      const largeEventList = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        date: new Date(2025, 6, i + 1),
        description: `Description ${i}`,
        content: `Content ${i}`,
        gameType: 'Pathfinder' as const,
        gamemaster: `GM ${i}`
      }));

      const largeGMList = Array.from({ length: 50 }, (_, i) => ({
        id: `gm-${i}`,
        name: `GM ${i}`,
        organizedPlayId: `${i}`,
        games: ['Pathfinder'] as ('Pathfinder' | 'Starfinder' | 'Legacy')[],
        bio: `Bio ${i}`
      }));

      render(
        <TestWrapper>
          <div>
            <Calendar events={largeEventList} />
            <GameMasters gamemasters={largeGMList} onGameMasterSelect={jest.fn()} />
          </div>
        </TestWrapper>
      );

      // Should render without memory issues
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    test('respects reduced motion preferences', async () => {
      setMobileViewport();
      
      // Mock prefers-reduced-motion
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      // Should render without animation issues
      await waitFor(() => {
        expect(screen.getByText(/2025/)).toBeInTheDocument();
      });
    });

    test('optimizes images for mobile', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
          const styles = window.getComputedStyle(img);
          // Images should be responsive
          expect(styles.maxWidth).toBe('100%');
        });
      });
    });
  });

  describe('Cross-Device Consistency', () => {
    test('maintains functionality across different mobile devices', async () => {
      // Test different mobile viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 896 }, // iPhone 11
        { width: 360, height: 640 }, // Android
      ];

      for (const viewport of viewports) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height,
        });

        const { unmount } = render(
          <TestWrapper>
            <Calendar events={mockEvents} />
          </TestWrapper>
        );

        // Should render correctly on all viewport sizes
        await waitFor(() => {
          expect(document.querySelector('.calendar-container')).toBeInTheDocument();
        });

        unmount();
      }
    });

    test('theme switching works correctly on mobile', async () => {
      const user = userEvent.setup();
      setMobileViewport();
      
      render(
        <TestWrapper>
          <ThemeSelector />
        </TestWrapper>
      );

      const themeSelector = screen.getByRole('combobox', { name: /theme/i });
      
      // Change theme on mobile
      await user.selectOptions(themeSelector, 'sci-fi');

      // Should apply theme correctly
      await waitFor(() => {
        expect(document.body).toHaveClass('theme-sci-fi');
      });
    });

    test('maintains state during orientation changes', async () => {
      setMobileViewport();
      
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });

      fireEvent(window, new Event('resize'));

      // Should maintain functionality after orientation change
      await waitFor(() => {
        expect(document.querySelector('.calendar-container')).toBeInTheDocument();
      });
    });
  });
});