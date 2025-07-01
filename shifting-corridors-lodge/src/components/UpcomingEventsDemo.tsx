import React from 'react';
import UpcomingEvents from './UpcomingEvents';
import { CalendarEvent } from '../types';
import { ThemeProvider } from '../utils/ThemeContext';

// Demo component showing how to use UpcomingEvents
const UpcomingEventsDemo: React.FC = () => {
  // Sample events for demonstration
  const sampleEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Pathfinder Society Game',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      description: 'Join us for an exciting Pathfinder Society adventure!',
      content: 'Full adventure details...',
      gameType: 'Pathfinder',
      gamemaster: 'Josh G',
      maxPlayers: 6
    },
    {
      id: '2', 
      title: 'Starfinder Campaign',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      description: 'Continue our ongoing Starfinder campaign.',
      content: 'Campaign details...',
      gameType: 'Starfinder',
      gamemaster: 'Marty H',
      maxPlayers: 4
    },
    {
      id: '3',
      title: 'Legacy Game Night',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In a week
      description: 'Classic RPG gaming session.',
      content: 'Legacy game details...',
      gameType: 'Legacy',
      gamemaster: 'Josh G',
      maxPlayers: 8
    }
  ];

  const handleEventSelect = (event: CalendarEvent) => {
    console.log('Event selected:', event);
    // In a real app, this would navigate to event details
  };

  return (
    <ThemeProvider>
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <h2>UpcomingEvents Component Demo</h2>
        
        <h3>Showing next 3 events:</h3>
        <UpcomingEvents events={sampleEvents} maxEvents={3} />
        
        <h3>Showing next 2 events (with "more events" indicator):</h3>
        <UpcomingEvents events={sampleEvents} maxEvents={2} />
        
        <h3>Empty state (no upcoming events):</h3>
        <UpcomingEvents events={[]} maxEvents={3} />
      </div>
    </ThemeProvider>
  );
};

export default UpcomingEventsDemo;