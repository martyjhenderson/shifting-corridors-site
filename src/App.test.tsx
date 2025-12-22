import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './utils/ThemeContext';
import App from './App';
import { vi } from 'vitest';

// Mock the components
vi.mock('./components/Calendar', () => ({
  default: () => <div>Event Calendar</div>
}));

vi.mock('./components/News', () => ({
  default: () => <div>Latest News</div>
}));

vi.mock('./components/GameMasters', () => ({
  default: () => <div>Game Masters</div>
}));

vi.mock('./components/Contact', () => ({
  default: () => (
    <div>
      <div>Contact Us</div>
      <a href="mailto:lodge@shiftingcorridor.com">lodge@shiftingcorridor.com</a>
    </div>
  )
}));

// Mock EventDetails component
vi.mock('./components/EventDetails', () => ({
  default: () => <div>Event Details</div>
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ path, element }: { path: string; element: React.ReactNode }) => <div data-path={path}>{element}</div>,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useParams: () => ({ eventId: 'test-event' })
}));

describe('App Component', () => {
  test('renders Shifting Corridors Lodge title', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    // Check for the logo alt text instead since the title text isn't directly visible
    const logoElement = screen.getByAltText(/Shifting Corridors Lodge Logo/i);
    expect(logoElement).toBeInTheDocument();
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
    const emailElement = screen.getByText(/lodge@shiftingcorridor.com/i);
    expect(emailElement).toBeInTheDocument();
  });
});