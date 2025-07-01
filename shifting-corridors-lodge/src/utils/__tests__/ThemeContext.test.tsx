import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component that uses the theme context
const TestComponent: React.FC = () => {
  const { currentTheme, availableThemes, setTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{currentTheme.name}</div>
      <div data-testid="available-themes">{availableThemes.length}</div>
      <button 
        data-testid="switch-theme" 
        onClick={() => setTheme(currentTheme.name === 'medieval' ? 'sci-fi' : 'medieval')}
      >
        Switch Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    // Reset document.documentElement.style
    document.documentElement.style.cssText = '';
    document.body.className = '';
  });

  it('provides default medieval theme when no saved theme exists', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('medieval');
    expect(screen.getByTestId('available-themes')).toHaveTextContent('2');
  });

  it('loads saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('sci-fi');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('sci-fi');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('lodge-theme');
  });

  it('switches themes and persists to localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initially medieval
    expect(screen.getByTestId('current-theme')).toHaveTextContent('medieval');

    // Switch to sci-fi
    act(() => {
      fireEvent.click(screen.getByTestId('switch-theme'));
    });

    expect(screen.getByTestId('current-theme')).toHaveTextContent('sci-fi');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lodge-theme', 'sci-fi');
  });

  it('applies CSS variables when theme changes', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check that medieval theme CSS variables are applied
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBe('#8B4513');
    expect(root.style.getPropertyValue('--color-background')).toBe('#F5E6D3');
    expect(document.body.className).toBe('theme-medieval');

    // Switch to sci-fi theme
    act(() => {
      fireEvent.click(screen.getByTestId('switch-theme'));
    });

    // Check that sci-fi theme CSS variables are applied
    expect(root.style.getPropertyValue('--color-primary')).toBe('#00CED1');
    expect(root.style.getPropertyValue('--color-background')).toBe('#0F0F23');
    expect(document.body.className).toBe('theme-sci-fi');
  });

  it('ignores invalid theme names', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should default to medieval when invalid theme is saved
    expect(screen.getByTestId('current-theme')).toHaveTextContent('medieval');
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleSpy.mockRestore();
  });

  it('provides correct theme configurations', () => {
    const ThemeTestComponent: React.FC = () => {
      const { currentTheme } = useTheme();
      
      return (
        <div>
          <div data-testid="theme-name">{currentTheme.name}</div>
          <div data-testid="has-colors">{currentTheme.colors ? 'true' : 'false'}</div>
          <div data-testid="has-fonts">{currentTheme.fonts ? 'true' : 'false'}</div>
          <div data-testid="has-components">{currentTheme.components ? 'true' : 'false'}</div>
          <div data-testid="primary-color">{currentTheme.colors.primary}</div>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );
    
    // Test medieval theme structure
    expect(screen.getByTestId('theme-name')).toHaveTextContent('medieval');
    expect(screen.getByTestId('has-colors')).toHaveTextContent('true');
    expect(screen.getByTestId('has-fonts')).toHaveTextContent('true');
    expect(screen.getByTestId('has-components')).toHaveTextContent('true');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#8B4513');
  });
});