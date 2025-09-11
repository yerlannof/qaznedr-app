/**
 * Performance monitoring utilities for QAZNEDR.KZ
 */

import { logger } from './logger';

// Performance metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  labels?: Record<string, string>;
}

// Performance monitoring class
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize performance monitoring
  init(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor resource loading
    this.observeResourceTiming();

    // Monitor navigation timing
    this.observeNavigationTiming();
  }

  // Record custom metric
  recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' = 'ms',
    labels?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      labels,
    };

    this.metrics.push(metric);

    // Log significant metrics
    if (this.isSignificantMetric(metric)) {
      logger.info('Performance metric', {
        metric: metric.name,
        value: metric.value,
        unit: metric.unit,
        labels: metric.labels,
      });
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Observe Web Vitals
  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('lcp', lastEntry.startTime, 'ms');
    });

    // First Input Delay (FID) - approximated with first input
    this.createObserver('first-input', (entries) => {
      const entry = entries[0] as any;
      const fid = (entry.processingStart || 0) - entry.startTime;
      this.recordMetric('fid', fid, 'ms');
    });

    // Cumulative Layout Shift (CLS)
    this.createObserver('layout-shift', (entries) => {
      let clsValue = 0;
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordMetric('cls', clsValue, 'count');
    });
  }

  // Observe resource timing
  private observeResourceTiming(): void {
    this.createObserver('resource', (entries) => {
      for (const entry of entries) {
        const resource = entry as PerformanceResourceTiming;

        // Record resource load times
        this.recordMetric('resource_load_time', resource.duration, 'ms', {
          resource_type: resource.initiatorType,
          resource_name: resource.name,
        });

        // Record resource sizes
        if (resource.transferSize > 0) {
          this.recordMetric('resource_size', resource.transferSize, 'bytes', {
            resource_type: resource.initiatorType,
            resource_name: resource.name,
          });
        }
      }
    });
  }

  // Observe navigation timing
  private observeNavigationTiming(): void {
    this.createObserver('navigation', (entries) => {
      const entry = entries[0] as PerformanceNavigationTiming;

      // DNS lookup time
      this.recordMetric(
        'dns_lookup_time',
        entry.domainLookupEnd - entry.domainLookupStart,
        'ms'
      );

      // TCP connection time
      this.recordMetric(
        'tcp_connection_time',
        entry.connectEnd - entry.connectStart,
        'ms'
      );

      // Server response time
      this.recordMetric(
        'server_response_time',
        entry.responseEnd - entry.requestStart,
        'ms'
      );

      // DOM content loaded
      this.recordMetric(
        'dom_content_loaded',
        entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        'ms'
      );

      // Page load complete
      this.recordMetric(
        'page_load_complete',
        entry.loadEventEnd - entry.loadEventStart,
        'ms'
      );
    });
  }

  // Create performance observer
  private createObserver(
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ entryTypes: [type] });
      this.observers.push(observer);
    } catch {
      // Observer not supported, ignore
      console.warn(`Performance observer for ${type} not supported`);
    }
  }

  // Check if metric is significant for logging
  private isSignificantMetric(metric: PerformanceMetric): boolean {
    const thresholds = {
      lcp: 2500, // LCP > 2.5s
      fid: 100, // FID > 100ms
      cls: 0.1, // CLS > 0.1
      server_response_time: 200, // Server response > 200ms
      page_load_complete: 3000, // Page load > 3s
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    return threshold ? metric.value > threshold : false;
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions for measuring performance
export function measureAsync<T>(
  name: string,
  asyncFn: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T> {
  const startTime = performance.now();

  return asyncFn().finally(() => {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(name, duration, 'ms', labels);
  });
}

export function measure<T>(
  name: string,
  fn: () => T,
  labels?: Record<string, string>
): T {
  const startTime = performance.now();

  try {
    return fn();
  } finally {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(name, duration, 'ms', labels);
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  return {
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    measureAsync,
    measure,
  };
}

// Bundle size analyzer
export function analyzeBundleSize(): void {
  if (typeof window === 'undefined') return;

  // Measure initial bundle size from network tab
  const resourceEntries = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];

  let totalJSSize = 0;
  let totalCSSSize = 0;

  resourceEntries.forEach((entry) => {
    if (entry.name.includes('.js')) {
      totalJSSize += entry.transferSize || 0;
    } else if (entry.name.includes('.css')) {
      totalCSSSize += entry.transferSize || 0;
    }
  });

  performanceMonitor.recordMetric('bundle_js_size', totalJSSize, 'bytes');
  performanceMonitor.recordMetric('bundle_css_size', totalCSSSize, 'bytes');

  logger.info('Bundle size analysis', {
    jsSize: `${(totalJSSize / 1024).toFixed(2)} KB`,
    cssSize: `${(totalCSSSize / 1024).toFixed(2)} KB`,
    total: `${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`,
  });
}

// Memory usage monitoring
export function monitorMemoryUsage(): void {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const memory = (performance as any).memory;

  performanceMonitor.recordMetric(
    'memory_used',
    memory.usedJSHeapSize,
    'bytes'
  );
  performanceMonitor.recordMetric(
    'memory_total',
    memory.totalJSHeapSize,
    'bytes'
  );
  performanceMonitor.recordMetric(
    'memory_limit',
    memory.jsHeapSizeLimit,
    'bytes'
  );

  // Warn if memory usage is high
  const memoryUsagePercent =
    (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  if (memoryUsagePercent > 80) {
    logger.warn('High memory usage detected', {
      usagePercent: memoryUsagePercent.toFixed(2) + '%',
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });
  }
}

// Initialize performance monitoring on client side
if (typeof window !== 'undefined') {
  // Initialize after page load
  window.addEventListener('load', () => {
    performanceMonitor.init();
    analyzeBundleSize();

    // Monitor memory usage every 30 seconds
    setInterval(monitorMemoryUsage, 30000);
  });
}
