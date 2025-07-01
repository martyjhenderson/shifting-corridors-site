// Theme CSS variable definitions and utility functions

export const applyThemeVariables = (theme: 'medieval' | 'sci-fi') => {
  const root = document.documentElement;
  
  if (theme === 'medieval') {
    root.style.setProperty('--color-primary', '#8B4513');
    root.style.setProperty('--color-secondary', '#D2691E');
    root.style.setProperty('--color-background', '#F5E6D3');
    root.style.setProperty('--color-text', '#2F1B14');
    root.style.setProperty('--color-accent', '#CD853F');
    root.style.setProperty('--font-heading', '"Cinzel", serif');
    root.style.setProperty('--font-body', '"Crimson Text", serif');
  } else if (theme === 'sci-fi') {
    root.style.setProperty('--color-primary', '#00CED1');
    root.style.setProperty('--color-secondary', '#4169E1');
    root.style.setProperty('--color-background', '#0F0F23');
    root.style.setProperty('--color-text', '#E0E0E0');
    root.style.setProperty('--color-accent', '#FF6347');
    root.style.setProperty('--font-heading', '"Orbitron", sans-serif');
    root.style.setProperty('--font-body', '"Exo 2", sans-serif');
  }
};

// CSS class names for theme-specific components
export const themeClasses = {
  medieval: {
    button: 'medieval-button',
    card: 'medieval-card',
    panel: 'medieval-panel',
    container: 'medieval-container'
  },
  'sci-fi': {
    button: 'sci-fi-button',
    card: 'sci-fi-card',
    panel: 'sci-fi-panel',
    container: 'sci-fi-container'
  }
};