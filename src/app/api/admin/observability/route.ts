import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthLevel } from '@/lib/middleware/auth-middleware';
import { withRateLimit } from '@/lib/middleware/rate-limiting';
import { transactionManager } from '@/lib/database/transaction-manager';
import { performanceMonitoring } from '@/lib/middleware/performance-monitoring';
import {
  sentryMiningService,
  MiningErrorType,
} from '@/lib/monitoring/sentry-service';
import * as Sentry from '@sentry/nextjs';

// Observability metrics interface
interface ObservabilityMetrics {
  // System Health
  systemHealth: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: number;
    timestamp: string;
  };

  // Database Metrics
  database: {
    activeTransactions: number;
    totalOperations: number;
    averageOperationsPerTransaction: number;
    oldestTransaction?: string;
    connectionHealth: 'healthy' | 'degraded' | 'critical';
  };

  // Performance Metrics
  performance: {
    apiResponseTime: number;
    databaseQueryTime: number;
    cacheOperations: number;
    errorRate: number;
    throughput: number;
  };

  // Mining-Specific Metrics
  mining: {
    totalListings: number;
    listingsCreatedToday: number;
    searchesPerformed: number;
    topMinerals: Array<{ mineral: string; count: number }>;
    topRegions: Array<{ region: string; count: number }>;
    userActivity: {
      totalUsers: number;
      activeUsersToday: number;
      newRegistrationsToday: number;
    };
  };

  // Error Tracking
  errors: {
    totalErrors24h: number;
    errorsByType: Array<{ type: string; count: number }>;
    criticalErrors: number;
    lastError?: {
      message: string;
      timestamp: string;
      type: string;
    };
  };

  // Cache Performance
  cache: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    averageResponseTime: number;
  };
}

// Get system health metrics
async function getSystemHealth(): Promise<
  ObservabilityMetrics['systemHealth']
> {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return {
    uptime,
    memoryUsage,
    timestamp: new Date().toISOString(),
  };
}

// Get database metrics from transaction manager
async function getDatabaseMetrics(): Promise<ObservabilityMetrics['database']> {
  const stats = transactionManager.getTransactionStats();

  return {
    activeTransactions: stats.active,
    totalOperations: stats.totalOperations,
    averageOperationsPerTransaction: stats.averageOperationsPerTransaction,
    oldestTransaction: stats.oldestTransaction,
    connectionHealth:
      stats.active < 10
        ? 'healthy'
        : stats.active < 50
          ? 'degraded'
          : 'critical',
  };
}

// Get performance metrics
async function getPerformanceMetrics(): Promise<
  ObservabilityMetrics['performance']
> {
  const performanceStats = performanceMonitoring.getPerformanceStats();

  return {
    apiResponseTime: performanceStats.apiResponseTime,
    databaseQueryTime: performanceStats.databaseQueryTime,
    cacheOperations: performanceStats.cacheOperations || 0,
    errorRate: 0, // This would need to be calculated from actual metrics
    throughput: 0, // This would need to be calculated from request logs
  };
}

// Get mining-specific business metrics
async function getMiningMetrics(): Promise<ObservabilityMetrics['mining']> {
  try {
    // This would typically come from your analytics database
    // For now, we'll return mock data that represents what you'd track
    return {
      totalListings: 1250,
      listingsCreatedToday: 15,
      searchesPerformed: 3420,
      topMinerals: [
        { mineral: 'Gold', count: 234 },
        { mineral: 'Copper', count: 187 },
        { mineral: 'Oil', count: 156 },
        { mineral: 'Coal', count: 143 },
        { mineral: 'Uranium', count: 98 },
      ],
      topRegions: [
        { region: 'Atyrau', count: 312 },
        { region: 'Mangistau', count: 287 },
        { region: 'Almaty', count: 234 },
        { region: 'Nur-Sultan', count: 198 },
        { region: 'Shymkent', count: 167 },
      ],
      userActivity: {
        totalUsers: 2847,
        activeUsersToday: 156,
        newRegistrationsToday: 8,
      },
    };
  } catch (error) {
    sentryMiningService.captureError(
      error as Error,
      MiningErrorType.DATABASE_CONNECTION_ERROR,
      { apiEndpoint: '/api/admin/observability' }
    );

    // Return empty metrics on error
    return {
      totalListings: 0,
      listingsCreatedToday: 0,
      searchesPerformed: 0,
      topMinerals: [],
      topRegions: [],
      userActivity: {
        totalUsers: 0,
        activeUsersToday: 0,
        newRegistrationsToday: 0,
      },
    };
  }
}

