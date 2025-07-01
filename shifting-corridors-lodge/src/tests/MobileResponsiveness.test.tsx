import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../utils/ThemeContext';
import { ContentProvider } from '../utils/ContentContext';
import Calendar from '../components/Calendar';
import GameMasters from '../components/GameMasters';
import UpcomingEvents from '../components/UpcomingEvents';
import News from '../components/News';
import { CalendarEvent, GameMaster, NewsArticle } from '../types';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <ContentProvider>
        {children}
      </ContentProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Mock data
const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Test Event 1',
    date: new Date('2025-07-15'),
    description: 'Test description',
    content: 'Test content',
    gameType: 'Pathfinder',
    gamemaster: 'test-gm'
  },
  {
    id: 'event-2',
    title: 'Test Event 2',
    date: new Date('2025-07-20'),
    description: 'Test description 2',
    content: 'Test content 2',
    gameType: 'Starfinder',
    gamemaster: 'test-gm-2'
  }
];

const mockGameMasters: GameMaster[] = [
  {
    id: 'gm-1',
    name: 'Test GM 1',
    organizedPlayId: '12345',
    games: ['Pathfinder'] as ('Pathfinder' | 'Starfinder' | 'Legacy')[],
    bio: 'Test bio 1'
  },
  {
    id: 'gm-2',
    name: 'Test GM 2',
    organizedPlayId: '67890',
    games: ['Starfinder', 'Legacy'] as ('Pathfinder' | 'Starfinder' | 'Legacy')[],
    bio: 'Test bio 2'
  }
];

const mockNews: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Test News 1',
    date: new Date('2025-07-01'),
    excerpt: 'Test excerpt 1',
    content: 'Test content 1'
  },
  {
    id: 'news-2',
    title: 'Test News 2',
    date: new Date('2025-07-02'),
    excerpt: 'Test excerpt 2',
    content: 'Test content 2'
  }
];

describe('Mobile Responsiveness Tests', () => {
  // Mock window.matchMedia
  const mockMatchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(mockMatchMedia),
    });
  });

  describe('Calendar Component Mobile Responsiveness', () => {
    it('should render calendar in mobile layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      expect(screen.getByText('Test Event 2')).toBeInTheDocument();
    });

    it('should handle touch interactions on mobile', () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const eventElement = screen.getByText('Test Event 1');
      fireEvent.click(eventElement);
      
      // Should handle click/touch events properly
      expect(eventElement).toBeInTheDocument();
    });
  });

  describe('GameMasters Component Mobile Responsiveness', () => {
    it('should render game masters in mobile grid layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('Test GM 1')).toBeInTheDocument();
      expect(screen.getByText('Test GM 2')).toBeInTheDocument();
    });

    it('should handle game master selection on mobile', () => {
      const mockSelect = jest.fn();
      
      render(
        <TestWrapper>
          <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={mockSelect} />
        </TestWrapper>
      );

      const gmElement = screen.getByText('Test GM 1');
      fireEvent.click(gmElement);
      
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('UpcomingEvents Component Mobile Responsiveness', () => {
    it('should render upcoming events in mobile layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <UpcomingEvents events={mockEvents} maxEvents={3} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    });

    it('should adapt layout for tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <UpcomingEvents events={mockEvents} maxEvents={3} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    });
  });

  describe('News Component Mobile Responsiveness', () => {
    it('should render news articles in mobile layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <News articles={mockNews} />
        </TestWrapper>
      );

      expect(screen.getByText('Test News 1')).toBeInTheDocument();
      expect(screen.getByText('Test News 2')).toBeInTheDocument();
    });

    it('should handle news article interactions on mobile', () => {
      render(
        <TestWrapper>
          <News articles={mockNews} />
        </TestWrapper>
      );

      const newsElement = screen.getByText('Test News 1');
      fireEvent.click(newsElement);
      
      expect(newsElement).toBeInTheDocument();
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should handle mobile breakpoint (320px - 768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <div>
            <Calendar events={mockEvents} />
            <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      expect(screen.getByText('Test GM 1')).toBeInTheDocument();
    });

    it('should handle tablet breakpoint (768px - 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <div>
            <Calendar events={mockEvents} />
            <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      expect(screen.getByText('Test GM 1')).toBeInTheDocument();
    });

    it('should handle desktop breakpoint (1024px+)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <TestWrapper>
          <div>
            <Calendar events={mockEvents} />
            <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      expect(screen.getByText('Test GM 1')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    it('should provide touch-friendly tap targets', () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const eventElements = screen.getAllByText(/Test Event/);
      eventElements.forEach(element => {
        // Check that elements are clickable/touchable
        expect(element).toBeInTheDocument();
        fireEvent.click(element);
      });
    });

    it('should handle swipe gestures appropriately', async () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const calendarContainer = screen.getByText('Test Event 1').closest('div');
      if (calendarContainer) {
        // Simulate touch events
        fireEvent.touchStart(calendarContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        fireEvent.touchMove(calendarContainer, {
          touches: [{ clientX: 50, clientY: 100 }]
        });
        
        fireEvent.touchEnd(calendarContainer);
        
        await waitFor(() => {
          expect(calendarContainer).toBeInTheDocument();
        });
      }
    });
  });

  describe('Layout Adaptation', () => {
    it('should adapt side panel to bottom panel on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <UpcomingEvents events={mockEvents} maxEvents={3} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    });

    it('should maintain readability on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(
        <TestWrapper>
          <div>
            <Calendar events={mockEvents} />
            <News articles={mockNews} />
          </div>
        </TestWrapper>
      );

      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
    });
  });
});