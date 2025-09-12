import type { NextWebVitalsMetric } from 'next/app';

// Web Vitals tracking
export function trackWebVitals(metric: NextWebVitalsMetric) {
  if (typeof window === 'undefined') return;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      label: metric.label,
    });
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        custom_map: { metric_id: 'custom_metric_id' },
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value
        ),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Vercel Analytics
    if (typeof window.va !== 'undefined') {
      window.va('track', 'Web Vital', {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        label: metric.label,
      });
    }

    // Custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        label: metric.label,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  }
}

// Performance observer для кастомных метрик
export function initPerformanceObserver() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window))
    return;

  try {
    // Наблюдаем за navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;

          // Track custom navigation metrics
          trackCustomMetric(
            'DNS Lookup',
            navEntry.domainLookupEnd - navEntry.domainLookupStart
          );
          trackCustomMetric(
            'TCP Connection',
            navEntry.connectEnd - navEntry.connectStart
          );
          trackCustomMetric(
            'Server Response',
            navEntry.responseStart - navEntry.requestStart
          );
          trackCustomMetric(
            'DOM Parse',
            navEntry.domContentLoadedEventEnd - navEntry.responseEnd
          );
        }
      }
    });
    navObserver.observe({ entryTypes: ['navigation'] });

    // Наблюдаем за resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Track slow resources
          if (resourceEntry.duration > 1000) {
            // > 1 second
            trackCustomMetric('Slow Resource', resourceEntry.duration, {
              resource: resourceEntry.name,
              type: getResourceType(resourceEntry.name),
            });
          }
        }
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });

    // Наблюдаем за long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          trackCustomMetric('Long Task', entry.duration, {
            startTime: entry.startTime,
          });
        }
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.error('Performance Observer initialization failed:', error);
  }
}

// Track custom metrics
function trackCustomMetric(
  name: string,
  value: number,
  metadata?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Custom Metric]', { name, value, metadata });
  }

  if (process.env.NODE_ENV === 'production') {
    // Send to analytics
    fetch('/api/analytics/custom-metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        value,
        metadata,
        timestamp: Date.now(),
        url: window.location.href,
      }),
    }).catch(console.error);
  }
}

// Helper function to determine resource type
function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) return 'image';
  if (url.includes('/api/')) return 'api';
  return 'other';
}

// Error tracking
export function trackError(error: Error, errorInfo?: any) {
  console.error('[Error Tracked]', error, errorInfo);

  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    fetch('/api/analytics/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  }
}

// User interaction tracking
export function trackUserInteraction(
  action: string,
  label?: string,
  value?: number
) {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'development') {
    console.log('[User Interaction]', { action, label, value });
  }

  if (process.env.NODE_ENV === 'production') {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: 'User Interaction',
        event_label: label,
        value: value,
      });
    }

    // Vercel Analytics
    if (typeof window.va !== 'undefined') {
      window.va('track', action, { label, value });
    }
  }
}

// Initialize monitoring on page load
export function initMonitoring() {
  if (typeof window === 'undefined') return;

  // Initialize performance observer
  initPerformanceObserver();

  // Track page views
  trackUserInteraction('page_view', window.location.pathname);

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    trackError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error('Unhandled Promise Rejection'), {
      reason: event.reason,
    });
  });
}

// Types for global gtag and va functions
declare global {
  function gtag(...args: any[]): void;
  interface Window {
    va?: (...args: any[]) => void;
  }
}
