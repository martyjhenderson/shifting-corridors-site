import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '../utils/ThemeContext';
import GameMasters from '../components/GameMasters';
import { vi } from 'vitest';

// Mock the markdown utils to prevent actual API calls in tests
vi.mock('../utils/markdown/markdownUtils', () => ({
  getMarkdownFiles: vi.fn().mockResolvedValue([
    {
      meta: {
        title: 'Game Master: Marty H.',
        date: '2025-06-23',
        firstName: 'Marty',
        lastInitial: 'H',
        organizedPlayNumber: '30480',
        games: ['Pathfinder', 'Starfinder']
      },
      content: 'Marty is the Corridor Venture-Lieutenant...',
      slug: 'marty-h'
    },
    {
      meta: {
        title: 'Game Master: Josh G.',
        date: '2025-06-23',
        firstName: 'Josh',
        lastInitial: 'G',
        organizedPlayNumber: '13151',
        games: ['Pathfinder']
      },
      content: 'Josh is an experienced Game Master...',
      slug: 'josh-g'
    }
  ])
}));

test('renders game masters component with title', async () => {
  await act(async () => {
    render(
      <ThemeProvider>
        <GameMasters />
      </ThemeProvider>
    );
  });
  
  const titleElement = screen.getByText(/Game Masters/i);
  expect(titleElement).toBeInTheDocument();
});

test('displays Marty H in the game masters list', async () => {
  await act(async () => {
    render(
      <ThemeProvider>
        <GameMasters />
      </ThemeProvider>
    );
  });
  
  // Check if Marty H is displayed
  const martyElement = await screen.findByText(/Marty H/i);
  expect(martyElement).toBeInTheDocument();
  
  // Check if Marty's Organized Play number is displayed
  const opNumberElement = await screen.findByText(/30480/i);
  expect(opNumberElement).toBeInTheDocument();
});

test('displays game types for game masters', async () => {
  await act(async () => {
    render(
      <ThemeProvider>
        <GameMasters />
      </ThemeProvider>
    );
  });
  
  // Check if Games sections are displayed (there will be multiple)
  const gamesTitles = await screen.findAllByText(/Games:/i);
  expect(gamesTitles.length).toBeGreaterThan(0);
  
  // Check if Pathfinder is listed as a game
  const pathfinderElements = await screen.findAllByText(/Pathfinder/i);
  expect(pathfinderElements.length).toBeGreaterThan(0);
  
  // Check if Starfinder is listed as a game
  const starfinderElements = await screen.findAllByText(/Starfinder/i);
  expect(starfinderElements.length).toBeGreaterThan(0);
});