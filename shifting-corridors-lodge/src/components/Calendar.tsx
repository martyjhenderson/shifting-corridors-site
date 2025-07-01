import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { contentLoader } from '../services/contentLoader';
import { analyticsService } from '../services/analyticsService';
import { CalendarEvent, CalendarProps } from '../types';

const Calendar: React.FC<CalendarProps> = ({ events, onEventSelect }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventsData, setEventsData] = useState<CalendarEvent[]>(events);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load events from content loader if not provided via props
  useEffect(() => {
    if (events.length === 0) {
      loadEvents();
    } else {
      setEventsData(events);
    }
  }, [events]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedEvents = await contentLoader.loadCalendarEvents();
      setEventsData(loadedEvents);
    } catch (err) {
      setError('Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventsForDate = (date: Date) => {
    return eventsData.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getEventsForMonth = (month: Date) => {
    return eventsData.filter(event => 
      event.date.getMonth() === month.getMonth() && 
      event.date.getFullYear() === month.getFullYear()
    );
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return eventsData
      .filter(event => event.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Track event interaction
    analyticsService.trackContentInteraction('event', event.id);
    
    // Call the onEventSelect prop if provided for backward compatibility
    if (onEventSelect) {
      onEventSelect(event);
    }
    // Navigate to the event details page
    navigate(`/events/${event.id}`);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 1) {
      handleEventClick(dayEvents[0]);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    setSelectedDate(null);
  };

  const renderCalendarGrid = () => {
    const monthEvents = getEventsForMonth(currentMonth);
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    
    // Generate 6 weeks of days
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth();
        const isToday = currentDate.toDateString() === today.toDateString();
        const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString();
        const dayEvents = getEventsForDate(currentDate);
        const hasEvents = dayEvents.length > 0;

        days.push(
          <div
            key={`${week}-${day}`}
            className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}`}
            onClick={() => isCurrentMonth && handleDateClick(currentDate)}
          >
            <span className="day-number">{currentDate.getDate()}</span>
            {hasEvents && (
              <div className="event-indicators">
                {dayEvents.slice(0, 3).map((event, index) => (
                  <div
                    key={event.id}
                    className={`event-indicator ${event.gameType.toLowerCase()}`}
                    title={event.title}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="event-indicator more" title={`+${dayEvents.length - 3} more events`}>
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    }

    return days;
  };

  if (loading) {
    return (
      <div className={`calendar-container ${currentTheme.components.card}`}>
        <div className="loading-message">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`calendar-container ${currentTheme.components.card}`}>
        <div className="error-message">
          <p>{error}</p>
          <button 
            className={currentTheme.components.button}
            onClick={loadEvents}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const upcomingEvents = getUpcomingEvents();
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className={`calendar-container ${currentTheme.components.card}`}>
      <div className="calendar-header">
        <button 
          className={`calendar-nav-button ${currentTheme.components.button}`}
          onClick={() => navigateMonth('prev')}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="calendar-month">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button 
          className={`calendar-nav-button ${currentTheme.components.button}`}
          onClick={() => navigateMonth('next')}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="calendar-grid-container">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
        </div>
        
        <div className="calendar-grid">
          {renderCalendarGrid()}
        </div>
      </div>

      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="selected-date-events">
          <h3>Events on {formatDate(selectedDate)}</h3>
          <div className="event-list">
            {selectedDateEvents.map(event => (
              <div 
                key={event.id} 
                className={`event-item ${event.gameType.toLowerCase()}`}
                onClick={() => handleEventClick(event)}
              >
                <div className="event-title">{event.title}</div>
                <div className="event-meta">
                  <span className="event-type">{event.gameType}</span>
                  {event.gamemaster && <span className="event-gm">GM: {event.gamemaster}</span>}
                </div>
                <div className="event-description">{event.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="upcoming-events-summary">
        <h3>Upcoming Events</h3>
        {upcomingEvents.length > 0 ? (
          <div className="event-list">
            {upcomingEvents.slice(0, 5).map(event => (
              <div 
                key={event.id} 
                className={`event-item compact ${event.gameType.toLowerCase()}`}
                onClick={() => handleEventClick(event)}
              >
                <div className="event-date-compact">{formatShortDate(event.date)}</div>
                <div className="event-details-compact">
                  <div className="event-title">{event.title}</div>
                  <div className="event-type">{event.gameType}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-events">No upcoming events scheduled.</p>
        )}
      </div>
    </div>
  );
};

export default Calendar;