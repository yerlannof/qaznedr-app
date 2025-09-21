import { NextRequest, NextResponse } from 'next/server';
import {
  sentryMiningService,
  MiningErrorType,
  MiningMetric,
} from '@/lib/monitoring/sentry-service';
import * as Sentry from '@sentry/nextjs';

// Performance thresholds for different operation types
const PERFORMANCE_THRESHOLDS = {
  api_response: {
    fast: 200,
    medium: 500,
    slow: 1000,
    critical: 3000,
  },
  database_query: {
    fast: 50,
    medium: 200,
    slow: 500,
    critical: 1000,
  },
  search_operation: {
    fast: 100,
    medium: 300,
    slow: 800,
    critical: 2000,
  },
  cache_operation: {
    fast: 10,
    medium: 50,
    slow: 100,
    critical: 200,
  },
} as const;

// Core Web Vitals tracking
export interface WebVitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

// Mining-specific performance metrics
export interface MiningPerformanceMetrics {
  apiResponseTime: number;
  databaseQueryTime: number;
  cacheOperations: number;
  searchQueryTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  activeConnections?: number;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private requestStartTimes = new Map<string, number>();
  private operationCounters = new Map<string, number>();

  static getInstance(): PerformanceMonitoringService {
    if (!this.instance) {
      this.instance = new PerformanceMonitoringService();
    }
    return this.instance;
  }

  /**
   * Middleware for API performance monitoring - Updated for Sentry v8
   */
  async monitorApiRequest(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const url = request.url;
    const method = request.method;

    // Store start time
    this.requestStartTimes.set(requestId, startTime);

    // Configure Sentry for this request
    sentryMiningService.configureRequestMonitoring(request);

    // Start Sentry trace using v8 API
    return await Sentry.startNewTrace(async () => {
      return await Sentry.startSpan(
        {
          name: `${method} ${new URL(url).pathname}`,
          op: 'http.server',
        },
        async (span) => {
          // Add request context
          // span.setData('request', {
          //   method,
          //   url,
          //   headers: Object.fromEntries(request.headers.entries()),
          //   userAgent: request.headers.get('user-agent'),
          // });

          try {
            // Add breadcrumb for request start
            sentryMiningService.addMiningBreadcrumb(
              `API request started: ${method} ${url}`,
              'api',
              { requestId, method, url }
            );

            // Execute the handler
            const response = await handler(request);

            const duration = Date.now() - startTime;

            // Set success status
            span.setStatus('ok');
            // span.setData('response', {
            //   status: response.status,
            //   duration,
            // });

            // Track performance metrics
            this.trackApiPerformance(method, url, duration, response.status);

            // Add success breadcrumb
            sentryMiningService.addMiningBreadcrumb(
              `API request completed: ${method} ${url} (${duration}ms)`,
              'api',
              {
                requestId,
                method,
                url,
                duration,
                status: response.status,
                performanceCategory: this.categorizePerformance(
                  duration,
                  'api_response'
                ),
              }
            );

            return response;
          } catch (error) {
            const duration = Date.now() - startTime;

            // Set error status
            span.setStatus('internal_error');
            // span.setData('error', {
            //   message: (error as Error).message,
            //   duration,
            // });

            // Capture error with enhanced context
            sentryMiningService.captureError(
              error as Error,
              this.determineErrorType(url),
              {
                apiEndpoint: url,
                operationId: requestId,
              }
            );

            // Track failed request
            this.trackApiPerformance(
              method,
              url,
              duration,
              500,
              error as Error
            );

            throw error;
          } finally {
            // Clean up
            this.requestStartTimes.delete(requestId);
          }
        }
      );
    });
  }

