import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../utils/ThemeContext';
import { EventDetailsProps } from '../types';
import { analyticsService } from '../services/analyticsService';

const EventDetails: React.FC<EventDetailsProps> = ({ event, onBack }) => {
  const { currentTheme } = useTheme();

  const handleBackClick = () => {
    onBack();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Track event view
  React.useEffect(() => {
    if (event?.id) {
      analyticsService.trackContentInteraction('event', event.id);
    }
  }, [event?.id]);

  return (
    <div className={`event-details-container ${currentTheme.components.card}`}>
      <div className="event-details-header">
        <button 
          className={`back-button ${currentTheme.components.button}`}
          onClick={handleBackClick}
          aria-label="Back to calendar"
        >
          ← Back to Calendar
        </button>
      </div>

      <article className="event-details-content">
        <header className="event-header">
          <h1 className="event-title">{event.title}</h1>
          
          <div className="event-meta">
            <div className="event-date-time">
              <span className="event-date">{formatDate(event.date)}</span>
              <span className="event-time">{formatTime(event.date)}</span>
            </div>
            
            <div className="event-game-info">
              <span className={`game-type-badge ${event.gameType.toLowerCase()}`}>
                {event.gameType}
              </span>
              {event.gamemaster && (
                <span className="gamemaster-info">
                  GM: {event.gamemaster}
                </span>
              )}
              {event.maxPlayers && (
                <span className="player-info">
                  Max Players: {event.maxPlayers}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="event-description">
          <p>{event.description}</p>
        </div>

        <div className="event-content">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h2 className="content-heading-1">{children}</h2>,
              h2: ({ children }) => <h3 className="content-heading-2">{children}</h3>,
              h3: ({ children }) => <h4 className="content-heading-3">{children}</h4>,
              p: ({ children }) => <p className="content-paragraph">{children}</p>,
              ul: ({ children }) => <ul className="content-list">{children}</ul>,
              ol: ({ children }) => <ol className="content-list ordered">{children}</ol>,
              li: ({ children }) => <li className="content-list-item">{children}</li>,
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  className="content-link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong className="content-strong">{children}</strong>,
              em: ({ children }) => <em className="content-emphasis">{children}</em>,
              blockquote: ({ children }) => <blockquote className="content-blockquote">{children}</blockquote>,
              code: ({ children }) => <code className="content-code">{children}</code>,
              pre: ({ children }) => <pre className="content-pre">{children}</pre>
            }}
          >
            {event.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
};

export default EventDetails;