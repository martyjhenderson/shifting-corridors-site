import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../utils/ThemeContext';
import { ContentProvider } from '../utils/ContentContext';

// Mock react-markdown to avoid ES module issues
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

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

describe('Basic Website Functionality', () => {
  test('ThemeProvider renders without crashing', () => {
    render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('ContentProvider renders without crashing', () => {
    render(
      <ThemeProvider>
        <ContentProvider>
          <div>Test content</div>
        </ContentProvider>
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('Components can be imported without errors', async () => {
    // Test that all components can be imported
    const Calendar = await import('../components/Calendar');
    const GameMasters = await import('../components/GameMasters');
    const News = await import('../components/News');
    const Contact = await import('../components/Contact');
    const EventDetails = await import('../components/EventDetails');
    const UpcomingEvents = await import('../components/UpcomingEvents');
    
    expect(Calendar.default).toBeDefined();
    expect(GameMasters.default).toBeDefined();
    expect(News.default).toBeDefined();
    expect(Contact.default).toBeDefined();
    expect(EventDetails.default).toBeDefined();
    expect(UpcomingEvents.default).toBeDefined();
  });
});