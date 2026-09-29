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
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
} as const;

interface WebVitalsTrackerProps {
  userId?: string;
  pageName?: string;
}

export function WebVitalsTracker({ userId, pageName }: WebVitalsTrackerProps) {
  const contextRef = useRef({ userId, pageName });
  useEffect(() => {
    contextRef.current = { userId, pageName };
  }, [userId, pageName]);
  const activeRef = useRef(false);
  const generationRef = useRef(0);
  const libraryRegisteredRef = useRef(false);
  const reportedRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    activeRef.current = true;
    const generation = ++generationRef.current;
    let localActive = true;
    const observers: PerformanceObserver[] = [];

    const reportMetric = (
      name: keyof WebVitalsMetrics,
      value: number,
      id = 'legacy'
    ) => {
      if (
        !activeRef.current ||
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0
      )
        return;
      const key = `${name}:${id}`;
      if (reportedRef.current.get(key) === value) return;
      reportedRef.current.set(key, value);
      const thresholds = WEB_VITALS_THRESHOLDS[name];
      const rating =
        value <= thresholds.good
          ? 'good'
          : value <= thresholds.poor
            ? 'needs-improvement'
            : 'poor';
      const { userId: currentUserId, pageName: currentPageName } =
        contextRef.current;
      const unit = name === 'CLS' ? '' : 'ms';
      sentryMiningService.addMiningBreadcrumb(
        `Web Vital ${name}: ${value.toFixed(2)}${unit} (${rating})`,
        'api',
        {
          metric: name,
          value: value.toFixed(2),
          rating,
          page: currentPageName || 'unknown',
          userId: currentUserId,
        }
      );
      performanceMonitoring.trackWebVitals({ [name]: value }, currentUserId);
    };

    // Track navigation timing
    const trackNavigationTiming = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        reportMetric('TTFB', ttfb);
      }
    };

    // Use Web Vitals library if available, fallback to manual tracking
    const trackWebVitals = async () => {
      try {
        // Try to import web-vitals dynamically - v5 uses different API
        const webVitals = await import('web-vitals');
        if (
          !activeRef.current ||
          generation !== generationRef.current ||
          libraryRegisteredRef.current
        )
          return;
        libraryRegisteredRef.current = true;

        // For web-vitals v5, use onMetric functions or direct imports
        if (webVitals.onCLS) {
          webVitals.onCLS((metric) =>
            reportMetric('CLS', metric.value, metric.id)
          );
        }

        // onFID is deprecated in v5, use onINP instead
        if (webVitals.onINP) {
          webVitals.onINP((metric) =>
            reportMetric('INP', metric.value, metric.id)
          );
        }

        if (webVitals.onFCP) {
          webVitals.onFCP((metric) =>
            reportMetric('FCP', metric.value, metric.id)
          );
        }

        if (webVitals.onLCP) {
          webVitals.onLCP((metric) =>
            reportMetric('LCP', metric.value, metric.id)
          );
        }
      } catch {
        // Fallback to manual tracking if web-vitals is not available
        if (localActive && activeRef.current) trackWebVitalsManually();
      }
    };

    // Manual Web Vitals tracking fallback
    const trackWebVitalsManually = () => {
      // Track FCP manually
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(
        (entry) => entry.name === 'first-contentful-paint'
      );
      if (fcpEntry) {
        reportMetric('FCP', fcpEntry.startTime);
      }

      // Track LCP manually using PerformanceObserver
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (localActive && lastEntry) {
            reportMetric('LCP', lastEntry.startTime);
          }
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          observers.push(lcpObserver);
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
          if (localActive) {
            reportMetric('CLS', clsValue);
          }
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          observers.push(clsObserver);
        } catch (e) {
          // Ignore if not supported
        }

        // Track FID manually
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (localActive && !reportedRef.current.has('FID:legacy')) {
              reportMetric(
                'FID',
                (entry as any).processingStart - entry.startTime
              );
            }
          }
        });

        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
          observers.push(fidObserver);
        } catch (e) {
          // Ignore if not supported
        }
      }
    };

    // Track additional mining-specific performance metrics
    const trackMiningSpecificMetrics = () => {
      const currentPageName = contextRef.current.pageName;
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
            page: currentPageName || 'unknown',
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
            page: currentPageName || 'unknown',
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
            page: currentPageName || 'unknown',
          }
        );
      }
    };

    // Initialize tracking
    trackNavigationTiming();
    trackWebVitals();

    // Track mining-specific metrics after a delay to allow resources to load
    const resourceTimer = setTimeout(() => {
      if (localActive) trackMiningSpecificMetrics();
    }, 2000);

    // Cleanup
    return () => {
      localActive = false;
      activeRef.current = false;
      clearTimeout(resourceTimer);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

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
