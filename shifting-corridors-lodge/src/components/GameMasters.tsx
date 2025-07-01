import React, { useState, useEffect } from 'react';
import { useTheme } from '../utils/ThemeContext';
import { getMarkdownFiles } from '../utils/markdown/markdownUtils';

interface GameMaster {
  firstName: string;
  lastInitial: string;
  organizedPlayNumber: string;
  games: string[];
  content: string;
}

const GameMasters: React.FC = () => {
  const { currentTheme } = useTheme();
  const [gameMasters, setGameMasters] = useState<GameMaster[]>([]);

  useEffect(() => {
    const loadGameMasters = async () => {
      try {
        const files = await getMarkdownFiles('gamemasters');
        const gms: GameMaster[] = files.map(file => ({
          firstName: file.meta.firstName || 'Unknown',
          lastInitial: file.meta.lastInitial || '',
          organizedPlayNumber: file.meta.organizedPlayNumber || '',
          games: file.meta.games || [],
          content: file.content
        }));
        setGameMasters(gms);
      } catch (error) {
        console.error('Error loading game masters:', error);
      }
    };

    loadGameMasters();
  }, []);

  return (
    <div className={`gamemasters-container ${currentTheme.components.card}`}>
      <h2>Game Masters</h2>
      <div className="gm-list">
        {gameMasters.map((gm, index) => (
          <div key={index} className="gm-item">
            <h3 className="gm-name">
              {gm.firstName} {gm.lastInitial}.
            </h3>
            <p className="gm-number">
              Organized Play #: {gm.organizedPlayNumber}
            </p>
            <div className="gm-games">
              <strong>Games:</strong> {gm.games.join(', ')}
            </div>
            <div className="gm-bio">
              {gm.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameMasters;