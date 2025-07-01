import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../utils/ThemeContext';
import GameMasters from '../components/GameMasters';
import { GameMaster } from '../types';

// Mock the contentLoader service
jest.mock('../services/contentLoader', () => ({
  contentLoader: {
    loadGameMasters: jest.fn()
  }
}));

const mockGameMasters: GameMaster[] = [
  {
    id: 'marty-h',
    name: 'Marty H.',
    organizedPlayId: '30480',
    games: ['Pathfinder', 'Starfinder'],
    bio: 'Marty is the Corridor Venture-Lieutenant and a Game Master who runs scenarios for Pathfinder 2E and Starfinder 2E. He specializes in creating immersive roleplaying experiences and his collection of maps and lending of dice.'
  },
  {
    id: 'josh-g',
    name: 'Josh G.',
    organizedPlayId: '13151',
    games: ['Pathfinder'],
    bio: 'Josh is an experienced Game Master with a legacy of running games stretching back before Pathfinder existed. His sense of humor and desire to see the players laugh makes for a great experience.'
  }
];

describe('GameMasters Component', () => {
  beforeEach(() => {
    const { contentLoader } = require('../services/contentLoader');
    contentLoader.loadGameMasters.mockResolvedValue(mockGameMasters);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders game masters component with title', () => {
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    const titleElement = screen.getByText(/Game Masters/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('displays game masters in grid layout', () => {
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    // Check if both game masters are displayed
    expect(screen.getByText('Marty H.')).toBeInTheDocument();
    expect(screen.getByText('Josh G.')).toBeInTheDocument();
    
    // Check if organized play numbers are displayed
    expect(screen.getByText(/30480/)).toBeInTheDocument();
    expect(screen.getByText(/13151/)).toBeInTheDocument();
  });

  test('displays game types for each game master', () => {
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    // Check if games are displayed
    expect(screen.getByText(/Pathfinder, Starfinder/)).toBeInTheDocument();
    // Check for Josh's games (just Pathfinder)
    const joshGamesElement = screen.getByText('Josh G.').closest('.gm-card')?.querySelector('.gm-games');
    expect(joshGamesElement).toHaveTextContent('Games: Pathfinder');
  });

  test('shows bio preview with truncation', () => {
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    // Check if bio previews are shown (truncated)
    expect(screen.getByText(/Marty is the Corridor Venture-Lieutenant/)).toBeInTheDocument();
    expect(screen.getByText(/Josh is an experienced Game Master/)).toBeInTheDocument();
  });

  test('shows click hint for each game master card', () => {
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    const clickHints = screen.getAllByText('Click for full bio');
    expect(clickHints).toHaveLength(2);
  });

  test('calls onGameMasterSelect when card is clicked', () => {
    const mockOnSelect = jest.fn();
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={mockOnSelect} />
      </ThemeProvider>
    );
    
    const martyCard = screen.getByText('Marty H.').closest('.gm-card');
    fireEvent.click(martyCard!);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockGameMasters[0]);
  });

  test('shows detailed view when game master is selected', () => {
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    // Click on Marty's card
    const martyCard = screen.getByText('Marty H.').closest('.gm-card');
    fireEvent.click(martyCard!);
    
    // Check if detailed view is shown
    expect(screen.getByText('← Back to Game Masters')).toBeInTheDocument();
    expect(screen.getByText('Marty H.')).toBeInTheDocument();
    expect(screen.getByText(/He specializes in creating immersive roleplaying experiences/)).toBeInTheDocument();
  });

  test('returns to grid view when back button is clicked', () => {
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    // Click on a game master card to show detail view
    const martyCard = screen.getByText('Marty H.').closest('.gm-card');
    fireEvent.click(martyCard!);
    
    // Click back button
    const backButton = screen.getByText('← Back to Game Masters');
    fireEvent.click(backButton);
    
    // Check if we're back to grid view (multiple elements with this text)
    expect(screen.getAllByText('Click for full bio')).toHaveLength(2);
    expect(screen.queryByText('← Back to Game Masters')).not.toBeInTheDocument();
  });

  test('supports keyboard navigation', () => {
    const mockOnSelect = jest.fn();
    render(
      <ThemeProvider>
        <GameMasters gamemasters={mockGameMasters} onGameMasterSelect={mockOnSelect} />
      </ThemeProvider>
    );
    
    const martyCard = screen.getByText('Marty H.').closest('.gm-card');
    
    // Test Enter key
    fireEvent.keyDown(martyCard!, { key: 'Enter' });
    expect(mockOnSelect).toHaveBeenCalledWith(mockGameMasters[0]);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    
    // Test that other keys don't trigger the handler
    mockOnSelect.mockClear();
    fireEvent.keyDown(martyCard!, { key: 'Tab' });
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  test('loads game masters locally when no prop provided', async () => {
    const { contentLoader } = require('../services/contentLoader');
    
    render(
      <ThemeProvider>
        <GameMasters onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(contentLoader.loadGameMasters).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Marty H.')).toBeInTheDocument();
    });
  });

  test('shows loading state', () => {
    render(
      <ThemeProvider>
        <GameMasters onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Loading game masters...')).toBeInTheDocument();
  });

  test('shows error state when loading fails', async () => {
    const { contentLoader } = require('../services/contentLoader');
    contentLoader.loadGameMasters.mockRejectedValue(new Error('Failed to load'));
    
    render(
      <ThemeProvider>
        <GameMasters onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load game masters/)).toBeInTheDocument();
    });
  });

  test('shows no game masters message when list is empty', () => {
    render(
      <ThemeProvider>
        <GameMasters gamemasters={[]} onGameMasterSelect={jest.fn()} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('No game masters available at this time.')).toBeInTheDocument();
  });
});