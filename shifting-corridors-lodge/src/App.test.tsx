import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './utils/ThemeContext';
import { ContentProvider } from './utils/ContentContext';
import App from './App';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useParams: () => ({ eventId: 'test-event' }),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>
}));

// Mock content loader
jest.mock('./services/contentLoader', () => ({
  contentLoader: {
    loadCalendarEvents: jest.fn().mockResolvedValue([]),
    loadGameMasters: jest.fn().mockResolvedValue([]),
    loadNewsArticles: jest.fn().mockResolvedValue([]),
  }
}));

// Mock the components
jest.mock('./components/Calendar', () => {
  const MockCalendar = () => <div>Event Calendar</div>;
  return MockCalendar;
});

jest.mock('./components/News', () => {
  const MockNews = () => <div>Latest News</div>;
  return MockNews;
});

jest.mock('./components/GameMasters', () => {
  const MockGameMasters = () => <div>Game Masters</div>;
  return MockGameMasters;
});

jest.mock('./components/Contact', () => {
  const MockContact = () => (
    <div>
      <div>Contact Information</div>
      <a href="mailto:lodge@shiftingcorridor.com">lodge@shiftingcorridor.com</a>
    </div>
  );
  return MockContact;
});

jest.mock('./components/EventDetails', () => {
  const MockEventDetails = () => <div>Event Details</div>;
  return MockEventDetails;
});

const renderApp = () => {
  return render(
    <ThemeProvider>
      <ContentProvider>
        <App />
      </ContentProvider>
    </ThemeProvider>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test('renders Shifting Corridors Lodge title', () => {
    renderApp();
    const titleElement = screen.getByText(/Shifting Corridors Lodge/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders theme toggle button', () => {
    renderApp();
    const selectorElement = screen.getByText(/Choose Theme:/i);
    expect(selectorElement).toBeInTheDocument();
  });

  test('renders calendar component', () => {
    renderApp();
    const calendarElement = screen.getByText(/Event Calendar/i);
    expect(calendarElement).toBeInTheDocument();
  });

  test('renders news component', () => {
    renderApp();
    const newsElement = screen.getByText(/Latest News/i);
    expect(newsElement).toBeInTheDocument();
  });

  test('renders game masters component', () => {
    renderApp();
    const gmElement = screen.getByText(/Game Masters/i);
    expect(gmElement).toBeInTheDocument();
  });

  test('renders contact component', () => {
    renderApp();
    const contactElement = screen.getByText(/Contact Information/i);
    expect(contactElement).toBeInTheDocument();
    const emailElement = screen.getByText(/lodge@shiftingcorridor.com/i);
    expect(emailElement).toBeInTheDocument();
  });
});