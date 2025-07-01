import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../utils/ThemeContext';
import { NewsArticle, NewsProps } from '../types';
import { contentLoader } from '../services/contentLoader';
import { analyticsService } from '../services/analyticsService';

interface NewsState {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  selectedArticle: NewsArticle | null;
}

const News: React.FC<NewsProps> = ({ articles: propArticles, maxItems }) => {
  const { currentTheme } = useTheme();
  const [state, setState] = useState<NewsState>({
    articles: propArticles || [],
    loading: !propArticles,
    error: null,
    selectedArticle: null
  });

  useEffect(() => {
    // Only load articles if not provided via props
    if (!propArticles) {
      loadNewsArticles();
    }
  }, [propArticles]);

  const loadNewsArticles = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const articles = await contentLoader.loadNewsArticles();
      setState(prev => ({ 
        ...prev, 
        articles, 
        loading: false 
      }));
    } catch (error) {
      console.error('Error loading news articles:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to load news articles. Please try again later.' 
      }));
    }
  };

  const handleArticleClick = (article: NewsArticle) => {
    // Track news article view
    analyticsService.trackContentInteraction('news', article.id);
    
    setState(prev => ({ ...prev, selectedArticle: article }));
  };

  const handleBackToList = () => {
    setState(prev => ({ ...prev, selectedArticle: null }));
  };

  const formatDate = (date: Date): string => {
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Get articles to display (sorted newest first, limited by maxItems)
  const articlesToDisplay = (state.articles || [])
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, maxItems);

  if (state.loading) {
    return (
      <div className={`news-container ${currentTheme.components.card}`}>
        <h2>Latest News</h2>
        <div className="news-loading">
          <p>Loading news articles...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`news-container ${currentTheme.components.card}`}>
        <h2>Latest News</h2>
        <div className="news-error">
          <p>{state.error}</p>
          <button 
            onClick={loadNewsArticles}
            className={`retry-button ${currentTheme.components.button}`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Full article view
  if (state.selectedArticle) {
    return (
      <div className={`news-container news-article-view ${currentTheme.components.card}`}>
        <div className="news-article-header">
          <button 
            onClick={handleBackToList}
            className={`back-button ${currentTheme.components.button}`}
            aria-label="Back to news list"
          >
            ← Back to News
          </button>
        </div>
        <article className="news-article-full">
          <header className="news-article-meta">
            <h1 className="news-article-title">{state.selectedArticle.title}</h1>
            <div className="news-article-info">
              <time className="news-article-date" dateTime={state.selectedArticle.date.toISOString()}>
                {formatDate(state.selectedArticle.date)}
              </time>
              {state.selectedArticle.author && (
                <span className="news-article-author">by {state.selectedArticle.author}</span>
              )}
            </div>
          </header>
          <div className="news-article-content">
            <ReactMarkdown>{state.selectedArticle.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    );
  }

  // News list view
  return (
    <div className={`news-container ${currentTheme.components.card}`}>
      <h2>Latest News</h2>
      <div className="news-list">
        {articlesToDisplay.length > 0 ? (
          articlesToDisplay.map((article) => (
            <article 
              key={article.id} 
              className="news-item"
              onClick={() => handleArticleClick(article)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleArticleClick(article);
                }
              }}
              aria-label={`Read full article: ${article.title}`}
            >
              <header className="news-item-header">
                <h3 className="news-item-title">{article.title}</h3>
                <time className="news-item-date" dateTime={article.date.toISOString()}>
                  {formatDate(article.date)}
                </time>
                {article.author && (
                  <span className="news-item-author">by {article.author}</span>
                )}
              </header>
              <div className="news-item-excerpt">
                <p>{article.excerpt}</p>
              </div>
              <div className="news-item-action">
                <span className="read-more">Read more →</span>
              </div>
            </article>
          ))
        ) : (
          <div className="news-empty">
            <p>No news articles available at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;