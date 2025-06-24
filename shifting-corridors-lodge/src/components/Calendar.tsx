import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useTheme } from '../utils/ThemeContext';
import styled from 'styled-components';
import { getMarkdownFiles } from '../utils/markdown/markdownUtils';

// Note: This calendar component explicitly sets Sunday as the first day of the week
// to ensure proper alignment between day headers and calendar days.
//
// Important: Date parsing from strings like '2025-06-29' can be affected by timezone issues.
// We handle this by manually parsing the date parts and creating a Date object with the local timezone,
// ensuring events appear on their correct calendar day.

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

  .calendar-nav-button:hover {
    background-color: ${props => props.theme.colors.accent};
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

  .event-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .event-link {
    color: ${props => props.theme.colors.text};
    text-decoration: none;
    font-weight: bold;
  }
`;

const CalendarComponent: React.FC<CalendarComponentProps> = ({ events = [] }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());
  const [eventsData, setEventsData] = useState<Event[]>(events);

  useEffect(() => {
    // Fetch events from markdown files
    const fetchEvents = async () => {
      try {
        // Use the events passed as props or fetch from markdown files
        if (events.length === 0) {
          // Get events from markdown files
          const markdownEvents = await getMarkdownFiles('calendar');
          
          // Convert markdown events to calendar events
          const calendarEvents = markdownEvents.map(event => {
            // Fix timezone issue by ensuring the date is parsed correctly
            // Format: YYYY-MM-DD with time set to noon to avoid timezone issues
            const dateParts = event.meta.date.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
            const day = parseInt(dateParts[2]);
            const eventDate = new Date(year, month, day, 12, 0, 0);
            
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

  const prevMonth = () => {
    setCurrentDate(moment(currentDate).subtract(1, 'month'));
  };

  const nextMonth = () => {
    setCurrentDate(moment(currentDate).add(1, 'month'));
  };

  const handleDateClick = (date: moment.Moment) => {
    setSelectedDate(date);
  };

  const renderCalendarDays = () => {
    // Explicitly set Sunday as the first day of the week
    const startDay = moment(currentDate).startOf('month').startOf('week').day(0);
    const endDay = moment(currentDate).endOf('month').endOf('week').day(6);
    
    const days: React.ReactNode[] = [];
    const day = startDay.clone();
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
      <div key={`header-${i}`} className="calendar-day-header">
        {d}
      </div>
    ));
    days.push(...dayHeaders);
    
    // Add calendar days
    while (day.isSameOrBefore(endDay)) {
      const isCurrentMonth = day.month() === currentDate.month();
      const isToday = day.isSame(moment(), 'day');
      const isSelected = day.isSame(selectedDate, 'day');
      const hasEvent = eventsData.some(event => {
        // Ensure proper date comparison by creating a new moment object from the event date
        // and setting hours, minutes, seconds to 0 for both dates to compare only the date part
        const eventDate = moment(event.date).startOf('day');
        const dayDate = day.clone().startOf('day');
        return eventDate.isSame(dayDate, 'day');
      });
      
      const className = `calendar-day ${isCurrentMonth ? '' : 'other-month'} ${
        isToday ? 'today' : ''
      } ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}`;
      
      // Create a new moment object for this specific day
      const currentDay = day.clone();
      
      days.push(
        <div
          key={currentDay.format('YYYY-MM-DD')}
          className={className}
          onClick={() => handleDateClick(currentDay)}
        >
          {currentDay.date()}
        </div>
      );
      
      day.add(1, 'day');
    }
    
    return days;
  };

  const selectedDateEvents = eventsData.filter(event => {
    const eventDate = moment(event.date).startOf('day');
    const selDate = selectedDate.clone().startOf('day');
    return eventDate.isSame(selDate, 'day');
  });

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
          {currentDate.format('MMMM YYYY')}
        </div>
        <button className="calendar-nav-button" onClick={nextMonth}>
          Next
        </button>
      </div>
      
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>
      
      <div className="event-list">
        <h3 style={{ fontFamily: theme.fonts.heading, color: theme.colors.secondary }}>
          Events on {selectedDate.format('MMMM D, YYYY')}
        </h3>
        {selectedDateEvents.length > 0 ? (
          selectedDateEvents.map((event, index) => (
              <div key={index} className="event-item">
                <div 
                  className="event-link" 
                  onClick={() => navigate(event.url)}
                  style={{ cursor: 'pointer' }}
                >
                  {event.title}
                </div>
              </div>
            )
          )
        ) : (
          <p>No events scheduled for this date.</p>
        )}
      </div>
    </StyledCalendarContainer>
  );
};

export default CalendarComponent;