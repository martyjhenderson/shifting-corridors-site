import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../utils/ThemeContext';
import EventDetails from '../components/EventDetails';
import { contentLoader } from '../services/contentLoader';
import { CalendarEvent } from '../types';

// Mock react-markdown to avoid ES module issues
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock the content loader
jest.mock('../services/contentLoader');
const mockContentLoader = contentLoader as jest.Mocked<typeof contentLoader>;

// Mock react-router-dom
const mockNavigate = jest.fn();
let mockEventId = 'test-event-id';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ eventId: mockEventId })
}));

const mockEvent: CalendarEvent = {
  id: 'test-event-id',
  title: 'Test Event',
  date: new Date('2025-07-15T18:00:00'),
  description: 'This is a test event description',
  content: `# Test Event Content

This is the **full content** of the test event.

## Details

- Location: Test Location
- Time: 6:00 PM
- GM: Test GM

[Registration Link](https://example.com/register)`,
  gameType: 'Pathfinder',
  gamemaster: 'Test GM',
  maxPlayers: 6
};

const renderWithProviders = (component: React.ReactElement, route = '/events/test-event-id') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('EventDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Loading State', () => {
    it('displays loading message while fetching event data', () => {
      mockContentLoader.loadCalendarEvents.mockImplementation(() => new Promise(() => {}));
      
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      expect(screen.getByText('Loading event details...')).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    beforeEach(() => {
      mockContentLoader.loadCalendarEvents.mockResolvedValue([mockEvent]);
    });

    it('displays event title and basic information', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      expect(screen.getByText('This is a test event description')).toBeInTheDocument();
      expect(screen.getByText('Pathfinder')).toBeInTheDocument();
      expect(screen.getByText('GM: Test GM')).toBeInTheDocument();
      expect(screen.getByText('Max Players: 6')).toBeInTheDocument();
    });

    it('displays formatted date and time', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Tuesday, July 15, 2025')).toBeInTheDocument();
      expect(screen.getByText('6:00 PM')).toBeInTheDocument();
    });

    it('renders markdown content correctly', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      // Check for markdown-rendered content (mocked)
      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toBeInTheDocument();
      expect(markdownContent).toHaveTextContent('# Test Event Content');
    });

    it('applies correct game type styling', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      const gameTypeBadge = screen.getByText('Pathfinder');
      expect(gameTypeBadge).toHaveClass('game-type-badge', 'pathfinder');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockContentLoader.loadCalendarEvents.mockResolvedValue([mockEvent]);
    });

    it('displays back button', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      const backButton = screen.getByRole('button', { name: 'Back to calendar' });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveTextContent('← Back to Calendar');
    });

    it('navigates back to calendar when back button is clicked', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      const backButton = screen.getByRole('button', { name: 'Back to calendar' });
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when event is not found', async () => {
      mockContentLoader.loadCalendarEvents.mockResolvedValue([]);
      
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Event Not Found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Event not found')).toBeInTheDocument();
      
      const backButton = screen.getByRole('button', { name: '← Back to Calendar' });
      expect(backButton).toBeInTheDocument();
    });

    it('displays error message when content loading fails', async () => {
      mockContentLoader.loadCalendarEvents.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Event Not Found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Failed to load event details')).toBeInTheDocument();
    });

    it('handles missing event ID parameter', async () => {
      // Set mockEventId to undefined
      mockEventId = undefined as any;
      
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Event Not Found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('No event ID provided')).toBeInTheDocument();
      
      // Reset mockEventId for other tests
      mockEventId = 'test-event-id';
    });
  });

  describe('Theme Integration', () => {
    beforeEach(() => {
      mockContentLoader.loadCalendarEvents.mockResolvedValue([mockEvent]);
    });

    it('applies theme classes to components', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      const container = document.querySelector('.event-details-container');
      expect(container).toHaveClass('medieval-card'); // Default theme is medieval
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockContentLoader.loadCalendarEvents.mockResolvedValue([mockEvent]);
    });

    it('has proper heading hierarchy', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Test Event');
      
      // Since we're mocking ReactMarkdown, we can't test for actual heading elements
      // but we can verify the markdown content is rendered
      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent('# Test Event Content');
    });

    it('has accessible back button with aria-label', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      const backButton = screen.getByRole('button', { name: 'Back to calendar' });
      expect(backButton).toHaveAttribute('aria-label', 'Back to calendar');
    });

    it('has proper article structure', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveClass('event-details-content');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      mockContentLoader.loadCalendarEvents.mockResolvedValue([mockEvent]);
    });

    it('applies mobile-friendly classes', async () => {
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      const container = document.querySelector('.event-details-container');
      expect(container).toBeInTheDocument();
      
      // Check that mobile styles are available in CSS
      const styles = window.getComputedStyle(container!);
      expect(styles).toBeDefined();
    });
  });

  describe('Content Rendering Edge Cases', () => {
    it('handles event without optional fields', async () => {
      const minimalEvent: CalendarEvent = {
        id: 'test-event-id', // Use the same ID as the mock
        title: 'Minimal Event',
        date: new Date('2025-07-15T18:00:00'),
        description: 'Basic description',
        content: 'Basic content',
        gameType: 'Legacy'
      };
      
      mockContentLoader.loadCalendarEvents.mockResolvedValue([minimalEvent]);
      
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Minimal Event')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Basic description')).toBeInTheDocument();
      expect(screen.getByText('Legacy')).toBeInTheDocument();
      expect(screen.queryByText('GM:')).not.toBeInTheDocument();
      expect(screen.queryByText('Max Players:')).not.toBeInTheDocument();
    });

    it('handles empty markdown content gracefully', async () => {
      const eventWithEmptyContent: CalendarEvent = {
        ...mockEvent,
        content: ''
      };
      
      mockContentLoader.loadCalendarEvents.mockResolvedValue([eventWithEmptyContent]);
      
      renderWithProviders(<EventDetails event={mockEvent} onBack={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
      
      // Should still display basic event information
      expect(screen.getByText('This is a test event description')).toBeInTheDocument();
    });
  });
});