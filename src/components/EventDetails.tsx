import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../utils/ThemeContext';
import styled from 'styled-components';
import { getCalendarEvents, MarkdownContent } from '../utils/staticData';
import {
  formatTimeRange,
  formatScenarioTags,
  formatRegistrationNote,
} from '../utils/eventFormat';

interface EventDetailsProps {
  eventId?: string;
}

/**
 * "2025-10-22" -> "October 22, 2025", read as a local date. Splitting the parts
 * rather than `new Date(str)` avoids the UTC-midnight parse that renders the
 * previous day in US timezones.
 */
const formatEventDate = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

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
    /* inline-block + real vertical padding (not negative-margin
       hit-slop) so the tap target reaches ~44px tall on mobile without
       overlapping the link above/below it — "Sign up here" links often
       sit stacked one per line for multi-scenario events. */
    display: inline-block;
    padding: 10px 4px;
  }

  a:hover {
    color: ${props => props.theme.colors.secondary};
    text-decoration: underline;
  }

  ul, ol {
    padding-left: 20px;
  }

  /* Long addresses and scenario names must wrap rather than push the page
     wider — see the horizontal-overflow checks in e2e/mobile-layout.spec.ts. */
  overflow-wrap: anywhere;
`;

const CancelledBanner = styled.p<{ theme: any }>`
  font-family: ${props => props.theme.fonts.main};
  font-weight: bold;
  color: white;
  background-color: ${props => props.theme.colors.secondary};
  border-radius: 4px;
  padding: 12px 15px;
`;

const ScenarioList = styled.ol`
  li {
    margin-bottom: 10px;
  }

  .scenario-tags {
    opacity: 0.85;
  }

  .scenario-cancelled {
    font-weight: bold;
    text-transform: uppercase;
  }
`;

const EventDetails: React.FC<EventDetailsProps> = ({ eventId }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<MarkdownContent | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'missing' | 'error'>('loading');
  const id = eventId || params.eventId;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const calendarEvents = await getCalendarEvents();

        // Events are addressed by their filename slug; `url` front-matter is a
        // legacy fallback for any file that still carries it.
        const match = calendarEvents.find(candidate => {
          if (candidate.meta.url) {
            return candidate.meta.url.split('/').pop() === id;
          }
          return candidate.slug === id;
        });

        setEvent(match ?? null);
        setStatus(match ? 'found' : 'missing');
      } catch (error) {
        console.error('Error fetching event content:', error);
        setStatus('error');
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const meta = event?.meta;
  const scenarios = meta?.scenarios ?? [];
  const timeRange = meta ? formatTimeRange(meta) : null;
  const registrationNote = meta ? formatRegistrationNote(meta) : null;

  return (
    <>
      <BackButton theme={theme} onClick={() => navigate('/')}>
        Back to Calendar
      </BackButton>
      <StyledEventContainer theme={theme}>
        {status === 'missing' && (
          <>
            <h1>Event Not Found</h1>
            <p>The requested event could not be found.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>Error</h1>
            <p>There was an error loading the event content.</p>
          </>
        )}

        {status === 'found' && meta && (
          <>
            <h1>{meta.title}</h1>

            {meta.cancelled && (
              <CancelledBanner theme={theme}>This event has been cancelled.</CancelledBanner>
            )}

            {meta.intro && <p>{meta.intro}</p>}

            <h2>Details</h2>
            <ul>
              {meta.date && (
                <li>
                  <strong>Date:</strong> {formatEventDate(meta.date)}
                </li>
              )}
              {timeRange && (
                <li>
                  <strong>Time:</strong> {timeRange}
                </li>
              )}
              {meta.location && (
                <li>
                  <strong>Location:</strong> {meta.location}
                </li>
              )}
              {meta.address && (
                <li>
                  <strong>Address:</strong> {meta.address}
                </li>
              )}
              {meta.levels && (
                <li>
                  <strong>Level Range:</strong> {meta.levels}
                </li>
              )}
              {meta.playerCap && (
                <li>
                  <strong>Players:</strong> {meta.playerCap} players
                </li>
              )}
              {meta.gamemaster && (
                <li>
                  <strong>Game Master:</strong> {meta.gamemaster}
                </li>
              )}
              {meta.specialNote && (
                <li>
                  <strong>Special Note:</strong> {meta.specialNote}
                </li>
              )}
            </ul>

            {scenarios.length > 0 && (
              <>
                <h2>{scenarios.length === 1 ? 'Scenario' : 'Available Scenarios'}</h2>
                <ScenarioList>
                  {scenarios.map((scenario, index) => {
                    const tags = formatScenarioTags(scenario);
                    return (
                      <li key={`${scenario.name}-${index}`}>
                        <strong>{scenario.name}</strong>
                        {tags && <span className="scenario-tags"> ({tags})</span>}
                        {scenario.gamemaster && <span> — GM: {scenario.gamemaster}</span>}
                        {scenario.cancelled ? (
                          <span className="scenario-cancelled"> — Cancelled</span>
                        ) : (
                          scenario.signupUrl && (
                            <>
                              {' — '}
                              <a
                                href={scenario.signupUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Sign up here
                              </a>
                            </>
                          )
                        )}
                      </li>
                    );
                  })}
                </ScenarioList>
              </>
            )}

            {registrationNote && (
              <>
                <h2>Registration</h2>
                <p>{registrationNote}</p>
              </>
            )}

            {event.content.trim() && <ReactMarkdown>{event.content}</ReactMarkdown>}
          </>
        )}
      </StyledEventContainer>
    </>
  );
};

export default EventDetails;