import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpcomingEvents from '../components/UpcomingEvents';
import { CalendarEvent } from '../types';
import { ThemeProvider } from '../utils/ThemeContext';

// Mock theme context
const mockTheme = {
  name: 'medieval' as const,
  colors: {
    primary: '#8B4513',
    secondary: '#D2691E',
    background: '#F5E6D3',
    text: '#2F1B14',
    accent: '#CD853F'
  },
  fonts: {
    heading: 'Cinzel',
    body: 'Crimson Text'
  },
  components: {
    button: 'medieval-button',
    card: 'medieval-card',
    panel: 'medieval-panel',
    container: 'medieval-container'
  }
};

const mockThemeContext = {
  currentTheme: mockTheme,
  availableThemes: [mockTheme],
  setTheme: jest.fn()
};

// Mock useTheme hook
jest.mock('../utils/ThemeContext', () => ({
  useTheme: () => mockThemeContext,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Helper function to create test events
const createTestEvent = (id: string, title: string, daysFromNow: number, gameType: 'Pathfinder' | 'Starfinder' | 'Legacy' = 'Pathfinder'): CalendarEvent => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(19, 0, 0, 0); // 7 PM
  
  // For "today" events, make sure they're in the future
  if (daysFromNow === 0) {
    date.setHours(23, 59, 59, 999); // End of today
  }
  
  return {
    id,
    title,
    date,
    description: `Test event description for ${title}`,
    content: `Full content for ${title}`,
    gameType,
    gamemaster: 'Test GM',
    maxPlayers: 6
  };
};

describe('UpcomingEvents Component', () => {
  const mockEvents: CalendarEvent[] = [
    createTestEvent('1', 'Event Today', 0),
    createTestEvent('2', 'Event Tomorrow', 1),
    createTestEvent('3', 'Event Next Week', 7, 'Starfinder'),
    createTestEvent('4', 'Event Next Month', 30, 'Legacy'),
    createTestEvent('5', 'Past Event', -1), // This should be filtered out
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Filtering and Sorting', () => {
    it('should filter out past events and show only upcoming events', () => {
      render(<UpcomingEvents events={mockEvents} maxEvents={5} />);
      
      // Should show 4 upcoming events (excluding the past event)
      expect(screen.getByText('Event Today')).toBeInTheDocument();
      expect(screen.getByText('Event Tomorrow')).toBeInTheDocument();
      expect(screen.getByText('Event Next Week')).toBeInTheDocument();
      expect(screen.getByText('Event Next Month')).toBeInTheDocument();
      expect(screen.queryByText('Past Event')).not.toBeInTheDocument();
    });

    it('should sort events chronologically with nearest event first', () => {
      render(<UpcomingEvents events={mockEvents} maxEvents={5} />);
      
      const eventItems = screen.getAllByRole('button');
      const eventTitles = eventItems.map(item => 
        item.querySelector('.event-title')?.textContent
      );
      
      expect(eventTitles).toEqual([
        'Event Today',
        'Event Tomorrow', 
        'Event Next Week',
        'Event Next Month'
      ]);
    });

    it('should limit events to maxEvents parameter', () => {
      render(<UpcomingEvents events={mockEvents} maxEvents={2} />);
      
      const eventItems = screen.getAllByRole('button');
      expect(eventItems).toHaveLength(2);
      
      expect(screen.getByText('Event Today')).toBeInTheDocument();
      expect(screen.getByText('Event Tomorrow')).toBeInTheDocument();
      expect(screen.queryByText('Event Next Week')).not.toBeInTheDocument();
    });

    it('should show "more events" indicator when there are additional events', () => {
      render(<UpcomingEvents events={mockEvents} maxEvents={2} />);
      
      expect(screen.getByText('+ 2 more upcoming events')).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    it('should display event information correctly', () => {
      const testEvents = [createTestEvent('test', 'Test Event', 1, 'Starfinder')];
      render(<UpcomingEvents events={testEvents} maxEvents={3} />);
      
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      expect(screen.getByText('7:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Starfinder')).toBeInTheDocument();
      expect(screen.getByText('GM: Test GM')).toBeInTheDocument();
      expect(screen.getByText('Max: 6')).toBeInTheDocument();
      expect(screen.getByText('Test event description for Test Event')).toBeInTheDocument();
    });

    it('should format dates correctly for different time periods', () => {
      const testEvents = [
        createTestEvent('today', 'Today Event', 0),
        createTestEvent('tomorrow', 'Tomorrow Event', 1),
        createTestEvent('week', 'Week Event', 3),
        createTestEvent('month', 'Month Event', 45)
      ];
      
      render(<UpcomingEvents events={testEvents} maxEvents={5} />);
      
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      expect(screen.getByText('In 3 days')).toBeInTheDocument();
      
      // For dates more than a week away, should show formatted date
      const monthEvent = screen.getByText('Month Event').closest('.upcoming-event-item');
      expect(monthEvent).toBeInTheDocument();
    });

    it('should show "Next" badge for the first upcoming event', () => {
      render(<UpcomingEvents events={mockEvents} maxEvents={3} />);
      
      const firstEvent = screen.getByText('Event Today').closest('.upcoming-event-item');
      expect(firstEvent?.querySelector('.next-event-badge')).toHaveTextContent('Next');
      
      const secondEvent = screen.getByText('Event Tomorrow').closest('.upcoming-event-item');
      expect(secondEvent?.querySelector('.next-event-badge')).toBeNull();
    });

    it('should apply correct game type styling', () => {
      const testEvents = [
        createTestEvent('pf', 'Pathfinder Event', 1, 'Pathfinder'),
        createTestEvent('sf', 'Starfinder Event', 2, 'Starfinder'),
        createTestEvent('lg', 'Legacy Event', 3, 'Legacy')
      ];
      
      render(<UpcomingEvents events={testEvents} maxEvents={5} />);
      
      expect(screen.getByText('Pathfinder')).toHaveClass('pathfinder');
      expect(screen.getByText('Starfinder')).toHaveClass('starfinder');
      expect(screen.getByText('Legacy')).toHaveClass('legacy');
    });
  });

  describe('Event Interaction', () => {
    it('should handle click events on event items', async () => {
      const testEvents = [createTestEvent('clickable', 'Clickable Event', 1)];
      
      // Mock the custom event dispatch
      const mockDispatchEvent = jest.fn();
      const mockQuerySelector = jest.spyOn(document, 'querySelector').mockReturnValue({
        dispatchEvent: mockDispatchEvent
      } as any);
      
      render(<UpcomingEvents events={testEvents} maxEvents={3} />);
      
      const eventItem = screen.getByRole('button');
      fireEvent.click(eventItem);
      
      await waitFor(() => {
        expect(mockQuerySelector).toHaveBeenCalledWith('[data-event-id="clickable"]');
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'eventSelect',
            detail: expect.objectContaining({
              id: 'clickable',
              title: 'Clickable Event'
            })
          })
        );
      });
      
      mockQuerySelector.mockRestore();
    });

    it('should handle keyboard navigation (Enter and Space)', async () => {
      const testEvents = [createTestEvent('keyboard', 'Keyboard Event', 1)];
      
      const mockDispatchEvent = jest.fn();
      const mockQuerySelector = jest.spyOn(document, 'querySelector').mockReturnValue({
        dispatchEvent: mockDispatchEvent
      } as any);
      
      render(<UpcomingEvents events={testEvents} maxEvents={3} />);
      
      const eventItem = screen.getByRole('button');
      
      // Test Enter key
      fireEvent.keyDown(eventItem, { key: 'Enter' });
      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalled();
      });
      
      // Test Space key
      fireEvent.keyDown(eventItem, { key: ' ' });
      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
      });
      
      // Test other keys (should not trigger)
      mockDispatchEvent.mockClear();
      fireEvent.keyDown(eventItem, { key: 'Tab' });
      expect(mockDispatchEvent).not.toHaveBeenCalled();
      
      mockQuerySelector.mockRestore();
    });

    it('should have proper accessibility attributes', () => {
      const testEvents = [createTestEvent('accessible', 'Accessible Event', 1)];
      render(<UpcomingEvents events={testEvents} maxEvents={3} />);
      
      const eventItem = screen.getByRole('button');
      expect(eventItem).toHaveAttribute('tabIndex', '0');
      expect(eventItem).toHaveAttribute('data-event-id', 'accessible');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no upcoming events exist', () => {
      const pastEvents = [createTestEvent('past', 'Past Event', -5)];
      render(<UpcomingEvents events={pastEvents} maxEvents={3} />);
      
      expect(screen.getByText('No upcoming events scheduled.')).toBeInTheDocument();
      expect(screen.getByText('Check back soon for new gaming sessions!')).toBeInTheDocument();
      expect(screen.queryByText('Past Event')).not.toBeInTheDocument();
    });

    it('should show empty state when events array is empty', () => {
      render(<UpcomingEvents events={[]} maxEvents={3} />);
      
      expect(screen.getByText('No upcoming events scheduled.')).toBeInTheDocument();
      expect(screen.getByText('Check back soon for new gaming sessions!')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render with correct CSS classes and theme', () => {
      render(<UpcomingEvents events={mockEvents} maxEvents={3} />);
      
      const container = screen.getByText('Upcoming Events').closest('.upcoming-events-container');
      expect(container).toHaveClass('medieval-panel');
      
      const title = screen.getByText('Upcoming Events');
      expect(title).toHaveClass('upcoming-events-title');
    });

    it('should show event count in title', () => {
      render(<UpcomingEvents events={mockEvents} maxEvents={3} />);
      
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });

    it('should not show event count when no events', () => {
      render(<UpcomingEvents events={[]} maxEvents={3} />);
      
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain proper structure for mobile layout', () => {
      render(<UpcomingEvents events={mockEvents} maxEvents={2} />);
      
      const eventItems = screen.getAllByRole('button');
      eventItems.forEach(item => {
        expect(item).toHaveClass('upcoming-event-item');
        expect(item.querySelector('.event-date-info')).toBeInTheDocument();
        expect(item.querySelector('.event-details')).toBeInTheDocument();
        expect(item.querySelector('.event-action-indicator')).toBeInTheDocument();
      });
    });
  });
});