  /**
   * Monitor database operations - Updated for Sentry v8
   */
  async monitorDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    tableName?: string
  ): Promise<T> {
    const startTime = Date.now();
    const operationId = this.generateOperationId();

    return await Sentry.startSpan(
      {
        op: 'db.query',
        name: operationName,
      },
      async (span) => {
        // // span.setData('db.operation', operationName);
        // if (tableName) {
        //   // span.setData('db.table', tableName);
        // }

        try {
          sentryMiningService.addMiningBreadcrumb(
            `Database operation started: ${operationName}`,
            'database',
            { operationId, tableName }
          );

          const result = await operation();
          const duration = Date.now() - startTime;

          // Track successful database operation
          this.trackDatabasePerformance(operationName, duration, tableName);

          // span.setData('duration_ms', duration);
          span.setStatus('ok');

          sentryMiningService.addMiningBreadcrumb(
            `Database operation completed: ${operationName} (${duration}ms)`,
            'database',
            {
              operationId,
              tableName,
              duration,
              performanceCategory: this.categorizePerformance(
                duration,
                'database_query'
              ),
            }
          );

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;

          span.setStatus('internal_error');
          // // span.setData('error', (error as Error).message);
          // // span.setData('duration_ms', duration);

          sentryMiningService.captureError(
            error as Error,
            MiningErrorType.DATABASE_CONNECTION_ERROR,
            { apiEndpoint: operationName }
          );

          throw error;
        }
      }
    );
  }

  /**
   * Monitor search operations - Updated for Sentry v8
   */
  async monitorSearchOperation<T>(
    operation: () => Promise<T>,
    query: string,
    searchType: 'elasticsearch' | 'supabase' = 'supabase'
  ): Promise<T> {
    const startTime = Date.now();
    const operationId = this.generateOperationId();

    return await Sentry.startSpan(
      {
        op: 'search.query',
        name: `${searchType} search: ${query}`,
      },
      async (span) => {
        // // span.setData('search.engine', searchType);
        // // span.setData('search.query', query.substring(0, 100)); // Limit query length

        try {
          sentryMiningService.addMiningBreadcrumb(
            `Search operation started: ${searchType}`,
            'search',
            { operationId, query: query.substring(0, 50), searchType }
          );

          const result = await operation();
          const duration = Date.now() - startTime;

          // Track successful search
          this.trackSearchPerformance(query, duration, searchType);

          // span.setData('duration_ms', duration);
          span.setStatus('ok');

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;

          span.setStatus('internal_error');
          // span.setData('duration_ms', duration);

          sentryMiningService.captureError(
            error as Error,
            MiningErrorType.SEARCH_QUERY_FAILED,
            { searchQuery: query }
          );

          throw error;
        }
      }
    );
  }

  /**
   * Track Web Vitals metrics
   */
  trackWebVitals(metrics: WebVitalsMetrics, userId?: string): void {
    // Track Core Web Vitals
    if (metrics.FCP) {
      sentryMiningService.trackMetric(
        MiningMetric.API_REQUEST_PROCESSED,
        metrics.FCP,
        { userId },
        {
          metric_type: 'fcp',
          performance_category:
            metrics.FCP < 1800
              ? 'good'
              : metrics.FCP < 3000
                ? 'needs_improvement'
                : 'poor',
        }
      );
    }

    if (metrics.LCP) {
      sentryMiningService.trackMetric(
        MiningMetric.API_REQUEST_PROCESSED,
        metrics.LCP,
        { userId },
        {
          metric_type: 'lcp',
          performance_category:
            metrics.LCP < 2500
              ? 'good'
              : metrics.LCP < 4000
                ? 'needs_improvement'
                : 'poor',
        }
      );
    }

    if (metrics.FID) {
      sentryMiningService.trackMetric(
        MiningMetric.API_REQUEST_PROCESSED,
        metrics.FID,
        { userId },
        {
          metric_type: 'fid',
          performance_category:
            metrics.FID < 100
              ? 'good'
              : metrics.FID < 300
                ? 'needs_improvement'
                : 'poor',
        }
      );
    }

    if (metrics.CLS) {
      sentryMiningService.trackMetric(
        MiningMetric.API_REQUEST_PROCESSED,
        metrics.CLS,
        { userId },
        {
          metric_type: 'cls',
          performance_category:
            metrics.CLS < 0.1
              ? 'good'
              : metrics.CLS < 0.25
                ? 'needs_improvement'
                : 'poor',
        }
      );
    }

    // Add comprehensive breadcrumb
    sentryMiningService.addMiningBreadcrumb(
      'Web Vitals metrics recorded',
      'api',
      { ...metrics, userId },
      'info'
    );
  }

  /**
   * Track API performance metrics
   */
  private trackApiPerformance(
    method: string,
    url: string,
    duration: number,
    status: number,
    error?: Error
  ): void {
    const endpoint = new URL(url).pathname;
    const performanceCategory = this.categorizePerformance(
      duration,
      'api_response'
    );

    sentryMiningService.trackMetric(
      MiningMetric.API_REQUEST_PROCESSED,
      1,
      { apiEndpoint: endpoint },
      {
        method,
        endpoint,
        status: status.toString(),
        performance_category: performanceCategory,
        success: (!error).toString(),
      }
    );

    // Alert on poor performance
    if (performanceCategory === 'critical') {
      sentryMiningService.captureError(
        new Error(
          `Slow API response: ${method} ${endpoint} took ${duration}ms`
        ),
        MiningErrorType.EXTERNAL_API_ERROR,
        { apiEndpoint: endpoint },
        'warning'
      );
    }
  }

  /**
   * Track database performance metrics
   */
  private trackDatabasePerformance(
    operationName: string,
    duration: number,
    tableName?: string
  ): void {
    const performanceCategory = this.categorizePerformance(
      duration,
      'database_query'
    );

    sentryMiningService.trackMetric(
      MiningMetric.DATABASE_QUERY_EXECUTED,
      1,
      {},
      {
        operation: operationName,
        table: tableName || 'unknown',
        performance_category: performanceCategory,
      }
    );

    // Alert on slow queries
    if (performanceCategory === 'critical') {
      sentryMiningService.captureError(
        new Error(`Slow database query: ${operationName} took ${duration}ms`),
        MiningErrorType.DATABASE_CONNECTION_ERROR,
        { apiEndpoint: operationName },
        'warning'
      );
    }
  }

  /**
   * Track search performance metrics
   */
  private trackSearchPerformance(
    query: string,
    duration: number,
    searchType: string
  ): void {
    const performanceCategory = this.categorizePerformance(
      duration,
      'search_operation'
    );

    sentryMiningService.trackMetric(
      MiningMetric.SEARCH_PERFORMED,
      1,
      { searchQuery: query },
      {
        search_type: searchType,
        performance_category: performanceCategory,
        query_length: query.length.toString(),
      }
    );
  }

  /**
   * Categorize performance based on thresholds
   */
  private categorizePerformance(
    duration: number,
    operationType: keyof typeof PERFORMANCE_THRESHOLDS
  ): string {
    const thresholds = PERFORMANCE_THRESHOLDS[operationType];

    if (duration < thresholds.fast) return 'fast';
    if (duration < thresholds.medium) return 'medium';
    if (duration < thresholds.slow) return 'slow';
    if (duration < thresholds.critical) return 'very_slow';
    return 'critical';
  }

  /**
   * Determine error type based on URL
   */
  private determineErrorType(url: string): MiningErrorType {
    if (url.includes('/api/listings'))
      return MiningErrorType.LISTING_CREATION_FAILED;
    if (url.includes('/api/search')) return MiningErrorType.SEARCH_QUERY_FAILED;
    if (url.includes('/api/auth')) return MiningErrorType.AUTHENTICATION_ERROR;
    if (url.includes('/api/admin/transactions'))
      return MiningErrorType.TRANSACTION_FAILED;
    return MiningErrorType.EXTERNAL_API_ERROR;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats(): MiningPerformanceMetrics {
    return {
      apiResponseTime: 0, // This would be calculated from recent requests
      databaseQueryTime: 0, // This would be calculated from recent queries
      cacheOperations: 0, // This would be calculated from cache metrics
      memoryUsage: process.memoryUsage().heapUsed,
      activeConnections: this.requestStartTimes.size,
    };
  }
}

// Export singleton instance
export const performanceMonitoring = PerformanceMonitoringService.getInstance();

// Export middleware wrapper
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    return performanceMonitoring.monitorApiRequest(request, handler);
  };
}
