import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../utils/ThemeContext';
import { getMarkdownFiles } from '../utils/markdown/markdownUtils';

interface NewsArticle {
  title: string;
  date: string;
  content: string;
}

const News: React.FC = () => {
  const { currentTheme } = useTheme();
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const files = await getMarkdownFiles('news');
        const articles: NewsArticle[] = files.map(file => ({
          title: file.meta.title || 'Untitled',
          date: file.meta.date || '',
          content: file.content
        }));
        
        // Sort by date (newest first)
        articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setNewsArticles(articles);
      } catch (error) {
        console.error('Error loading news:', error);
      }
    };

    loadNews();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`news-container ${currentTheme.components.card}`}>
      <h2>Latest News</h2>
      <div className="news-list">
        {newsArticles.length > 0 ? (
          newsArticles.map((article, index) => (
            <article key={index} className="news-item">
              <h3 className="news-title">{article.title}</h3>
              <p className="news-date">{formatDate(article.date)}</p>
              <div className="news-content">
                <ReactMarkdown>{article.content}</ReactMarkdown>
              </div>
            </article>
          ))
        ) : (
          <p>No news articles available at this time.</p>
        )}
      </div>
    </div>
  );
};

export default News;