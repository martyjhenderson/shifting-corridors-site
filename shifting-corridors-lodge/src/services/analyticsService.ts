import { AnalyticsService, AnalyticsConfig } from '../types';

// Declare fathom global to avoid TypeScript errors
declare global {
  interface Window {
    fathom?: {
      trackPageview: (options?: { url?: string; referrer?: string }) => void;
      trackGoal: (code: string, cents?: number) => void;
    };
  }
}

class FathomAnalyticsService implements AnalyticsService {
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  /**
   * Track a page view with Fathom Analytics
   * @param path - The page path to track
   */
  trackPageView(path: string): void {
    if (!this.config.trackingEnabled || !window.fathom) {
      return;
    }

    try {
      window.fathom.trackPageview({
        url: path,
        referrer: document.referrer
      });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  }

  /**
   * Track a custom event with Fathom Analytics
   * @param eventName - The event name/goal code
   * @param value - Optional value in cents
   */
  trackEvent(eventName: string, value?: number): void {
    if (!this.config.trackingEnabled || !window.fathom) {
      return;
    }

    try {
      window.fathom.trackGoal(eventName, value);
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  /**
   * Track theme switch events
   * @param theme - The theme that was switched to
   */
  trackThemeSwitch(theme: string): void {
    this.trackEvent(this.config.customEvents.themeSwitch);
    console.log(`Theme switched to: ${theme}`);
  }

  /**
   * Track content interaction events
   * @param type - The type of content (event, gm, news)
   * @param id - The ID of the content item
   */
  trackContentInteraction(type: 'event' | 'gm' | 'news', id: string): void {
    let eventCode: string;
    
    switch (type) {
      case 'event':
        eventCode = this.config.customEvents.eventView;
        break;
      case 'gm':
        eventCode = this.config.customEvents.gmProfileView;
        break;
      case 'news':
        eventCode = this.config.customEvents.newsArticleView;
        break;
      default:
        console.warn('Unknown content interaction type:', type);
        return;
    }

    this.trackEvent(eventCode);
    console.log(`Content interaction tracked: ${type} - ${id}`);
  }
}

// Default configuration
const defaultConfig: AnalyticsConfig = {
  siteId: 'ELTMMRHY', // Site ID from the HTML script
  trackingEnabled: true,
  customEvents: {
    themeSwitch: 'THEME_SWITCH',
    eventView: 'EVENT_VIEW',
    gmProfileView: 'GM_PROFILE_VIEW',
    newsArticleView: 'NEWS_ARTICLE_VIEW'
  }
};

// Create and export the analytics service instance
export const analyticsService = new FathomAnalyticsService(defaultConfig);

// Export the class for testing
export { FathomAnalyticsService };