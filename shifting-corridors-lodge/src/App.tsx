import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import { analyticsService } from './services/analyticsService';
import CalendarComponent from './components/Calendar';
import GameMasters from './components/GameMasters';
import Contact from './components/Contact';
import News from './components/News';
import EventDetails from './components/EventDetails';
import ThemeSelector from './components/ThemeSelector';
import './App.css';
import './styles/medieval.css';
import './styles/sci-fi.css';
import './styles/mobile.css';

// Import Google Fonts
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&family=Orbitron:wght@400;500;700&family=Exo+2:wght@400;500;600&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const AppContent: React.FC = () => {
  const { currentTheme } = useTheme();
  const location = useLocation();

  // Track page views when location changes
  useEffect(() => {
    analyticsService.trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <div className={`app-container ${currentTheme.components.container}`}>
      <header className="app-header">
        <h1 className="app-title">Shifting Corridors Lodge</h1>
        <ThemeSelector />
      </header>

      <Routes>
        <Route path="/events/:eventId" element={
          <EventDetails />
        } />
        <Route path="/" element={
          <div className="main-grid">
            <main className="main-content">
              <CalendarComponent events={[]} />
              <News />
            </main>
            <aside className="sidebar">
              <GameMasters />
              <Contact />
            </aside>
          </div>
        } />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;