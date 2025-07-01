import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import { ContentProvider, useContent } from './utils/ContentContext';
import { analyticsService } from './services/analyticsService';
import { addResourceHints, preloadResource } from './utils/performance';
import { initWebVitals, initPerformanceObserver } from './utils/webVitals';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeSelector from './components/ThemeSelector';
import './App.css';
import './styles/performance.css';
import './styles/medieval.css';
import './styles/sci-fi.css';
import './styles/mobile.css';

// Lazy load non-critical components
const CalendarComponent = lazy(() => import('./components/Calendar'));
const GameMasters = lazy(() => import('./components/GameMasters'));
const Contact = lazy(() => import('./components/Contact'));
const News = lazy(() => import('./components/News'));
const EventDetails = lazy(() => import('./components/EventDetails'));
const UpcomingEvents = lazy(() => import('./components/UpcomingEvents'));

// Performance optimizations
addResourceHints();

// Preload critical resources
preloadResource('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&family=Orbitron:wght@400;500;700&family=Exo+2:wght@400;500;600&display=swap', 'style');

// Import Google Fonts with performance optimization
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&family=Orbitron:wght@400;500;700&family=Exo+2:wght@400;500;600&display=swap';
fontLink.rel = 'stylesheet';
fontLink.media = 'print';
fontLink.onload = () => { fontLink.media = 'all'; };
document.head.appendChild(fontLink);

// Initialize performance monitoring
initWebVitals();
initPerformanceObserver();

// Loading component
const LoadingSpinner: React.FC = () => {
  const { currentTheme } = useTheme();
  
  return (
    <div className={`loading-container ${currentTheme.components.panel}`}>
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading content...</p>
      </div>
    </div>
  );
};

// Error display component
const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => {
  const { currentTheme } = useTheme();
  
  return (
    <div className={`error-container ${currentTheme.components.panel}`}>
      <div className="error-content">
        <h3>Unable to load content</h3>
        <p>{error}</p>
        <button 
          onClick={onRetry}
          className={`retry-button ${currentTheme.components.button}`}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

// Event details route component
const EventDetailsRoute: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { events, loading, error } = useContent();
  const { currentTheme } = useTheme();

  if (loading) return <LoadingSpinner />;
  if (error) return <Navigate to="/" replace />;

  const event = events.find(e => e.id === eventId);
  if (!event) return <Navigate to="/" replace />;

  return (
    <div className={`event-details-page ${currentTheme.components.container}`}>
      <Suspense fallback={<LoadingSpinner />}>
        <EventDetails 
          event={event} 
          onBack={() => window.history.back()} 
        />
      </Suspense>
    </div>
  );
};

// Main content component
const MainContent: React.FC = () => {
  const { currentTheme } = useTheme();
  const { events, gamemasters, news, loading, error, refreshContent } = useContent();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refreshContent} />;
  }

  return (
    <div className="main-grid">
      <main className="main-content">
        <ErrorBoundary fallback={
          <div className={`component-error ${currentTheme.components.panel}`}>
            <p>Unable to load calendar. Please refresh the page.</p>
          </div>
        }>
          <Suspense fallback={<LoadingSpinner />}>
            <CalendarComponent 
              events={events}
              onEventSelect={(event) => {
                window.location.href = `/events/${event.id}`;
              }}
            />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className={`component-error ${currentTheme.components.panel}`}>
            <p>Unable to load news. Please refresh the page.</p>
          </div>
        }>
          <Suspense fallback={<LoadingSpinner />}>
            <News articles={news} maxItems={5} />
          </Suspense>
        </ErrorBoundary>
      </main>

      <aside className="sidebar">
        <ErrorBoundary fallback={
          <div className={`component-error ${currentTheme.components.panel}`}>
            <p>Unable to load upcoming events.</p>
          </div>
        }>
          <Suspense fallback={<LoadingSpinner />}>
            <UpcomingEvents events={events} maxEvents={3} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className={`component-error ${currentTheme.components.panel}`}>
            <p>Unable to load game masters.</p>
          </div>
        }>
          <Suspense fallback={<LoadingSpinner />}>
            <GameMasters 
              gamemasters={gamemasters}
              onGameMasterSelect={(gm) => {
                analyticsService.trackContentInteraction('gm', gm.id);
              }}
            />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className={`component-error ${currentTheme.components.panel}`}>
            <p>Unable to load contact information.</p>
          </div>
        }>
          <Suspense fallback={<LoadingSpinner />}>
            <Contact />
          </Suspense>
        </ErrorBoundary>
      </aside>
    </div>
  );
};

// App content with routing
const AppContent: React.FC = () => {
  const { currentTheme } = useTheme();
  const location = useLocation();

  // Track page views when location changes
  useEffect(() => {
    analyticsService.trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <div className={`app-container ${currentTheme.components.container}`}>
      <ErrorBoundary>
        <header className="app-header">
          <h1 className="app-title">Shifting Corridors Lodge</h1>
          <ThemeSelector />
        </header>

        <Routes>
          <Route path="/events/:eventId" element={<EventDetailsRoute />} />
          <Route path="/" element={<MainContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
};

// Main App component with all providers
const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
        // Could send to error reporting service here
      }}
    >
      <ThemeProvider>
        <ContentProvider>
          <Router>
            <AppContent />
          </Router>
        </ContentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;