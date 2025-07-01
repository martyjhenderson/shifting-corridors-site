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
    lastUpdated: new Date(),
    retryCount: 0,
    isOffline: false,
    hasPartialData: false
  });

  // Check if browser is offline
  const checkOfflineStatus = (): boolean => {
    return !navigator.onLine;
  };

  // Load all content with comprehensive error handling
  const loadContent = async (): Promise<void> => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      isOffline: checkOfflineStatus()
    }));
    
    try {
      // Load content with individual error handling
      const results = await Promise.allSettled([
        contentLoader.loadCalendarEvents(),
        contentLoader.loadGameMasters(),
        contentLoader.loadNewsArticles()
      ]);

      const events = results[0].status === 'fulfilled' ? results[0].value : [];
      const gamemasters = results[1].status === 'fulfilled' ? results[1].value : [];
      const news = results[2].status === 'fulfilled' ? results[2].value : [];

      // Check if we have partial failures
      const hasFailures = results.some(result => result.status === 'rejected');
      const hasPartialData = events.length > 0 || gamemasters.length > 0 || news.length > 0;

      let errorMessage: string | null = null;
      if (hasFailures && !hasPartialData) {
        errorMessage = 'Unable to load content. Please check your connection and try again.';
      } else if (hasFailures && hasPartialData) {
        errorMessage = 'Some content could not be loaded. Showing available information.';
      }

      setState({
        events,
        gamemasters,
        news,
        loading: false,
        error: errorMessage,
        lastUpdated: new Date(),
        retryCount: 0,
        isOffline: checkOfflineStatus(),
        hasPartialData: hasPartialData && hasFailures
      });

    } catch (error) {
      console.error('Critical error loading content:', error);
      
      // Try to get fallback content
      try {
        const { getFallbackContent } = await import('../utils/fallbackContent');
        const fallback = getFallbackContent();
        
        setState({
          events: fallback.events,
          gamemasters: fallback.gamemasters,
          news: fallback.news,
          loading: false,
          error: 'Content temporarily unavailable. Showing cached information.',
          lastUpdated: new Date(),
          retryCount: 0,
          isOffline: checkOfflineStatus(),
          hasPartialData: true
        });
      } catch (fallbackError) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Unable to load content. Please refresh the page and try again.',
          isOffline: checkOfflineStatus()
        }));
      }
    }
  };

  // Refresh content (clears cache and reloads)
  const refreshContent = async (): Promise<void> => {
    contentLoader.clearCache();
    contentLoader.clearErrors();
    await loadContent();
  };

  // Retry loading content with exponential backoff
  const retryLoad = async (): Promise<void> => {
    const currentRetryCount = state.retryCount + 1;
    const maxRetries = 3;
    
    if (currentRetryCount > maxRetries) {
      setState(prev => ({
        ...prev,
        error: 'Maximum retry attempts reached. Please refresh the page.'
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      retryCount: currentRetryCount,
      loading: true,
      error: null
    }));

    // Wait before retrying (exponential backoff)
    const delay = Math.pow(2, currentRetryCount - 1) * 1000; // 1s, 2s, 4s
    await new Promise(resolve => setTimeout(resolve, delay));

    await loadContent();
  };

  // Clear error state
  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
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

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      if (state.error && state.error.includes('connection')) {
        loadContent();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.error]);

  const contextValue = {
    ...state,
    loadContent,
    refreshContent,
    selectEvent,
    selectGameMaster,
    retryLoad,
    clearError
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