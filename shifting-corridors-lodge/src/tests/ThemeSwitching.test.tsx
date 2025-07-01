import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../utils/ThemeContext';
import { ContentProvider } from '../utils/ContentContext';
import App from '../App';
import ThemeSelector from '../components/ThemeSelector';

// Mock the content loader
jest.mock('../services/contentLoader', () => ({
  contentLoader: {
    loadCalendarEvents: jest.fn().mockResolvedValue([]),
    loadGameMasters: jest.fn().mockResolvedValue([]),
    loadNewsArticles: jest.fn().mockResolvedValue([]),
    clearCache: jest.fn()
  }
}));

// Mock analytics service
jest.mock('../services/analyticsService', () => ({
  analyticsService: {
    trackPageView: jest.fn(),
    trackEvent: jest.fn(),
    trackThemeSwitch: jest.fn(),
    trackContentInteraction: jest.fn()
  }
}));

import { analyticsService } from '../services/analyticsService';

// Test component to access theme context
const ThemeTestComponent: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{currentTheme}</div>
      <div data-testid="available-themes">{availableThemes.join(',')}</div>
      <button onClick={() => setTheme('medieval')} data-testid="set-medieval">
        Set Medieval
      </button>
      <button onClick={() => setTheme('sci-fi')} data-testid="set-scifi">
        Set Sci-Fi
      </button>
    </div>
  );
};

describe('End-to-End Theme Switching Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  test('theme selector component renders with correct options', async () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    // Should show theme selector
    expect(screen.getByText(/choose theme/i)).toBeInTheDocument();
    
    // Should show both theme options
    expect(screen.getByText(/medieval/i)).toBeInTheDocument();
    expect(screen.getByText(/sci-fi/i)).toBeInTheDocument();
  });

  test('theme switching updates context and persists to localStorage', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    // Should start with default theme (medieval)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('medieval');

    // Switch to sci-fi theme
    await user.click(screen.getByTestId('set-scifi'));

    // Should update context
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('sci-fi');
    });

    // Should persist to localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('selectedTheme', 'sci-fi');

    // Switch back to medieval
    await user.click(screen.getByTestId('set-medieval'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('medieval');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('selectedTheme', 'medieval');
  });

  test('theme switching tracks analytics events', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    // Find and click sci-fi theme option
    const sciFiOption = screen.getByDisplayValue('sci-fi');
    await user.click(sciFiOption);

    // Should track theme switch
    await waitFor(() => {
      expect(analyticsService.trackThemeSwitch).toHaveBeenCalledWith('sci-fi');
    });

    // Switch back to medieval
    const medievalOption = screen.getByDisplayValue('medieval');
    await user.click(medievalOption);

    await waitFor(() => {
      expect(analyticsService.trackThemeSwitch).toHaveBeenCalledWith('medieval');
    });
  });

  test('theme switching applies correct CSS classes to body', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    // Should start with medieval theme class
    expect(document.body).toHaveClass('theme-medieval');

    // Switch to sci-fi theme
    const sciFiOption = screen.getByDisplayValue('sci-fi');
    await user.click(sciFiOption);

    await waitFor(() => {
      expect(document.body).toHaveClass('theme-sci-fi');
      expect(document.body).not.toHaveClass('theme-medieval');
    });

    // Switch back to medieval
    const medievalOption = screen.getByDisplayValue('medieval');
    await user.click(medievalOption);

    await waitFor(() => {
      expect(document.body).toHaveClass('theme-medieval');
      expect(document.body).not.toHaveClass('theme-sci-fi');
    });
  });

  test('theme persistence loads from localStorage on app start', async () => {
    // Set up localStorage to return sci-fi theme
    (localStorage.getItem as jest.Mock).mockReturnValue('sci-fi');

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    // Should load sci-fi theme from localStorage
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('sci-fi');
    });

    expect(localStorage.getItem).toHaveBeenCalledWith('selectedTheme');
  });

  test('invalid theme in localStorage falls back to default', async () => {
    // Set up localStorage to return invalid theme
    (localStorage.getItem as jest.Mock).mockReturnValue('invalid-theme');

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    // Should fall back to default theme (medieval)
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('medieval');
    });
  });

  test('theme switching works in full app context', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Should start with medieval theme
    expect(document.body).toHaveClass('theme-medieval');

    // Find theme selector in the app
    const themeSelector = screen.getByRole('combobox', { name: /theme/i });
    expect(themeSelector).toBeInTheDocument();

    // Change to sci-fi theme
    await user.selectOptions(themeSelector, 'sci-fi');

    // Should apply sci-fi theme
    await waitFor(() => {
      expect(document.body).toHaveClass('theme-sci-fi');
      expect(document.body).not.toHaveClass('theme-medieval');
    });

    // Should track the theme switch
    expect(analyticsService.trackThemeSwitch).toHaveBeenCalledWith('sci-fi');
  });

  test('theme switching affects component styling', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(
        <ThemeProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </ThemeProvider>
      );
    });

    // Find a component that should have theme-specific styling
    const appContainer = document.querySelector('.app-container');
    expect(appContainer).toHaveClass('medieval-container');

    // Switch to sci-fi theme
    const themeSelector = screen.getByRole('combobox', { name: /theme/i });
    await user.selectOptions(themeSelector, 'sci-fi');

    // Should update component styling
    await waitFor(() => {
      expect(appContainer).toHaveClass('sci-fi-container');
      expect(appContainer).not.toHaveClass('medieval-container');
    });
  });

  test('theme switching is accessible via keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    const themeSelector = screen.getByRole('combobox', { name: /theme/i });
    
    // Focus the selector
    await user.tab();
    expect(themeSelector).toHaveFocus();

    // Use arrow keys to navigate options
    await user.keyboard('{ArrowDown}');
    
    // Should be able to select with Enter
    await user.keyboard('{Enter}');

    // Theme should change
    await waitFor(() => {
      expect(analyticsService.trackThemeSwitch).toHaveBeenCalled();
    });
  });

  test('theme switching works with multiple theme provider instances', async () => {
    const user = userEvent.setup();

    // Render two separate theme providers
    const { rerender } = render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    // Switch theme in first instance
    await user.click(screen.getByTestId('set-scifi'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('sci-fi');
    });

    // Rerender with new provider instance
    rerender(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    // Should maintain theme from localStorage
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('sci-fi');
    });
  });

  test('theme switching handles rapid consecutive changes', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    // Rapidly switch themes multiple times
    await user.click(screen.getByTestId('set-scifi'));
    await user.click(screen.getByTestId('set-medieval'));
    await user.click(screen.getByTestId('set-scifi'));
    await user.click(screen.getByTestId('set-medieval'));

    // Should end up with the last selected theme
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('medieval');
    });

    // Should have tracked all theme switches
    expect(analyticsService.trackThemeSwitch).toHaveBeenCalledTimes(4);
  });
});