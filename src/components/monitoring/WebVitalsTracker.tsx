'use client';

import { useEffect, useRef } from 'react';
import { sentryMiningService } from '@/lib/monitoring/sentry-service';
import {
  performanceMonitoring,
  WebVitalsMetrics,
} from '@/lib/middleware/performance-monitoring';

// Core Web Vitals thresholds (Google standards)
const WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
} as const;

interface WebVitalsTrackerProps {
  userId?: string;
  pageName?: string;
}

export function WebVitalsTracker({ userId, pageName }: WebVitalsTrackerProps) {
  const metricsRef = useRef<Partial<WebVitalsMetrics>>({});
  const reportedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Track page load time
    const startTime = performance.now();

    // Track navigation timing
    const trackNavigationTiming = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        metricsRef.current.TTFB = ttfb;

        // Report TTFB immediately
        if (!reportedRef.current.has('TTFB')) {
          reportedRef.current.add('TTFB');
          reportMetric('TTFB', ttfb);
        }
      }
    };

    // Use Web Vitals library if available, fallback to manual tracking
    const trackWebVitals = async () => {
      try {
        // Try to import web-vitals dynamically
        const { getCLS, getFID, getFCP, getLCP } = await import('web-vitals');

        getCLS((metric) => {
          if (!reportedRef.current.has('CLS')) {
            reportedRef.current.add('CLS');
            metricsRef.current.CLS = metric.value;
            reportMetric('CLS', metric.value);
          }
        });

        getFID((metric) => {
          if (!reportedRef.current.has('FID')) {
            reportedRef.current.add('FID');
            metricsRef.current.FID = metric.value;
            reportMetric('FID', metric.value);
          }
        });

        getFCP((metric) => {
          if (!reportedRef.current.has('FCP')) {
            reportedRef.current.add('FCP');
            metricsRef.current.FCP = metric.value;
            reportMetric('FCP', metric.value);
          }
        });

        getLCP((metric) => {
          if (!reportedRef.current.has('LCP')) {
            reportedRef.current.add('LCP');
            metricsRef.current.LCP = metric.value;
            reportMetric('LCP', metric.value);
          }
        });
      } catch (error) {
        // Fallback to manual tracking if web-vitals is not available
        console.warn('Web Vitals library not available, using manual tracking');
        trackWebVitalsManually();
      }
    };

    // Manual Web Vitals tracking fallback
    const trackWebVitalsManually = () => {
      // Track FCP manually
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(
        (entry) => entry.name === 'first-contentful-paint'
      );
      if (fcpEntry && !reportedRef.current.has('FCP')) {
        reportedRef.current.add('FCP');
        metricsRef.current.FCP = fcpEntry.startTime;
        reportMetric('FCP', fcpEntry.startTime);
      }

      // Track LCP manually using PerformanceObserver
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry && !reportedRef.current.has('LCP')) {
            reportedRef.current.add('LCP');
            metricsRef.current.LCP = lastEntry.startTime;
            reportMetric('LCP', lastEntry.startTime);
          }
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // Ignore if not supported
        }

        // Track CLS manually
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0 && !reportedRef.current.has('CLS')) {
            reportedRef.current.add('CLS');
            metricsRef.current.CLS = clsValue;
            reportMetric('CLS', clsValue);
          }
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // Ignore if not supported
        }

        // Track FID manually
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!reportedRef.current.has('FID')) {
              reportedRef.current.add('FID');
              metricsRef.current.FID =
                (entry as any).processingStart - entry.startTime;
              reportMetric('FID', metricsRef.current.FID!);
            }
          }
        });

        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          // Ignore if not supported
        }
      }
    };

    // Report individual metrics
    const reportMetric = (name: string, value: number) => {
      const thresholds =
        WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
      let rating: 'good' | 'needs-improvement' | 'poor' = 'good';

      if (thresholds) {
        if (value > thresholds.poor) {
          rating = 'poor';
        } else if (value > thresholds.good) {
          rating = 'needs-improvement';
        }
      }

      // Add breadcrumb for individual metric
      sentryMiningService.addMiningBreadcrumb(
        `Web Vital ${name}: ${value.toFixed(2)}ms (${rating})`,
        'api',
        {
          metric: name,
          value: value.toFixed(2),
          rating,
          page: pageName || 'unknown',
          userId,
        }
      );

      // Track in Sentry as custom metric
      performanceMonitoring.trackWebVitals({ [name]: value }, userId);
    };

    // Track additional mining-specific performance metrics
    const trackMiningSpecificMetrics = () => {
      // Track resource loading for mining-related assets
      const resourceEntries = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];

      let imageLoadTime = 0;
      let apiCallTime = 0;
      let totalResourceSize = 0;

      resourceEntries.forEach((entry) => {
        // Track image loading performance (important for mining site photos)
        if (
          entry.name.includes('.jpg') ||
          entry.name.includes('.png') ||
          entry.name.includes('.webp')
        ) {
          imageLoadTime = Math.max(
            imageLoadTime,
            entry.responseEnd - entry.startTime
          );
        }

        // Track API call performance
        if (entry.name.includes('/api/')) {
          apiCallTime = Math.max(
            apiCallTime,
            entry.responseEnd - entry.startTime
          );
        }

        // Track total transferred bytes
        if (entry.transferSize) {
          totalResourceSize += entry.transferSize;
        }
      });

      // Report mining-specific metrics
      if (imageLoadTime > 0) {
        sentryMiningService.addMiningBreadcrumb(
          `Image loading performance: ${imageLoadTime.toFixed(2)}ms`,
          'api',
          {
            metric: 'image_load_time',
            value: imageLoadTime.toFixed(2),
            page: pageName || 'unknown',
          }
        );
      }

      if (apiCallTime > 0) {
        sentryMiningService.addMiningBreadcrumb(
          `API call performance: ${apiCallTime.toFixed(2)}ms`,
          'api',
          {
            metric: 'api_call_time',
            value: apiCallTime.toFixed(2),
            page: pageName || 'unknown',
          }
        );
      }

      if (totalResourceSize > 0) {
        const sizeMB = totalResourceSize / (1024 * 1024);
        sentryMiningService.addMiningBreadcrumb(
          `Total resource size: ${sizeMB.toFixed(2)}MB`,
          'api',
          {
            metric: 'resource_size',
            value: sizeMB.toFixed(2),
            page: pageName || 'unknown',
          }
        );
      }
    };

    // Initialize tracking
    trackNavigationTiming();
    trackWebVitals();

    // Track mining-specific metrics after a delay to allow resources to load
    setTimeout(trackMiningSpecificMetrics, 2000);

    // Report all metrics at the end
    const reportAllMetrics = () => {
      if (Object.keys(metricsRef.current).length > 0) {
        performanceMonitoring.trackWebVitals(metricsRef.current, userId);

        sentryMiningService.addMiningBreadcrumb(
          'Complete Web Vitals report generated',
          'api',
          {
            metrics: metricsRef.current,
            page: pageName || 'unknown',
            userId,
          }
        );
      }
    };

    // Report metrics before page unload
    const handleBeforeUnload = () => {
      reportAllMetrics();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, pageName]);

  // This component doesn't render anything visible
  return null;
}

// Hook for easy integration
export function useWebVitalsTracking(userId?: string, pageName?: string) {
  useEffect(() => {
    // Track page view
    sentryMiningService.addMiningBreadcrumb(
      `Page view: ${pageName || window.location.pathname}`,
      'api',
      {
        page: pageName || window.location.pathname,
        userId,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      }
    );
  }, [userId, pageName]);
}
