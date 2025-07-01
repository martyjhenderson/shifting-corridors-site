import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

/**
 * Web Vitals monitoring and reporting
 */

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Thresholds for Core Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
};

const getRating = (name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

const sendToAnalytics = (metric: VitalMetric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id
    });
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    try {
      // Send to Fathom Analytics as custom event
      if (window.fathom) {
        window.fathom.trackGoal(`WV_${metric.name}_${metric.rating.toUpperCase()}`, Math.round(metric.value));
      }
    } catch (error) {
      console.warn('Failed to send web vitals to analytics:', error);
    }
  }
};

/**
 * Initialize Web Vitals monitoring
 */
export const initWebVitals = () => {
  // Cumulative Layout Shift
  getCLS((metric) => {
    sendToAnalytics({
      name: 'CLS',
      value: metric.value,
      rating: getRating('CLS', metric.value),
      delta: metric.delta,
      id: metric.id
    });
  });

  // First Input Delay
  getFID((metric) => {
    sendToAnalytics({
      name: 'FID',
      value: metric.value,
      rating: getRating('FID', metric.value),
      delta: metric.delta,
      id: metric.id
    });
  });

  // First Contentful Paint
  getFCP((metric) => {
    sendToAnalytics({
      name: 'FCP',
      value: metric.value,
      rating: getRating('FCP', metric.value),
      delta: metric.delta,
      id: metric.id
    });
  });

  // Largest Contentful Paint
  getLCP((metric) => {
    sendToAnalytics({
      name: 'LCP',
      value: metric.value,
      rating: getRating('LCP', metric.value),
      delta: metric.delta,
      id: metric.id
    });
  });

  // Time to First Byte
  getTTFB((metric) => {
    sendToAnalytics({
      name: 'TTFB',
      value: metric.value,
      rating: getRating('TTFB', metric.value),
      delta: metric.delta,
      id: metric.id
    });
  });
};

/**
 * Performance observer for additional metrics
 */
export const initPerformanceObserver = () => {
  if (!('PerformanceObserver' in window)) {
    console.warn('PerformanceObserver not supported');
    return;
  }

  // Long tasks observer
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`Long task detected: ${entry.duration}ms`);
          
          if (process.env.NODE_ENV === 'production' && window.fathom) {
            window.fathom.trackGoal('LONG_TASK', Math.round(entry.duration));
          }
        }
      }
    });
    
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.warn('Long task observer not supported:', error);
  }

  // Resource timing observer
  try {
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        
        // Track slow resources
        if (resource.duration > 1000) {
          console.warn(`Slow resource: ${resource.name} took ${resource.duration}ms`);
        }
        
        // Track failed resources
        if (resource.transferSize === 0 && resource.decodedBodySize === 0) {
          console.warn(`Failed to load resource: ${resource.name}`);
        }
      }
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.warn('Resource observer not supported:', error);
  }
};

// Fathom interface is already declared in analyticsService.ts