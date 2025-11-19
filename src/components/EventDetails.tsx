import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../utils/ThemeContext';
import styled from 'styled-components';
import { getMarkdownFiles } from '../utils/markdown/markdownUtils';

interface EventDetailsProps {
  eventId?: string;
}

const BackButton = styled.button<{ theme: any }>`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  font-family: ${props => props.theme.fonts.main};
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.colors.accent};
    transform: translateY(-2px);
  }

  &:before {
    content: '←';
    font-size: 1.2rem;
  }
`;

const StyledEventContainer = styled.div<{ theme: any }>`
  padding: 20px;
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.fonts.heading};
    color: ${props => props.theme.colors.primary};
    margin-bottom: 15px;
  }

  p, ul, ol {
    font-family: ${props => props.theme.fonts.main};
    color: ${props => props.theme.colors.text};
    line-height: 1.6;
    margin-bottom: 15px;
  }

  a {
    color: ${props => props.theme.colors.accent};
    text-decoration: none;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  a:hover {
    color: ${props => props.theme.colors.secondary};
    text-decoration: underline;
  }

  ul, ol {
    padding-left: 20px;
  }

  /* Event meta banner removed */

  /* Special note banner removed */
`;

const EventDetails: React.FC<EventDetailsProps> = ({ eventId }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ eventId: string }>();
  const [eventContent, setEventContent] = useState<string>('');
  const id = eventId || params.eventId;

  useEffect(() => {
    const fetchEventContent = async () => {
      try {
        console.log('EventDetails: Fetching content for event ID:', id);
        
        // Get all calendar events
        const calendarEvents = await getMarkdownFiles('calendar');
        
        // Find the event with the matching slug
        const event = calendarEvents.find(event => {
          // Check if the event has a URL and if it matches the ID
          if (event.meta.url) {
            const eventSlug = event.meta.url.split('/').pop();
            return eventSlug === id;
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
    <>
      <BackButton theme={theme} onClick={() => navigate('/')}>
        Back to Calendar
      </BackButton>
      <StyledEventContainer theme={theme}>
        <ReactMarkdown>{eventContent}</ReactMarkdown>
      </StyledEventContainer>
    </>
  );
};

export default EventDetails;