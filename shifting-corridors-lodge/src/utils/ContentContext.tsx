import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ContentState, ContentActions, CalendarEvent, GameMaster, NewsArticle } from '../types';
import { contentLoader } from '../services/contentLoader';

// Create the content context
const ContentContext = createContext<(ContentState & ContentActions) | undefined>(undefined);

// Content provider component
interface ContentProviderProps {
  children: ReactNode;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [state, setState] = useState<ContentState>({
    events: [],
    gamemasters: [],
    news: [],
    loading: true,
    error: null,
    lastUpdated: new Date()
  });

  // Load all content
  const loadContent = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [events, gamemasters, news] = await Promise.all([
        contentLoader.loadCalendarEvents(),
        contentLoader.loadGameMasters(),
        contentLoader.loadNewsArticles()
      ]);

      setState({
        events,
        gamemasters,
        news,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading content:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load content'
      }));
    }
  };

  // Refresh content (clears cache and reloads)
  const refreshContent = async (): Promise<void> => {
    contentLoader.clearCache();
    await loadContent();
  };

  // Select event (for navigation)
  const selectEvent = (eventId: string): void => {
    const event = state.events.find(e => e.id === eventId);
    if (event) {
      // This could trigger navigation or other actions
      // For now, we'll just log it
      console.log('Selected event:', event);
    }
  };

  // Select game master (for navigation)
  const selectGameMaster = (gmId: string): void => {
    const gm = state.gamemasters.find(g => g.id === gmId);
    if (gm) {
      // This could trigger navigation or other actions
      // For now, we'll just log it
      console.log('Selected game master:', gm);
    }
  };

  // Load content on mount
  useEffect(() => {
    loadContent();
  }, []);

  const contextValue = {
    ...state,
    loadContent,
    refreshContent,
    selectEvent,
    selectGameMaster
  };

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
};

// Custom hook to use content context
export const useContent = (): ContentState & ContentActions => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};