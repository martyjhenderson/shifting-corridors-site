import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './utils/ThemeContext';
import App from './App';

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
      <div>Contact Us</div>
      <a href="mailto:lodge@shiftingcorridors.com">lodge@shiftingcorridors.com</a>
    </div>
  );
  return MockContact;
});

// Mock EventDetails component
jest.mock('./components/EventDetails', () => {
  const MockEventDetails = () => <div>Event Details</div>;
  return MockEventDetails;
});

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ path, element }) => <div data-path={path}>{element}</div>,
  Link: ({ children }) => <a>{children}</a>,
  useParams: () => ({ eventId: 'test-event' })
}));

describe('App Component', () => {
  test('renders Shifting Corridors Lodge title', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    const titleElement = screen.getByText(/Shifting Corridors Lodge/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders theme toggle button', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    const buttonElement = screen.getByText(/Switch to Sci-Fi Theme/i);
    expect(buttonElement).toBeInTheDocument();
  });

  test('renders calendar component', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    const calendarElement = screen.getByText(/Event Calendar/i);
    expect(calendarElement).toBeInTheDocument();
  });

  test('renders news component', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    const newsElement = screen.getByText(/Latest News/i);
    expect(newsElement).toBeInTheDocument();
  });

  test('renders game masters component', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    const gmElement = screen.getByText(/Game Masters/i);
    expect(gmElement).toBeInTheDocument();
  });

  test('renders contact component', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    const contactElement = screen.getByText(/Contact Us/i);
    expect(contactElement).toBeInTheDocument();
    const emailElement = screen.getByText(/lodge@shiftingcorridors.com/i);
    expect(emailElement).toBeInTheDocument();
  });
});