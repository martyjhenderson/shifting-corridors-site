import React, { useState, useEffect } from 'react';
import { useTheme } from '../utils/ThemeContext';
import { GameMaster, GameMastersProps } from '../types';
import { contentLoader } from '../services/contentLoader';
import { analyticsService } from '../services/analyticsService';

const GameMasters: React.FC<GameMastersProps> = ({ 
  gamemasters, 
  onGameMasterSelect 
} = {}) => {
  const { currentTheme } = useTheme();
  const [localGameMasters, setLocalGameMasters] = useState<GameMaster[]>([]);
  const [selectedGM, setSelectedGM] = useState<GameMaster | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use provided gamemasters prop or load them locally
  const displayGameMasters = gamemasters || localGameMasters;

  useEffect(() => {
    // Only load locally if no gamemasters prop provided
    if (!gamemasters) {
      const loadGameMasters = async () => {
        setLoading(true);
        setError(null);
        try {
          const gms = await contentLoader.loadGameMasters();
          setLocalGameMasters(gms);
        } catch (err) {
          console.error('Error loading game masters:', err);
          setError('Failed to load game masters. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      loadGameMasters();
    }
  }, [gamemasters]);

  const handleGameMasterClick = (gm: GameMaster) => {
    // Track GM profile view
    analyticsService.trackContentInteraction('gm', gm.id);
    
    setSelectedGM(gm);
    if (onGameMasterSelect) {
      onGameMasterSelect(gm);
    }
  };

  const handleBackClick = () => {
    setSelectedGM(null);
  };

  if (loading) {
    return (
      <div className={`gamemasters-container ${currentTheme.components.container}`}>
        <h2>Game Masters</h2>
        <div className="loading-message">Loading game masters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`gamemasters-container ${currentTheme.components.container}`}>
        <h2>Game Masters</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Show detailed view if a GM is selected
  if (selectedGM) {
    return (
      <div className={`gamemasters-container ${currentTheme.components.container}`}>
        <div className="gm-detail-header">
          <button 
            className={`back-button ${currentTheme.components.button}`}
            onClick={handleBackClick}
            aria-label="Back to game masters list"
          >
            ← Back to Game Masters
          </button>
        </div>
        <div className={`gm-detail ${currentTheme.components.card}`}>
          <h2 className="gm-detail-name">{selectedGM.name}</h2>
          <div className="gm-detail-info">
            <p className="gm-detail-number">
              <strong>Organized Play #:</strong> {selectedGM.organizedPlayId}
            </p>
            <div className="gm-detail-games">
              <strong>Games:</strong> {selectedGM.games.join(', ')}
            </div>
          </div>
          <div className="gm-detail-bio">
            {selectedGM.bio}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`gamemasters-container ${currentTheme.components.container}`}>
      <h2>Game Masters</h2>
      <div className="gm-grid">
        {displayGameMasters.map((gm) => (
          <div 
            key={gm.id} 
            className={`gm-card ${currentTheme.components.card}`}
            onClick={() => handleGameMasterClick(gm)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleGameMasterClick(gm);
              }
            }}
            aria-label={`View details for ${gm.name}`}
          >
            <h3 className="gm-name">{gm.name}</h3>
            <p className="gm-number">
              Organized Play #: {gm.organizedPlayId}
            </p>
            <div className="gm-games">
              <strong>Games:</strong> {gm.games.join(', ')}
            </div>
            <div className="gm-preview">
              {gm.bio.length > 100 ? `${gm.bio.substring(0, 100)}...` : gm.bio}
            </div>
            <div className="gm-click-hint">Click for full bio</div>
          </div>
        ))}
      </div>
      {displayGameMasters.length === 0 && (
        <div className="no-gamemasters">
          No game masters available at this time.
        </div>
      )}
    </div>
  );
};

export default GameMasters;