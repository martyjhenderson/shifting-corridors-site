import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeContext as ThemeContextType } from '../types';

// Theme configurations
const medievalTheme: Theme = {
  name: 'medieval',
  colors: {
    primary: '#8B4513',
    secondary: '#D2691E',
    background: '#F5E6D3',
    text: '#2F1B14',
    accent: '#CD853F'
  },
  fonts: {
    heading: '"Cinzel", serif',
    body: '"Crimson Text", serif'
  },
  components: {
    button: 'medieval-button',
    card: 'medieval-card',
    panel: 'medieval-panel',
    container: 'medieval-container'
  }
};

const sciFiTheme: Theme = {
  name: 'sci-fi',
  colors: {
    primary: '#00CED1',
    secondary: '#4169E1',
    background: '#0F0F23',
    text: '#E0E0E0',
    accent: '#FF6347'
  },
  fonts: {
    heading: '"Orbitron", sans-serif',
    body: '"Exo 2", sans-serif'
  },
  components: {
    button: 'sci-fi-button',
    card: 'sci-fi-card',
    panel: 'sci-fi-panel',
    container: 'sci-fi-container'
  }
};

const availableThemes: Theme[] = [medievalTheme, sciFiTheme];

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(medievalTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('lodge-theme');
    if (savedTheme) {
      const theme = availableThemes.find(t => t.name === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  // Apply theme CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', currentTheme.colors.primary);
    root.style.setProperty('--color-secondary', currentTheme.colors.secondary);
    root.style.setProperty('--color-background', currentTheme.colors.background);
    root.style.setProperty('--color-text', currentTheme.colors.text);
    root.style.setProperty('--color-accent', currentTheme.colors.accent);
    root.style.setProperty('--font-heading', currentTheme.fonts.heading);
    root.style.setProperty('--font-body', currentTheme.fonts.body);
    
    // Add theme class to body
    document.body.className = `theme-${currentTheme.name}`;
  }, [currentTheme]);

  const setTheme = (themeName: string) => {
    const theme = availableThemes.find(t => t.name === themeName);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('lodge-theme', themeName);
    }
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    availableThemes,
    setTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};