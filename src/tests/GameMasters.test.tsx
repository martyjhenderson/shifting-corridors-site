import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../utils/ThemeContext';
import GameMasters from '../components/GameMasters';

test('renders game masters component with title', () => {
  render(
    <ThemeProvider>
      <GameMasters />
    </ThemeProvider>
  );
  const titleElement = screen.getByText(/Game Masters/i);
  expect(titleElement).toBeInTheDocument();
});

test('displays Marty H in the game masters list', async () => {
  render(
    <ThemeProvider>
      <GameMasters />
    </ThemeProvider>
  );
  
  // Check if Marty H is displayed
  const martyElement = await screen.findByText(/Marty H/i);
  expect(martyElement).toBeInTheDocument();
  
  // Check if Marty's Organized Play number is displayed
  const opNumberElement = await screen.findByText(/30480/i);
  expect(opNumberElement).toBeInTheDocument();
});

test('displays game types for game masters', async () => {
  render(
    <ThemeProvider>
      <GameMasters />
    </ThemeProvider>
  );
  
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