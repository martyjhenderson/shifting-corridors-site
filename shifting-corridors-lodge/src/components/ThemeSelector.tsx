import React from 'react';
import { useTheme } from '../utils/ThemeContext';

const ThemeSelector: React.FC = () => {
  const { currentTheme, availableThemes, setTheme } = useTheme();

  const handleThemeChange = (themeName: string) => {
    setTheme(themeName);
  };

  return (
    <div className="theme-selector">
      <label htmlFor="theme-select" className="theme-selector-label">
        Choose Theme:
      </label>
      <select
        id="theme-select"
        value={currentTheme.name}
        onChange={(e) => handleThemeChange(e.target.value)}
        className={`theme-selector-dropdown ${currentTheme.components.button}`}
        style={{ minHeight: '44px', touchAction: 'manipulation' }}
      >
        {availableThemes.map((theme) => (
          <option key={theme.name} value={theme.name}>
            {theme.name === 'medieval' ? 'Medieval Fantasy' : 'Sci-Fi Future'}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSelector;