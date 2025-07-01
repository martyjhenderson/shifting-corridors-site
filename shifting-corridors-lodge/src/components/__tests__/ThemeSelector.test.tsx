import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../utils/ThemeContext';
import ThemeSelector from '../ThemeSelector';

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

describe('ThemeSelector', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.style.cssText = '';
    document.body.className = '';
  });

  it('renders theme selector with correct options', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    expect(screen.getByLabelText('Choose Theme:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Medieval Fantasy')).toBeInTheDocument();
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('medieval');
    
    // Check that both options are available
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Medieval Fantasy');
    expect(options[1]).toHaveTextContent('Sci-Fi Future');
  });

  it('shows current theme as selected', () => {
    localStorageMock.getItem.mockReturnValue('sci-fi');
    
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('sci-fi');
    expect(screen.getByDisplayValue('Sci-Fi Future')).toBeInTheDocument();
  });

  it('changes theme when option is selected', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    const select = screen.getByRole('combobox');
    
    // Initially medieval
    expect(select).toHaveValue('medieval');
    
    // Change to sci-fi
    fireEvent.change(select, { target: { value: 'sci-fi' } });
    
    expect(select).toHaveValue('sci-fi');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lodge-theme', 'sci-fi');
  });

  it('applies correct CSS classes based on current theme', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('medieval-button');
    
    // Change to sci-fi theme
    fireEvent.change(select, { target: { value: 'sci-fi' } });
    
    // The class should update to sci-fi button style
    expect(select).toHaveClass('sci-fi-button');
  });

  it('has accessible label and form controls', () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    const label = screen.getByText('Choose Theme:');
    const select = screen.getByRole('combobox');
    
    expect(label).toHaveAttribute('for', 'theme-select');
    expect(select).toHaveAttribute('id', 'theme-select');
    expect(select).toBeEnabled();
  });
});