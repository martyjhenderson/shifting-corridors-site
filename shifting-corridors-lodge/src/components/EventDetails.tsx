import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../utils/ThemeContext';
import { contentLoader } from '../services/contentLoader';
import { CalendarEvent } from '../types';

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    if (!eventId) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const events = await contentLoader.loadCalendarEvents();
      const foundEvent = events.find(e => e.id === eventId);
      
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        setError('Event not found');
      }
    } catch (err) {
      setError('Failed to load event details');
      console.error('Error loading event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/');
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

  if (loading) {
    return (
      <div className={`event-details-container ${currentTheme.components.card}`}>
        <div className="event-details-loading">
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={`event-details-container ${currentTheme.components.card}`}>
        <div className="event-details-error">
          <h2>Event Not Found</h2>
          <p>{error || 'The requested event could not be found.'}</p>
          <button 
            className={`back-button ${currentTheme.components.button}`}
            onClick={handleBackClick}
          >
            ← Back to Calendar
          </button>
        </div>
      </div>
    );
  }

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