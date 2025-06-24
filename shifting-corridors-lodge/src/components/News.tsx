import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../utils/ThemeContext';
import styled from 'styled-components';
import { getMarkdownFiles } from '../utils/markdown/markdownUtils';

interface NewsArticle {
  id: string;
  title: string;
  date: string;
  content: string;
}

const StyledNewsContainer = styled.div<{ theme: any }>`
  padding: 20px;
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  h2 {
    font-family: ${props => props.theme.fonts.heading};
    color: ${props => props.theme.colors.primary};
    margin-bottom: 20px;
  }

  .news-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .news-article {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease;
  }

  .news-article:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .news-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${props => props.theme.colors.accent};
  }

  .news-title {
    font-family: ${props => props.theme.fonts.heading};
    color: ${props => props.theme.colors.secondary};
    font-size: 1.3rem;
    margin: 0;
  }

  .news-date {
    font-family: ${props => props.theme.fonts.main};
    color: ${props => props.theme.colors.text};
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .news-content {
    font-family: ${props => props.theme.fonts.main};
    color: ${props => props.theme.colors.text};
    line-height: 1.6;
  }
`;

const News: React.FC = () => {
  const { theme } = useTheme();
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    // Fetch news articles from markdown files
    const fetchNewsArticles = async () => {
      try {
        // Get news articles from markdown files
        const markdownNews = await getMarkdownFiles('news');
        
        // Convert markdown news to news articles
        const newsArticles: NewsArticle[] = markdownNews.map(news => ({
          id: news.slug,
          title: news.meta.title,
          date: news.meta.date,
          content: news.content,
        }));
        
        setNewsArticles(newsArticles);
      } catch (error) {
        console.error('Error fetching news articles:', error);
      }
    };

    fetchNewsArticles();
  }, []);

  return (
    <StyledNewsContainer theme={theme}>
      <h2>Latest News</h2>
      <div className="news-list">
        {newsArticles.map((article) => (
          <div key={article.id} className="news-article">
            <div className="news-header">
              <h3 className="news-title">{article.title}</h3>
              <span className="news-date">{article.date}</span>
            </div>
            <div className="news-content">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </StyledNewsContainer>
  );
};

export default News;