import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../utils/ThemeContext';
import { getMarkdownFiles } from '../utils/markdown/markdownUtils';

interface EventDetailsProps {
  eventId?: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({ eventId }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ eventId: string }>();
  const [eventContent, setEventContent] = useState<string>('');

  const id = eventId || params.eventId;

  useEffect(() => {
    const fetchEventContent = async () => {
      try {
        const events = await getMarkdownFiles('calendar');
        const event = events.find(event => {
          // First check if the event has a URL that matches
          if (event.meta.url) {
            return event.meta.url.includes(id || '');
          }
          // If the event doesn't have a URL, check if the slug matches the ID
          return event.slug === id;
        });
        
        if (event) {
          setEventContent(event.content);
        } else {
          setEventContent('# Event Not Found\n\nThe requested event could not be found.');
        }
      } catch (error) {
        console.error('Error fetching event content:', error);
        setEventContent('# Error\n\nThere was an error loading the event content.');
      }
    };

    if (id) {
      fetchEventContent();
    }
  }, [id]);

  return (
    <div className="event-details">
      <button 
        className={`back-button ${currentTheme.components.button}`}
        onClick={() => navigate('/')}
      >
        Back to Calendar
      </button>
      <div className={`event-content ${currentTheme.components.card}`}>
        <ReactMarkdown>{eventContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default EventDetails;