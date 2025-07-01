import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { getMarkdownFiles } from '../utils/markdown/markdownUtils';

interface Event {
  date: Date;
  title: string;
  url: string;
}

interface CalendarComponentProps {
  events?: Event[];
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ events = [] }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsData, setEventsData] = useState<Event[]>(events);

  // Load events from markdown files
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const files = await getMarkdownFiles('calendar');
        const loadedEvents: Event[] = files.map((file, index) => ({
          date: new Date(2025, 6, 13 + index), // Sample dates
          title: file.meta?.title || `Event ${index + 1}`,
          url: `/events/${file.slug || index}`
        }));
        setEventsData(loadedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEventsForDate = (date: Date) => {
    return eventsData.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const handleEventClick = (event: Event) => {
    navigate(event.url);
  };

  return (
    <div className={`calendar-container ${currentTheme.components.card}`}>
      <h2>Event Calendar</h2>
      
      <div className="calendar-header">
        <button 
          className={`calendar-nav-button ${currentTheme.components.button}`}
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
        >
          Previous
        </button>
        <h3 className="calendar-month">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button 
          className={`calendar-nav-button ${currentTheme.components.button}`}
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
        >
          Next
        </button>
      </div>

      <div className="calendar-simple">
        <p>Calendar view coming soon. For now, here are the upcoming events:</p>
      </div>
      
      <div className="event-list">
        <h3>Upcoming Events</h3>
        {eventsData.length > 0 ? (
          eventsData.map((event, index) => (
            <div key={index} className="event-item" onClick={() => handleEventClick(event)}>
              <div className="event-date">{formatDate(event.date)}</div>
              <div className="event-title">{event.title}</div>
            </div>
          ))
        ) : (
          <p>No events scheduled at this time.</p>
        )}
      </div>
    </div>
  );
};

export default CalendarComponent;