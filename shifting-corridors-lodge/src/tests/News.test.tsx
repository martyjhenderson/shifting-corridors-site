import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../utils/ThemeContext';
import { themeClasses } from '../styles/themes';
import News from '../components/News';
import { NewsArticle } from '../types';
import { contentLoader } from '../services/contentLoader';

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock the content loader
jest.mock('../services/contentLoader', () => ({
  contentLoader: {
    loadNewsArticles: jest.fn()
  }
}));

const mockContentLoader = contentLoader as jest.Mocked<typeof contentLoader>;

// Mock news articles for testing
const mockNewsArticles: NewsArticle[] = [
  {
    id: 'article-1',
    title: 'First News Article',
    date: new Date('2025-06-30T12:00:00Z'),
    excerpt: 'This is the first news article excerpt.',
    content: '# First News Article\n\nThis is the full content of the first news article.',
    author: 'Test Author'
  },
  {
    id: 'article-2',
    title: 'Second News Article',
    date: new Date('2025-06-25T12:00:00Z'),
    excerpt: 'This is the second news article excerpt.',
    content: '# Second News Article\n\nThis is the full content of the second news article.'
  },
  {
    id: 'article-3',
    title: 'Third News Article',
    date: new Date('2025-06-20T12:00:00Z'),
    excerpt: 'This is the third news article excerpt.',
    content: '# Third News Article\n\nThis is the full content of the third news article.',
    author: 'Another Author'
  }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('News Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading message when loading articles', async () => {
      mockContentLoader.loadNewsArticles.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockNewsArticles), 100))
      );

      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      expect(screen.getByText('Loading news articles...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when loading fails', async () => {
      const errorMessage = 'Failed to load news articles';
      mockContentLoader.loadNewsArticles.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load news articles. Please try again later.')).toBeInTheDocument();
      });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should retry loading when retry button is clicked', async () => {
      mockContentLoader.loadNewsArticles
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockNewsArticles);

      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      expect(mockContentLoader.loadNewsArticles).toHaveBeenCalledTimes(2);
    });
  });

  describe('News List Display', () => {
    beforeEach(() => {
      mockContentLoader.loadNewsArticles.mockResolvedValue(mockNewsArticles);
    });

    it('should display news articles when loaded', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      expect(screen.getByText('Second News Article')).toBeInTheDocument();
      expect(screen.getByText('Third News Article')).toBeInTheDocument();
    });

    it('should display articles sorted by date (newest first)', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      const articles = screen.getAllByRole('button', { name: /Read full article/ });
      expect(articles).toHaveLength(3);
      
      // Check that the first article is the newest (2025-06-30)
      expect(articles[0]).toHaveTextContent('First News Article');
      expect(articles[1]).toHaveTextContent('Second News Article');
      expect(articles[2]).toHaveTextContent('Third News Article');
    });

    it('should display article excerpts', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('This is the first news article excerpt.')).toBeInTheDocument();
      });

      expect(screen.getByText('This is the second news article excerpt.')).toBeInTheDocument();
      expect(screen.getByText('This is the third news article excerpt.')).toBeInTheDocument();
    });

    it('should display formatted dates', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/June 30, 2025/)).toBeInTheDocument();
      });

      expect(screen.getByText(/June 25, 2025/)).toBeInTheDocument();
      expect(screen.getByText(/June 20, 2025/)).toBeInTheDocument();
    });

    it('should display author information when available', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('by Test Author')).toBeInTheDocument();
      });

      expect(screen.getByText('by Another Author')).toBeInTheDocument();
      // Second article has no author, so should not display author info
      expect(screen.queryByText('by undefined')).not.toBeInTheDocument();
    });

    it('should limit articles when maxItems prop is provided', async () => {
      render(
        <TestWrapper>
          <News articles={mockNewsArticles} maxItems={2} />
        </TestWrapper>
      );

      expect(screen.getByText('First News Article')).toBeInTheDocument();
      expect(screen.getByText('Second News Article')).toBeInTheDocument();
      expect(screen.queryByText('Third News Article')).not.toBeInTheDocument();
    });
  });

  describe('Article Interaction', () => {
    beforeEach(() => {
      mockContentLoader.loadNewsArticles.mockResolvedValue(mockNewsArticles);
    });

    it('should open full article view when article is clicked', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      const firstArticle = screen.getByRole('button', { name: 'Read full article: First News Article' });
      fireEvent.click(firstArticle);

      expect(screen.getByText('← Back to News')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('This is the full content of the first news article.');
    });

    it('should support keyboard navigation for article selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      const firstArticle = screen.getByRole('button', { name: 'Read full article: First News Article' });
      
      // Focus and press Enter
      firstArticle.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('← Back to News')).toBeInTheDocument();
    });

    it('should support space key for article selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      const firstArticle = screen.getByRole('button', { name: 'Read full article: First News Article' });
      
      // Focus and press Space
      firstArticle.focus();
      await user.keyboard(' ');

      expect(screen.getByText('← Back to News')).toBeInTheDocument();
    });

    it('should return to list view when back button is clicked', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      // Click on article to open full view
      const firstArticle = screen.getByRole('button', { name: 'Read full article: First News Article' });
      fireEvent.click(firstArticle);

      expect(screen.getByText('← Back to News')).toBeInTheDocument();

      // Click back button
      fireEvent.click(screen.getByText('← Back to News'));

      // Should be back to list view
      expect(screen.getByText('Latest News')).toBeInTheDocument();
      expect(screen.getByText('This is the first news article excerpt.')).toBeInTheDocument();
    });
  });

  describe('Full Article View', () => {
    beforeEach(() => {
      mockContentLoader.loadNewsArticles.mockResolvedValue(mockNewsArticles);
    });

    it('should display full article content with markdown rendering', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      const firstArticle = screen.getByRole('button', { name: 'Read full article: First News Article' });
      fireEvent.click(firstArticle);

      // Check that the article title is displayed
      expect(screen.getByRole('heading', { level: 1, name: 'First News Article' })).toBeInTheDocument();
      // Check that markdown content is rendered
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('This is the full content of the first news article.');
    });

    it('should display article metadata in full view', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      const firstArticle = screen.getByRole('button', { name: 'Read full article: First News Article' });
      fireEvent.click(firstArticle);

      expect(screen.getByText(/June 30, 2025/)).toBeInTheDocument();
      expect(screen.getByText('by Test Author')).toBeInTheDocument();
    });

    it('should handle articles without authors in full view', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Second News Article')).toBeInTheDocument();
      });

      const secondArticle = screen.getByRole('button', { name: 'Read full article: Second News Article' });
      fireEvent.click(secondArticle);

      expect(screen.getByText(/June 25, 2025/)).toBeInTheDocument();
      expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no articles are available', async () => {
      mockContentLoader.loadNewsArticles.mockResolvedValue([]);

      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No news articles available at this time.')).toBeInTheDocument();
      });
    });
  });

  describe('Props-based Articles', () => {
    it('should use provided articles instead of loading when articles prop is given', () => {
      render(
        <TestWrapper>
          <News articles={mockNewsArticles} />
        </TestWrapper>
      );

      expect(screen.getByText('First News Article')).toBeInTheDocument();
      expect(mockContentLoader.loadNewsArticles).not.toHaveBeenCalled();
    });

    it('should not show loading state when articles are provided via props', () => {
      render(
        <TestWrapper>
          <News articles={mockNewsArticles} />
        </TestWrapper>
      );

      expect(screen.queryByText('Loading news articles...')).not.toBeInTheDocument();
      expect(screen.getByText('First News Article')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockContentLoader.loadNewsArticles.mockResolvedValue(mockNewsArticles);
    });

    it('should have proper ARIA labels for article buttons', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Read full article: First News Article' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Read full article: Second News Article' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Read full article: Third News Article' })).toBeInTheDocument();
    });

    it('should have proper datetime attributes for dates', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        const dateElement = screen.getByText(/June 30, 2025/);
        expect(dateElement.closest('time')).toHaveAttribute('dateTime', '2025-06-30T12:00:00.000Z');
      });
    });

    it('should have proper ARIA label for back button', async () => {
      render(
        <TestWrapper>
          <News />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First News Article')).toBeInTheDocument();
      });

      const firstArticle = screen.getByRole('button', { name: 'Read full article: First News Article' });
      fireEvent.click(firstArticle);

      expect(screen.getByRole('button', { name: 'Back to news list' })).toBeInTheDocument();
    });
  });
});