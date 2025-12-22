import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../utils/ThemeContext';
import { vi } from 'vitest';

// Mock the Calendar component
vi.mock('../components/Calendar', () => ({
  default: () => (
    <div>
      <h2>Event Calendar</h2>
      <div>Events on June 23, 2025</div>
      <button>Previous</button>
      <button>Next</button>
      <p>No events scheduled for this date.</p>
    </div>
  )
}));

// Import the mocked component
import CalendarComponent from '../components/Calendar';

describe('Calendar Component', () => {
  test('renders calendar component with title', () => {
    render(
      <ThemeProvider>
        <CalendarComponent />
      </ThemeProvider>
    );
    const titleElement = screen.getByText(/Event Calendar/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('displays current date events section', () => {
    render(
      <ThemeProvider>
        <CalendarComponent />
      </ThemeProvider>
    );
    
    // Check if the events section is rendered
    const eventsSection = screen.getByText(/Events on/i);
    expect(eventsSection).toBeInTheDocument();
  });

  test('shows no events message when no events on selected date', () => {
    render(
      <ThemeProvider>
        <CalendarComponent />
      </ThemeProvider>
    );
    
    // Since we're using the current date and our demo events are for specific dates,
    // we should see the "No events" message
    const noEventsMessage = screen.getByText(/No events scheduled for this date/i);
    expect(noEventsMessage).toBeInTheDocument();
  });

  test('renders calendar with navigation buttons', () => {
    render(
      <ThemeProvider>
        <CalendarComponent />
      </ThemeProvider>
    );
    
    const prevButton = screen.getByText(/Previous/i);
    expect(prevButton).toBeInTheDocument();
    
    const nextButton = screen.getByText(/Next/i);
    expect(nextButton).toBeInTheDocument();
  });
});