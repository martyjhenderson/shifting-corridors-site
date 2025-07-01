import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../utils/ThemeContext';
import Calendar from '../components/Calendar';
import { CalendarEvent } from '../types';

// Mock the content loader
jest.mock('../services/contentLoader', () => ({
  contentLoader: {
    loadCalendarEvents: jest.fn()
  }
}));

import { contentLoader } from '../services/contentLoader';

const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Pathfinder Society Game',
    date: new Date('2025-07-13'),
    description: 'Join us for an exciting Pathfinder adventure',
    content: 'Full event content here',
    gameType: 'Pathfinder',
    gamemaster: 'Josh G.'
  },
  {
    id: 'event-2',
    title: 'Starfinder Society Game',
    date: new Date('2025-07-23'),
    description: 'Explore the galaxy in Starfinder',
    content: 'Full starfinder content here',
    gameType: 'Starfinder',
    gamemaster: 'Marty H.'
  }
];

const mockOnEventSelect = jest.fn();

describe('Calendar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);
  });

  test('renders calendar with current month', async () => {
    render(
      <ThemeProvider>
        <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    const currentDate = new Date();
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    await waitFor(() => {
      expect(screen.getByText(monthYear)).toBeInTheDocument();
    });
  });

  test('renders navigation buttons', async () => {
    render(
      <ThemeProvider>
        <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });
  });

  test('renders weekday headers', async () => {
    render(
      <ThemeProvider>
        <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });
  });

  test('displays upcoming events section', async () => {
    render(
      <ThemeProvider>
        <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      expect(screen.getByText('Pathfinder Society Game')).toBeInTheDocument();
      expect(screen.getByText('Starfinder Society Game')).toBeInTheDocument();
    });
  });

  test('calls onEventSelect when event is clicked', async () => {
    render(
      <ThemeProvider>
        <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      const eventElement = screen.getByText('Pathfinder Society Game');
      fireEvent.click(eventElement);
    });

    expect(mockOnEventSelect).toHaveBeenCalledWith(mockEvents[0]);
  });

  test('navigates to next month when next button is clicked', async () => {
    render(
      <ThemeProvider>
        <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthYear = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    await waitFor(() => {
      expect(screen.getByText(nextMonthYear)).toBeInTheDocument();
    });
  });

  test('navigates to previous month when previous button is clicked', async () => {
    render(
      <ThemeProvider>
        <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    const prevButton = screen.getByLabelText('Previous month');
    fireEvent.click(prevButton);

    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthYear = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    await waitFor(() => {
      expect(screen.getByText(prevMonthYear)).toBeInTheDocument();
    });
  });

  test('loads events from content loader when no events provided', async () => {
    render(
      <ThemeProvider>
        <Calendar events={[]} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(contentLoader.loadCalendarEvents).toHaveBeenCalled();
    });
  });

  test('displays loading state', () => {
    (contentLoader.loadCalendarEvents as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <ThemeProvider>
        <Calendar events={[]} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    expect(screen.getByText('Loading events...')).toBeInTheDocument();
  });

  test('displays error state and retry button', async () => {
    (contentLoader.loadCalendarEvents as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    render(
      <ThemeProvider>
        <Calendar events={[]} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load events')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  test('shows no events message when no upcoming events', async () => {
    // Mock empty events before rendering
    (contentLoader.loadCalendarEvents as jest.Mock).mockResolvedValue([]);

    render(
      <ThemeProvider>
        <Calendar events={[]} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No upcoming events scheduled.')).toBeInTheDocument();
    });
  });

  test('displays event indicators on calendar days with events', async () => {
    render(
      <ThemeProvider>
        <Calendar events={mockEvents} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Check if calendar grid is rendered
      const calendarGrid = document.querySelector('.calendar-grid');
      expect(calendarGrid).toBeInTheDocument();
    });
  });

  test('shows selected date events when date is clicked', async () => {
    // Create an event for today to test date selection
    const todayEvent: CalendarEvent = {
      id: 'today-event',
      title: 'Today Event',
      date: new Date(),
      description: 'Event happening today',
      content: 'Event content',
      gameType: 'Pathfinder'
    };

    render(
      <ThemeProvider>
        <Calendar events={[todayEvent]} onEventSelect={mockOnEventSelect} />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Find today's date in the calendar and click it
      const todayElement = document.querySelector('.calendar-day.today');
      if (todayElement) {
        fireEvent.click(todayElement);
      }
    });

    // Should call onEventSelect for single event on clicked date
    await waitFor(() => {
      expect(mockOnEventSelect).toHaveBeenCalledWith(todayEvent);
    });
  });
});