import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import styled from 'styled-components';
import { getMarkdownFiles } from '../utils/markdown/markdownUtils';

// Simplified calendar component that avoids using moment.js for better performance

interface Event {
  date: Date;
  title: string;
  url: string;
}

interface CalendarComponentProps {
  events?: Event[];
}

const StyledCalendarContainer = styled.div<{ theme: any }>`
  padding: 20px;
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .calendar-nav-button {
    background-color: ${props => props.theme.colors.primary};
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    font-family: ${props => props.theme.fonts.main};
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .calendar-month {
    font-family: ${props => props.theme.fonts.heading};
    color: ${props => props.theme.colors.primary};
    font-size: 1.5rem;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
  }

  .calendar-day-header {
    text-align: center;
    font-weight: bold;
    padding: 10px;
    background-color: ${props => props.theme.colors.secondary};
    color: white;
    border-radius: 4px;
  }

  .calendar-day {
    text-align: center;
    padding: 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .calendar-day:hover {
    background-color: ${props => props.theme.colors.highlight};
  }

  .calendar-day.today {
    border: 2px solid ${props => props.theme.colors.accent};
    font-weight: bold;
  }

  .calendar-day.selected {
    background-color: ${props => props.theme.colors.primary};
    color: white;
    font-weight: bold;
  }

  .calendar-day.has-event {
    background-color: ${props => props.theme.colors.accent};
    color: white;
    font-weight: bold;
  }

  .calendar-day.other-month {
    opacity: 0.3;
  }

  .event-list {
    margin-top: 20px;
  }

  .event-item {
    padding: 10px;
    margin-bottom: 10px;
    background-color: ${props => props.theme.colors.highlight};
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .event-link {
    color: ${props => props.theme.colors.text};
    text-decoration: none;
    font-weight: bold;
    cursor: pointer;
  }
`;

// Helper functions for date manipulation without moment.js
const formatMonth = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDate = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const CalendarComponent: React.FC<CalendarComponentProps> = ({ events = [] }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsData, setEventsData] = useState<Event[]>(events);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [eventsByDate, setEventsByDate] = useState<Map<string, Event[]>>(new Map());

  // Generate calendar days for the current month
  useEffect(() => {
    const days: Date[] = [];
    
    // Get the first day of the month
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    // Get the last day of the month
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Get the first day of the calendar (might be in the previous month)
    const startDay = new Date(firstDay);
    startDay.setDate(1 - firstDay.getDay()); // Go back to the previous Sunday
    
    // Get the last day of the calendar (might be in the next month)
    const endDay = new Date(lastDay);
    const daysToAdd = 6 - lastDay.getDay();
    endDay.setDate(lastDay.getDate() + daysToAdd); // Go forward to the next Saturday
    
    // Generate all days in the calendar
    const currentDay = new Date(startDay);
    while (currentDay <= endDay) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentMonth]);

  // Fetch events and organize them by date
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (events.length === 0) {
          const markdownEvents = await getMarkdownFiles('calendar');
          
          const calendarEvents = markdownEvents.map(event => {
            // Parse date from YYYY-MM-DD format
            const dateParts = event.meta.date.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
            const day = parseInt(dateParts[2]);
            const eventDate = new Date(year, month, day);
            
            return {
              date: eventDate,
              title: event.meta.title,
              url: event.meta.url || `/events/${event.slug}`,
            };
          });
          
          setEventsData(calendarEvents);
        } else {
          setEventsData(events);
        }
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };

    fetchEvents();
  }, [events]);

  // Organize events by date for efficient lookup
  useEffect(() => {
    const map = new Map<string, Event[]>();
    
    eventsData.forEach(event => {
      const dateKey = `${event.date.getFullYear()}-${event.date.getMonth()}-${event.date.getDate()}`;
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      
      map.get(dateKey)!.push(event);
    });
    
    setEventsByDate(map);
  }, [eventsData]);

  // Navigation handlers
  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Get events for the selected date
  const selectedDateEvents = eventsData.filter(event => 
    isSameDay(event.date, selectedDate)
  );

  return (
    <StyledCalendarContainer theme={theme}>
      <h2 style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>
        Event Calendar
      </h2>
      
      <div className="calendar-header">
        <button className="calendar-nav-button" onClick={prevMonth}>
          Previous
        </button>
        <div className="calendar-month">
          {formatMonth(currentMonth)}
        </div>
        <button className="calendar-nav-button" onClick={nextMonth}>
          Next
        </button>
      </div>
      
      <div className="calendar-grid">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={`header-${index}`} className="calendar-day-header">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          
          // Check if this day has events
          const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const hasEvent = eventsByDate.has(dateKey);
          
          const className = `calendar-day ${isCurrentMonth ? '' : 'other-month'} ${
            isToday ? 'today' : ''
          } ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}`;
          
          return (
            <div
              key={`day-${index}`}
              className={className}
              onClick={() => handleDateClick(day)}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
      
      <div className="event-list">
        <h3 style={{ fontFamily: theme.fonts.heading, color: theme.colors.secondary }}>
          Events on {formatDate(selectedDate)}
        </h3>
        {selectedDateEvents.length > 0 ? (
          selectedDateEvents.map((event, index) => (
            <div key={index} className="event-item">
              <div 
                className="event-link" 
                onClick={() => navigate(event.url)}
              >
                {event.title}
              </div>
            </div>
          ))
        ) : (
          <p>No events scheduled for this date.</p>
        )}
      </div>
    </StyledCalendarContainer>
  );
};

export default CalendarComponent;