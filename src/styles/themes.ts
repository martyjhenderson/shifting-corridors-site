export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    highlight: string;
  };
  fonts: {
    main: string;
    heading: string;
  };
}

export const medievalTheme: Theme = {
  name: 'medieval',
  colors: {
    primary: '#8B4513', // Brown
    secondary: '#A52A2A', // Deep Red
    background: '#FFF8E1', // Light Cream
    text: '#3E2723', // Dark Brown
    accent: '#DAA520', // Golden Yellow
    highlight: '#F9A825', // Amber
  },
  fonts: {
    main: "'Lora', serif",
    heading: "'Cinzel', serif",
  },
};

export const scifiTheme: Theme = {
  name: 'scifi',
  colors: {
    primary: '#1A237E', // Deep Blue
    secondary: '#FF5722', // Orange
    background: '#E8EAF6', // Light Blue Grey
    text: '#263238', // Dark Blue Grey
    accent: '#00BCD4', // Cyan
    highlight: '#4FC3F7', // Light Blue
  },
  fonts: {
    main: "'Roboto', sans-serif",
    heading: "'Orbitron', sans-serif",
  },
};