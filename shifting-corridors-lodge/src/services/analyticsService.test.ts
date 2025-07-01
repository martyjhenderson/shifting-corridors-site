import { FathomAnalyticsService } from './analyticsService';
import { AnalyticsConfig } from '../types';

// Mock the global window object
const mockFathom = {
  trackPageview: jest.fn(),
  trackGoal: jest.fn()
};

// Mock console methods to avoid noise in tests
const mockConsole = {
  warn: jest.fn(),
  log: jest.fn()
};

describe('FathomAnalyticsService', () => {
  let analyticsService: FathomAnalyticsService;
  let config: AnalyticsConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock window.fathom
    Object.defineProperty(window, 'fathom', {
      value: mockFathom,
      writable: true,
      configurable: true
    });

    // Mock console
    global.console = mockConsole as any;

    // Mock document.referrer
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com',
      writable: true,
      configurable: true
    });

    // Create test configuration
    config = {
      siteId: 'TEST123',
      trackingEnabled: true,
      customEvents: {
        themeSwitch: 'THEME_SWITCH',
        eventView: 'EVENT_VIEW',
        gmProfileView: 'GM_PROFILE_VIEW',
        newsArticleView: 'NEWS_ARTICLE_VIEW'
      }
    };

    analyticsService = new FathomAnalyticsService(config);
  });

  afterEach(() => {
    // Clean up global mocks
    delete (window as any).fathom;
  });

  describe('trackPageView', () => {
    it('should track page view when tracking is enabled and fathom is available', () => {
      const path = '/calendar';
      
      analyticsService.trackPageView(path);
      
      expect(mockFathom.trackPageview).toHaveBeenCalledWith({
        url: path,
        referrer: 'https://example.com'
      });
    });

    it('should not track page view when tracking is disabled', () => {
      config.trackingEnabled = false;
      analyticsService = new FathomAnalyticsService(config);
      
      analyticsService.trackPageView('/calendar');
      
      expect(mockFathom.trackPageview).not.toHaveBeenCalled();
    });

    it('should not track page view when fathom is not available', () => {
      delete (window as any).fathom;
      
      analyticsService.trackPageView('/calendar');
      
      expect(mockFathom.trackPageview).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockFathom.trackPageview.mockImplementation(() => {
        throw new Error('Tracking failed');
      });
      
      analyticsService.trackPageView('/calendar');
      
      expect(mockConsole.warn).toHaveBeenCalledWith('Failed to track page view:', expect.any(Error));
    });
  });

  describe('trackEvent', () => {
    it('should track event when tracking is enabled and fathom is available', () => {
      const eventName = 'TEST_EVENT';
      const value = 100;
      
      analyticsService.trackEvent(eventName, value);
      
      expect(mockFathom.trackGoal).toHaveBeenCalledWith(eventName, value);
    });

    it('should track event without value', () => {
      const eventName = 'TEST_EVENT';
      
      analyticsService.trackEvent(eventName);
      
      expect(mockFathom.trackGoal).toHaveBeenCalledWith(eventName, undefined);
    });

    it('should not track event when tracking is disabled', () => {
      config.trackingEnabled = false;
      analyticsService = new FathomAnalyticsService(config);
      
      analyticsService.trackEvent('TEST_EVENT');
      
      expect(mockFathom.trackGoal).not.toHaveBeenCalled();
    });

    it('should not track event when fathom is not available', () => {
      delete (window as any).fathom;
      
      analyticsService.trackEvent('TEST_EVENT');
      
      expect(mockFathom.trackGoal).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockFathom.trackGoal.mockImplementation(() => {
        throw new Error('Tracking failed');
      });
      
      analyticsService.trackEvent('TEST_EVENT');
      
      expect(mockConsole.warn).toHaveBeenCalledWith('Failed to track event:', expect.any(Error));
    });
  });

  describe('trackThemeSwitch', () => {
    it('should track theme switch event', () => {
      const theme = 'sci-fi';
      
      analyticsService.trackThemeSwitch(theme);
      
      expect(mockFathom.trackGoal).toHaveBeenCalledWith('THEME_SWITCH', undefined);
      expect(mockConsole.log).toHaveBeenCalledWith('Theme switched to: sci-fi');
    });

    it('should not track when tracking is disabled', () => {
      config.trackingEnabled = false;
      analyticsService = new FathomAnalyticsService(config);
      
      analyticsService.trackThemeSwitch('medieval');
      
      expect(mockFathom.trackGoal).not.toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith('Theme switched to: medieval');
    });
  });

  describe('trackContentInteraction', () => {
    it('should track event content interaction', () => {
      analyticsService.trackContentInteraction('event', 'event-123');
      
      expect(mockFathom.trackGoal).toHaveBeenCalledWith('EVENT_VIEW', undefined);
      expect(mockConsole.log).toHaveBeenCalledWith('Content interaction tracked: event - event-123');
    });

    it('should track game master content interaction', () => {
      analyticsService.trackContentInteraction('gm', 'josh-g');
      
      expect(mockFathom.trackGoal).toHaveBeenCalledWith('GM_PROFILE_VIEW', undefined);
      expect(mockConsole.log).toHaveBeenCalledWith('Content interaction tracked: gm - josh-g');
    });

    it('should track news content interaction', () => {
      analyticsService.trackContentInteraction('news', 'news-456');
      
      expect(mockFathom.trackGoal).toHaveBeenCalledWith('NEWS_ARTICLE_VIEW', undefined);
      expect(mockConsole.log).toHaveBeenCalledWith('Content interaction tracked: news - news-456');
    });

    it('should handle unknown content type gracefully', () => {
      analyticsService.trackContentInteraction('unknown' as any, 'test-id');
      
      expect(mockFathom.trackGoal).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith('Unknown content interaction type:', 'unknown');
    });

    it('should not track when tracking is disabled', () => {
      config.trackingEnabled = false;
      analyticsService = new FathomAnalyticsService(config);
      
      analyticsService.trackContentInteraction('event', 'event-123');
      
      expect(mockFathom.trackGoal).not.toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith('Content interaction tracked: event - event-123');
    });
  });

  describe('configuration', () => {
    it('should use provided configuration', () => {
      const customConfig: AnalyticsConfig = {
        siteId: 'CUSTOM123',
        trackingEnabled: false,
        customEvents: {
          themeSwitch: 'CUSTOM_THEME',
          eventView: 'CUSTOM_EVENT',
          gmProfileView: 'CUSTOM_GM',
          newsArticleView: 'CUSTOM_NEWS'
        }
      };

      const customService = new FathomAnalyticsService(customConfig);
      
      customService.trackThemeSwitch('medieval');
      
      // Should not track because trackingEnabled is false
      expect(mockFathom.trackGoal).not.toHaveBeenCalled();
    });
  });
});

describe('analyticsService integration', () => {
  it('should export a configured analytics service instance', () => {
    // Import the exported instance
    const { analyticsService } = require('./analyticsService');
    
    expect(analyticsService).toBeDefined();
    expect(typeof analyticsService.trackPageView).toBe('function');
    expect(typeof analyticsService.trackEvent).toBe('function');
    expect(typeof analyticsService.trackThemeSwitch).toBe('function');
    expect(typeof analyticsService.trackContentInteraction).toBe('function');
  });
});