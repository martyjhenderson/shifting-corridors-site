import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../utils/ThemeContext';
import EventDetails from '../components/EventDetails';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ eventId: 'diversions-game-night' }),
  useNavigate: () => mockNavigate
}));

// Mock the ReactMarkdown component
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock the markdown utils
jest.mock('../utils/markdown/markdownUtils', () => ({
  getMarkdownFiles: jest.fn().mockResolvedValue([
    {
      meta: {
        title: 'Pathfinder Society at Diversions',
        date: '2025-06-25',
        url: '/events/diversions-game-night',
        location: 'Diversions',
        address: '119 2nd St #300, Coralville, IA 52241'
      },
      content: '# Pathfinder Society at Diversions',
      slug: 'diversions-game-night'
    }
  ])
}));

describe('EventDetails Component', () => {
  test('renders event details with back button', async () => {
    render(
      <ThemeProvider>
        <EventDetails />
      </ThemeProvider>
    );
    
    // Check if the back button is rendered
    const backButton = screen.getByText(/Back to Calendar/i);
    expect(backButton).toBeInTheDocument();
    
    // Wait for the event details to be loaded
    await waitFor(() => {
      // Check if the event title is rendered
      const titleElement = screen.getByText(/Pathfinder Society at Diversions/i);
      expect(titleElement).toBeInTheDocument();
    });
    
    // Check if the special note is rendered
    const specialNoteElement = screen.getByText(/Please be aware that there is an entry fee to Diversions/i);
    expect(specialNoteElement).toBeInTheDocument();
  });
});