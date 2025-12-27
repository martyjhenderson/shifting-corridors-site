import React, { useState, useEffect } from 'react';
import { useTheme } from '../utils/ThemeContext';
import styled from 'styled-components';
import { getGameMasters } from '../utils/staticData';

interface GameMaster {
  firstName: string;
  lastInitial: string;
  organizedPlayNumber: string;
  games: string[];
}

const StyledGameMastersContainer = styled.div<{ theme: any }>`
  padding: 20px;
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  h2 {
    font-family: ${props => props.theme.fonts.heading};
    color: ${props => props.theme.colors.primary};
    margin-bottom: 20px;
  }

  .gm-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }

  .gm-card {
    background-color: ${props => props.theme.colors.highlight};
    border-radius: 8px;
    padding: 15px;
    transition: transform 0.3s ease;
  }

  .gm-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .gm-name {
    font-family: ${props => props.theme.fonts.heading};
    color: ${props => props.theme.colors.secondary};
    font-size: 1.2rem;
    margin-bottom: 5px;
  }

  .gm-id {
    font-family: ${props => props.theme.fonts.main};
    color: ${props => props.theme.colors.text};
    margin-bottom: 10px;
  }

  .gm-games {
    margin-top: 10px;
  }

  .gm-games-title {
    font-weight: bold;
    margin-bottom: 5px;
  }

  .gm-game {
    background-color: ${props => props.theme.colors.accent};
    color: white;
    border-radius: 4px;
    padding: 3px 8px;
    margin-right: 5px;
    margin-bottom: 5px;
    display: inline-block;
    font-size: 0.9rem;
  }
`;

const GameMasters: React.FC = () => {
  const { theme } = useTheme();
  const [gameMasters, setGameMasters] = useState<GameMaster[]>([]);

  useEffect(() => {
    // Fetch game masters from static data
    const fetchGameMasters = async () => {
      try {
        console.log('GameMasters component: Fetching game masters...');
        // Get game masters from static data
        const markdownGMs = await getGameMasters();
        console.log('GameMasters component: Received markdown GMs:', markdownGMs);

        // Convert markdown GMs to game masters
        const gameMasters: GameMaster[] = markdownGMs.map(gm => {
          console.log(`Processing GM: ${gm.meta.firstName} ${gm.meta.lastInitial}`, gm.meta);
          return {
            firstName: gm.meta.firstName || '',
            lastInitial: gm.meta.lastInitial || '',
            organizedPlayNumber: gm.meta.organizedPlayNumber || '',
            games: gm.meta.games || [],
          };
        });

        console.log('GameMasters component: Processed game masters:', gameMasters);
        setGameMasters(gameMasters);
      } catch (error) {
        console.error('Error fetching game masters:', error);
      }
    };

    fetchGameMasters();
  }, []);

  return (
    <StyledGameMastersContainer theme={theme}>
      <h2>Game Masters</h2>
      <div className="gm-list">
        {gameMasters.map((gm, index) => (
          <div key={index} className="gm-card">
            <div className="gm-name">
              {gm.firstName} {gm.lastInitial}.
            </div>
            <div className="gm-id">
              Organized Play #: {gm.organizedPlayNumber}
            </div>
            <div className="gm-games">
              <div className="gm-games-title">Games:</div>
              {gm.games.map((game, gameIndex) => (
                <span key={gameIndex} className="gm-game">
                  {game}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </StyledGameMastersContainer>
  );
};

export default GameMasters;