// Get error tracking metrics
async function getErrorMetrics(): Promise<ObservabilityMetrics['errors']> {
  // In a real implementation, this would pull from Sentry API or your error logging system
  return {
    totalErrors24h: 23,
    errorsByType: [
      { type: 'SEARCH_QUERY_FAILED', count: 8 },
      { type: 'LISTING_CREATION_FAILED', count: 6 },
      { type: 'DATABASE_CONNECTION_ERROR', count: 4 },
      { type: 'AUTHENTICATION_ERROR', count: 3 },
      { type: 'VALIDATION_ERROR', count: 2 },
    ],
    criticalErrors: 2,
    lastError: {
      message: 'Database connection timeout',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: 'DATABASE_CONNECTION_ERROR',
    },
  };
}

// Get cache performance metrics
async function getCacheMetrics(): Promise<ObservabilityMetrics['cache']> {
  // This would typically come from Redis metrics
  return {
    hitRate: 85.4,
    missRate: 14.6,
    totalRequests: 15423,
    averageResponseTime: 12.3,
  };
}

// Get real-time alerts
async function getRealTimeAlerts() {
  const alerts = [];

  // Check system health
  const systemHealth = await getSystemHealth();
  const memoryUsagePercent =
    (systemHealth.memoryUsage.heapUsed / systemHealth.memoryUsage.heapTotal) *
    100;

  if (memoryUsagePercent > 80) {
    alerts.push({
      level: 'warning',
      message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
      timestamp: new Date().toISOString(),
      type: 'system',
    });
  }

  // Check database health
  const dbMetrics = await getDatabaseMetrics();
  if (dbMetrics.activeTransactions > 50) {
    alerts.push({
      level: 'critical',
      message: `High number of active transactions: ${dbMetrics.activeTransactions}`,
      timestamp: new Date().toISOString(),
      type: 'database',
    });
  }

  // Check error rate
  const errorMetrics = await getErrorMetrics();
  if (errorMetrics.criticalErrors > 5) {
    alerts.push({
      level: 'critical',
      message: `High number of critical errors: ${errorMetrics.criticalErrors}`,
      timestamp: new Date().toISOString(),
      type: 'errors',
    });
  }

  return alerts;
}

// Main observability handler
async function handleObservabilityRequest(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';

    sentryMiningService.addMiningBreadcrumb(
      `Observability API: ${action}`,
      'api',
      { action, endpoint: '/api/admin/observability' }
    );

    switch (action) {
      case 'metrics':
        // Get comprehensive metrics
        const metrics: ObservabilityMetrics = {
          systemHealth: await getSystemHealth(),
          database: await getDatabaseMetrics(),
          performance: await getPerformanceMetrics(),
          mining: await getMiningMetrics(),
          errors: await getErrorMetrics(),
          cache: await getCacheMetrics(),
        };

        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString(),
        });

      case 'alerts':
        // Get real-time alerts
        const alerts = await getRealTimeAlerts();

        return NextResponse.json({
          success: true,
          data: { alerts },
          timestamp: new Date().toISOString(),
        });

      case 'health':
        // Simple health check
        const health = await getSystemHealth();
        const dbHealth = await getDatabaseMetrics();

        const overallHealth =
          dbHealth.connectionHealth === 'healthy' &&
          health.memoryUsage.heapUsed / health.memoryUsage.heapTotal < 0.8
            ? 'healthy'
            : 'degraded';

        return NextResponse.json({
          success: true,
          data: {
            status: overallHealth,
            uptime: health.uptime,
            timestamp: health.timestamp,
            components: {
              database: dbHealth.connectionHealth,
              memory:
                health.memoryUsage.heapUsed / health.memoryUsage.heapTotal < 0.8
                  ? 'healthy'
                  : 'degraded',
            },
          },
        });

      case 'sentry-test':
        // Test Sentry integration
        try {
          // Capture a test event
          const eventId = sentryMiningService.captureError(
            new Error('Test error from observability endpoint'),
            MiningErrorType.EXTERNAL_API_ERROR,
            {
              apiEndpoint: '/api/admin/observability',
              operationId: 'sentry-test',
            },
            'info'
          );

          return NextResponse.json({
            success: true,
            data: {
              message: 'Test error sent to Sentry',
              eventId,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to send test error to Sentry',
              details: (error as Error).message,
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            availableActions: ['metrics', 'alerts', 'health', 'sentry-test'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Observability endpoint error:', error);

    sentryMiningService.captureError(
      error as Error,
      MiningErrorType.EXTERNAL_API_ERROR,
      { apiEndpoint: '/api/admin/observability' }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get observability metrics',
      },
      { status: 500 }
    );
  }
}

// Export with security middleware
export const GET = withRateLimit(
  withAuth(handleObservabilityRequest, AuthLevel.ADMIN),
  'admin'
);

export const POST = withRateLimit(
  withAuth(handleObservabilityRequest, AuthLevel.ADMIN),
  'admin'
);
