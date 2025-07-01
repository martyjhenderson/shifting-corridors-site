import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import { CalendarEvent, UpcomingEventsProps } from '../types';

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events, maxEvents }) => {
  const { currentTheme } = useTheme();

  // Filter and sort events to get upcoming ones
  const getUpcomingEvents = (): CalendarEvent[] => {
    const now = new Date();
    // Set to start of current day to include events happening today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return events
      .filter(event => event.date >= startOfToday)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, maxEvents);
  };

  const formatEventDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatEventTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEventClick = (event: CalendarEvent) => {
    // This will be handled by parent component through event bubbling
    // or we could add an onEventSelect prop if needed
    const eventElement = document.querySelector(`[data-event-id="${event.id}"]`);
    if (eventElement) {
      eventElement.dispatchEvent(new CustomEvent('eventSelect', { 
        detail: event,
        bubbles: true 
      }));
    }
  };

  const upcomingEvents = getUpcomingEvents();

  if (upcomingEvents.length === 0) {
    return (
      <div className={`upcoming-events-container ${currentTheme.components.panel}`}>
        <h3 className="upcoming-events-title">Upcoming Events</h3>
        <div className="no-upcoming-events">
          <p>No upcoming events scheduled.</p>
          <p className="check-back-message">Check back soon for new gaming sessions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`upcoming-events-container ${currentTheme.components.panel}`}>
      <h3 className="upcoming-events-title">
        Upcoming Events
        {upcomingEvents.length > 0 && (
          <span className="event-count">({upcomingEvents.length})</span>
        )}
      </h3>
      
      <div className="upcoming-events-list">
        {upcomingEvents.map((event, index) => (
          <div
            key={event.id}
            data-event-id={event.id}
            className={`upcoming-event-item ${event.gameType.toLowerCase()}`}
            onClick={() => handleEventClick(event)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleEventClick(event);
              }
            }}
            style={{ minHeight: '44px', touchAction: 'manipulation' }}
          >
            <div className="event-priority-indicator">
              {index === 0 && <span className="next-event-badge">Next</span>}
            </div>
            
            <div className="event-date-info">
              <div className="event-date-primary">{formatEventDate(event.date)}</div>
              <div className="event-time">{formatEventTime(event.date)}</div>
            </div>
            
            <div className="event-details">
              <h4 className="event-title">{event.title}</h4>
              <div className="event-meta">
                <span className={`game-type-badge ${event.gameType.toLowerCase()}`}>
                  {event.gameType}
                </span>
                {event.gamemaster && (
                  <span className="gamemaster-info">GM: {event.gamemaster}</span>
                )}
                {event.maxPlayers && (
                  <span className="player-info">Max: {event.maxPlayers}</span>
                )}
              </div>
              <p className="event-description">{event.description}</p>
            </div>
            
            <div className="event-action-indicator">
              <span className="click-hint">Click for details</span>
              <span className="arrow-indicator">→</span>
            </div>
          </div>
        ))}
      </div>
      
      {(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const totalUpcoming = events.filter(e => e.date >= startOfToday).length;
        return totalUpcoming > maxEvents && (
          <div className="more-events-indicator">
            <p>+ {totalUpcoming - maxEvents} more upcoming events</p>
          </div>
        );
      })()}
    </div>
  );
};

export default UpcomingEvents;