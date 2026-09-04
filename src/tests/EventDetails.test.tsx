import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../utils/ThemeContext';
import EventDetails from '../components/EventDetails';
import { vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ eventId: 'diversions-game-night' }),
  useNavigate: () => mockNavigate,
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}));

const event = {
  meta: {
    title: 'Pathfinder Society at Diversions',
    date: '2025-06-25',
    location: 'Diversions',
    address: '119 2nd St #300, Coralville, IA 52241',
    startTime: '17:30',
    endTime: '21:30',
    playerCap: 6,
    intro: 'Join us for Pathfinder Society games at Diversions in Coralville!',
    scenarios: [
      {
        name: "Catastrophe's Spark",
        system: 'Pathfinder',
        type: 'Scenario',
        levels: '1-4',
        signupUrl: 'https://example.com/spark',
      },
      {
        name: 'Nova Rush',
        system: 'Starfinder',
        gamemaster: 'Scott L',
        cancelled: true,
      },
    ],
  },
  content: '\n## Character Requirements\n\nBring a level 2 character.\n',
  slug: 'diversions-game-night',
  directory: 'calendar',
};

const mockEvents = vi.fn();
vi.mock('../utils/staticData', () => ({
  getCalendarEvents: () => mockEvents(),
}));

const renderDetails = () =>
  render(
    <ThemeProvider>
      <EventDetails />
    </ThemeProvider>
  );

describe('EventDetails Component', () => {
  beforeEach(() => {
    mockEvents.mockReset();
    mockEvents.mockResolvedValue([event]);
  });

  test('renders the back button', async () => {
    renderDetails();
    expect(screen.getByText(/Back to Calendar/i)).toBeInTheDocument();
  });

  test('renders the title and intro from front-matter', async () => {
    renderDetails();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Pathfinder Society at Diversions/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Join us for Pathfinder Society games/i)).toBeInTheDocument();
  });

  test('renders structured details rather than prose', async () => {
    renderDetails();

    await waitFor(() => expect(screen.getByText(/Wednesday, June 25, 2025/)).toBeInTheDocument());
    expect(screen.getByText(/5:30 PM - 9:30 PM/)).toBeInTheDocument();
    // "Diversions" also appears in the title and intro, so scope to the bullet.
    expect(screen.getByText('Location:').closest('li')).toHaveTextContent('Diversions');
    // Regression: the full address, not the "119 2nd St" that unquoted YAML
    // truncated it to.
    expect(screen.getByText(/119 2nd St #300, Coralville, IA 52241/)).toBeInTheDocument();
    // The registration note mentions the cap too, so scope to the bullet.
    expect(screen.getByText('Players:').closest('li')).toHaveTextContent('6 players');
  });

  test('renders each scenario with its tags', async () => {
    renderDetails();

    await waitFor(() => expect(screen.getByText("Catastrophe's Spark")).toBeInTheDocument());
    expect(screen.getByText(/Pathfinder Scenario, Levels 1-4/)).toBeInTheDocument();
    expect(screen.getByText(/GM: Scott L/)).toBeInTheDocument();
  });

  test('links a bookable scenario with the expected accessible name', async () => {
    renderDetails();

    // e2e/mobile-layout.spec.ts locates the tap target by this name.
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /sign up here/i });
      expect(link).toHaveAttribute('href', 'https://example.com/spark');
    });
  });

  test('marks a cancelled scenario instead of linking it', async () => {
    renderDetails();

    await waitFor(() => expect(screen.getByText(/— Cancelled/i)).toBeInTheDocument());
    // Only the un-cancelled scenario offers a signup link.
    expect(screen.getAllByRole('link', { name: /sign up here/i })).toHaveLength(1);
  });

  test('regenerates the registration note from the player cap', async () => {
    renderDetails();
    await waitFor(() =>
      expect(
        screen.getByText(/Please register in advance using the link above\. Space is limited to 6 players/)
      ).toBeInTheDocument()
    );
  });

  test('still renders leftover markdown body sections', async () => {
    renderDetails();
    await waitFor(() =>
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Character Requirements')
    );
  });

  test('shows a cancellation banner for a cancelled event', async () => {
    mockEvents.mockResolvedValue([
      { ...event, meta: { ...event.meta, cancelled: true } },
    ]);
    renderDetails();

    await waitFor(() =>
      expect(screen.getByText(/This event has been cancelled/i)).toBeInTheDocument()
    );
  });

  test('renders an all-day event without inventing times', async () => {
    mockEvents.mockResolvedValue([
      {
        ...event,
        meta: { ...event.meta, allDay: true, startTime: undefined, endTime: undefined },
      },
    ]);
    renderDetails();

    await waitFor(() => expect(screen.getByText(/All day/)).toBeInTheDocument());
    expect(screen.queryByText(/5:30 PM/)).not.toBeInTheDocument();
  });

  test('renders an event with no scenarios without a registration note', async () => {
    mockEvents.mockResolvedValue([
      { ...event, meta: { ...event.meta, scenarios: undefined } },
    ]);
    renderDetails();

    await waitFor(() => expect(screen.getByText(/Wednesday, June 25, 2025/)).toBeInTheDocument());
    expect(screen.queryByText(/Please register in advance/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sign up here/i })).not.toBeInTheDocument();
  });

  test('reports a missing event', async () => {
    mockEvents.mockResolvedValue([]);
    renderDetails();

    await waitFor(() => expect(screen.getByText(/Event Not Found/i)).toBeInTheDocument());
  });
});
