'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  navigationTiming: {
    domContentLoaded: number;
    loadComplete: number;
  };
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    navigationTiming: {
      domContentLoaded: 0,
      loadComplete: 0,
    },
  });

  useEffect(() => {
    // Only run in production and if Performance API is available
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const reportWebVitals = async () => {
      try {
        // Dynamically import web-vitals to reduce bundle size
        const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import(
          'web-vitals'
        );

        onCLS((metric) => {
          setMetrics((prev) => ({ ...prev, cls: metric.value }));
          // Send to analytics
          sendToAnalytics('CLS', metric.value);
        });

        onINP((metric) => {
          setMetrics((prev) => ({ ...prev, fid: metric.value }));
          sendToAnalytics('INP', metric.value);
        });

        onFCP((metric) => {
          setMetrics((prev) => ({ ...prev, fcp: metric.value }));
          sendToAnalytics('FCP', metric.value);
        });

        onLCP((metric) => {
          setMetrics((prev) => ({ ...prev, lcp: metric.value }));
          sendToAnalytics('LCP', metric.value);
        });

        onTTFB((metric) => {
          setMetrics((prev) => ({ ...prev, ttfb: metric.value }));
          sendToAnalytics('TTFB', metric.value);
        });
      } catch (error) {}
    };

    // Navigation timing
    const getNavigationTiming = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        setMetrics((prev) => ({
          ...prev,
          navigationTiming: {
            domContentLoaded:
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          },
        }));
      }
    };

    // Memory usage monitoring (if available)
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        const usedMemory = memoryInfo.usedJSHeapSize / 1048576; // Convert to MB
        const totalMemory = memoryInfo.jsHeapSizeLimit / 1048576;

        if (usedMemory > totalMemory * 0.9) {
          console.warn(
            `High memory usage detected: ${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB`
          );
          sendToAnalytics('HighMemoryUsage', usedMemory);
        }
      }
    };

    // Long task monitoring
    const observeLongTasks = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                console.warn(
                  `Long task detected: ${entry.duration.toFixed(2)}ms`
                );
                sendToAnalytics('LongTask', entry.duration);
              }
            }
          });

          observer.observe({ entryTypes: ['longtask'] });

          return () => observer.disconnect();
        } catch (error) {}
      }
    };

    // Resource timing
    const analyzeResources = () => {
      const resources = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];

      // Find slow resources
      const slowResources = resources.filter((r) => r.duration > 1000);

      slowResources.forEach((resource) => {
        console.warn(
          `Slow resource: ${resource.name} took ${resource.duration.toFixed(2)}ms`
        );
        sendToAnalytics('SlowResource', resource.duration, {
          url: resource.name,
        });
      });

      // Analyze resource types
      const resourcesByType: Record<string, number> = {};
      resources.forEach((resource) => {
        const type = resource.initiatorType;
        resourcesByType[type] = (resourcesByType[type] || 0) + 1;
      });
    };

    // Run measurements
    reportWebVitals();
    getNavigationTiming();

    // Set up periodic monitoring
    const memoryInterval = setInterval(monitorMemory, 30000); // Check every 30s
    const cleanup = observeLongTasks();

    // Analyze resources after page load
    if (document.readyState === 'complete') {
      analyzeResources();
    } else {
      window.addEventListener('load', analyzeResources);
    }

    return () => {
      clearInterval(memoryInterval);
      if (cleanup) cleanup();
      window.removeEventListener('load', analyzeResources);
    };
  }, []);

  // Send metrics to analytics service
  const sendToAnalytics = (metric: string, value: number, metadata?: any) => {
    // In production, send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric, {
          value: Math.round(value),
          event_category: 'Web Vitals',
          event_label: metric,
          ...metadata,
        });
      }

      // Or send to custom analytics endpoint
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric,
          value,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          ...metadata,
        }),
      }).catch(() => {
        // Silently ignore analytics errors
      });
    }
  };

  // Don't render anything in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Development mode: Show metrics
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <h3 className="font-bold mb-2">Performance Metrics</h3>
      <div className="space-y-1">
        <div>FCP: {metrics.fcp?.toFixed(0) || '-'}ms</div>
        <div>LCP: {metrics.lcp?.toFixed(0) || '-'}ms</div>
        <div>FID: {metrics.fid?.toFixed(0) || '-'}ms</div>
        <div>CLS: {metrics.cls?.toFixed(3) || '-'}</div>
        <div>TTFB: {metrics.ttfb?.toFixed(0) || '-'}ms</div>
        <div className="pt-2 border-t border-white/20">
          <div>
            DOM: {metrics.navigationTiming.domContentLoaded.toFixed(0)}ms
          </div>
          <div>Load: {metrics.navigationTiming.loadComplete.toFixed(0)}ms</div>
        </div>
      </div>
    </div>
  );
}
