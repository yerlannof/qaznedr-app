import { NextRequest, NextResponse } from 'next/server';
import { transactionManager } from '@/lib/database/transaction-manager';
import { performanceMonitoring } from '@/lib/middleware/performance-monitoring';
import {
  sentryMiningService,
  MiningErrorType,
} from '@/lib/monitoring/sentry-service';

// Test version of observability metrics (no auth required)
interface TestObservabilityMetrics {
  systemHealth: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    timestamp: string;
    status: 'healthy' | 'degraded' | 'critical';
  };

  database: {
    activeTransactions: number;
    totalOperations: number;
    averageOperationsPerTransaction: number;
    connectionHealth: 'healthy' | 'degraded' | 'critical';
  };

  performance: {
    apiResponseTime: number;
    databaseQueryTime: number;
    cacheOperations: number;
    errorRate: number;
    throughput: number;
  };

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

  errors: {
    totalErrors24h: number;
    errorsByType: Array<{ type: string; count: number }>;
    criticalErrors: number;
  };

  cache: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    averageResponseTime: number;
  };
}

// Get test system health metrics
async function getTestSystemHealth(): Promise<
  TestObservabilityMetrics['systemHealth']
> {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // Calculate health status based on memory usage
  const memoryUsagePercent =
    (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  const status =
    memoryUsagePercent < 70
      ? 'healthy'
      : memoryUsagePercent < 85
        ? 'degraded'
        : 'critical';

  return {
    uptime,
    memoryUsage,
    timestamp: new Date().toISOString(),
    status,
  };
}

// Get test database metrics
async function getTestDatabaseMetrics(): Promise<
  TestObservabilityMetrics['database']
> {
  try {
    const stats = transactionManager.getTransactionStats();

    return {
      activeTransactions: stats.active,
      totalOperations: stats.totalOperations,
      averageOperationsPerTransaction: stats.averageOperationsPerTransaction,
      connectionHealth:
        stats.active < 10
          ? 'healthy'
          : stats.active < 50
            ? 'degraded'
            : 'critical',
    };
  } catch (error) {
    // Return default values if transaction manager is not available
    return {
      activeTransactions: 0,
      totalOperations: 1250,
      averageOperationsPerTransaction: 3.2,
      connectionHealth: 'healthy',
    };
  }
}

// Get test performance metrics
async function getTestPerformanceMetrics(): Promise<
  TestObservabilityMetrics['performance']
> {
  try {
    const performanceStats = performanceMonitoring.getPerformanceStats();

    return {
      apiResponseTime: performanceStats.apiResponseTime || 145,
      databaseQueryTime: performanceStats.databaseQueryTime || 23,
      cacheOperations: performanceStats.cacheOperations || 1456,
      errorRate: 0.3, // 0.3% error rate
      throughput: 125, // requests per minute
    };
  } catch (error) {
    // Return mock performance data
    return {
      apiResponseTime: 145,
      databaseQueryTime: 23,
      cacheOperations: 1456,
      errorRate: 0.3,
      throughput: 125,
    };
  }
}

// Get test mining-specific metrics
async function getTestMiningMetrics(): Promise<
  TestObservabilityMetrics['mining']
> {
  return {
    totalListings: 1347,
    listingsCreatedToday: 18,
    searchesPerformed: 4251,
    topMinerals: [
      { mineral: 'Нефть', count: 287 },
      { mineral: 'Золото', count: 234 },
      { mineral: 'Медь', count: 198 },
      { mineral: 'Уголь', count: 176 },
      { mineral: 'Уран', count: 143 },
    ],
    topRegions: [
      { region: 'Атырауская область', count: 324 },
      { region: 'Мангистауская область', count: 298 },
      { region: 'Алматинская область', count: 256 },
      { region: 'Карагандинская область', count: 212 },
      { region: 'Актюбинская область', count: 178 },
    ],
    userActivity: {
      totalUsers: 3156,
      activeUsersToday: 187,
      newRegistrationsToday: 12,
    },
  };
}

// Get test error metrics
async function getTestErrorMetrics(): Promise<
  TestObservabilityMetrics['errors']
> {
  return {
    totalErrors24h: 34,
    errorsByType: [
      { type: 'SEARCH_QUERY_FAILED', count: 12 },
      { type: 'LISTING_CREATION_FAILED', count: 8 },
      { type: 'DATABASE_CONNECTION_ERROR', count: 6 },
      { type: 'AUTHENTICATION_ERROR', count: 4 },
      { type: 'VALIDATION_ERROR', count: 4 },
    ],
    criticalErrors: 2,
  };
}

// Get test cache metrics
async function getTestCacheMetrics(): Promise<
  TestObservabilityMetrics['cache']
> {
  return {
    hitRate: 87.3,
    missRate: 12.7,
    totalRequests: 18745,
    averageResponseTime: 8.4,
  };
}

// Get real-time test alerts
async function getTestRealTimeAlerts() {
  const alerts = [];

  // Check system health
  const systemHealth = await getTestSystemHealth();
  const memoryUsagePercent =
    (systemHealth.memoryUsage.heapUsed / systemHealth.memoryUsage.heapTotal) *
    100;

  if (memoryUsagePercent > 75) {
    alerts.push({
      level: 'warning',
      message: `Умеренное использование памяти: ${memoryUsagePercent.toFixed(1)}%`,
      timestamp: new Date().toISOString(),
      type: 'system',
      recommendation: 'Мониторинг использования памяти, возможна очистка кэша',
    });
  }

  // Check mining-specific alerts
  const miningMetrics = await getTestMiningMetrics();
  if (miningMetrics.listingsCreatedToday < 10) {
    alerts.push({
      level: 'info',
      message: `Низкая активность создания листингов: ${miningMetrics.listingsCreatedToday} сегодня`,
      timestamp: new Date().toISOString(),
      type: 'business',
      recommendation: 'Возможно стоит активизировать маркетинговые усилия',
    });
  }

  // Mock cache alert
  const cacheMetrics = await getTestCacheMetrics();
  if (cacheMetrics.hitRate < 90) {
    alerts.push({
      level: 'info',
      message: `Коэффициент попаданий в кэш: ${cacheMetrics.hitRate}%`,
      timestamp: new Date().toISOString(),
      type: 'performance',
      recommendation: 'Рассмотреть оптимизацию стратегии кэширования',
    });
  }

  return alerts;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';

    sentryMiningService.addMiningBreadcrumb(
      `Test Observability API: ${action}`,
      'api',
      { action, endpoint: '/api/test-observability' }
    );

    switch (action) {
      case 'metrics':
        // Get comprehensive test metrics
        const metrics: TestObservabilityMetrics = {
          systemHealth: await getTestSystemHealth(),
          database: await getTestDatabaseMetrics(),
          performance: await getTestPerformanceMetrics(),
          mining: await getTestMiningMetrics(),
          errors: await getTestErrorMetrics(),
          cache: await getTestCacheMetrics(),
        };

        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString(),
          note: 'This is a test version with mock data for demonstration purposes',
        });

      case 'alerts':
        // Get test real-time alerts
        const alerts = await getTestRealTimeAlerts();

        return NextResponse.json({
          success: true,
          data: {
            alerts,
            alertSummary: {
              total: alerts.length,
              critical: alerts.filter((a) => a.level === 'critical').length,
              warning: alerts.filter((a) => a.level === 'warning').length,
              info: alerts.filter((a) => a.level === 'info').length,
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'health':
        // Simple test health check
        const health = await getTestSystemHealth();
        const dbHealth = await getTestDatabaseMetrics();

        const overallHealth =
          dbHealth.connectionHealth === 'healthy' && health.status === 'healthy'
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
              memory: health.status,
              api: 'healthy',
              cache: 'healthy',
            },
            healthScore: overallHealth === 'healthy' ? 95 : 78,
          },
        });

      case 'mining_dashboard':
        // Mining-specific dashboard data
        const miningData = await getTestMiningMetrics();
        const systemData = await getTestSystemHealth();

        return NextResponse.json({
          success: true,
          data: {
            miningOverview: miningData,
            systemStatus: systemData,
            kpis: {
              conversionRate: 3.4, // % of searches that result in inquiries
              averageListingValue: 2500000, // in KZT
              topPerformingRegion: miningData.topRegions[0],
              topPerformingMineral: miningData.topMinerals[0],
            },
            trends: {
              listingsGrowth: '+12%',
              userGrowth: '+8%',
              searchVolumeGrowth: '+15%',
              revenueGrowth: '+22%',
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'sentry_integration':
        // Test Sentry integration with observability
        const testEventId = sentryMiningService.captureError(
          new Error('Test observability integration with Sentry'),
          MiningErrorType.EXTERNAL_API_ERROR,
          {
            observabilityEndpoint: '/api/test-observability',
            testType: 'sentry_integration',
          },
          'info'
        );

        return NextResponse.json({
          success: true,
          data: {
            message: 'Sentry integration test completed',
            eventId: testEventId,
            sentryStatus: 'working',
            monitoringCapabilities: [
              'Error tracking and alerting',
              'Performance monitoring',
              'Mining-specific context',
              'Real-time dashboards',
              'Custom metrics tracking',
            ],
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Test Observability Dashboard API',
          availableActions: [
            'metrics',
            'alerts',
            'health',
            'mining_dashboard',
            'sentry_integration',
          ],
          description:
            'Test version of observability API with Kazakhstan mining context',
          features: [
            'System health monitoring',
            'Database performance tracking',
            'Mining-specific business metrics',
            'Real-time alerting',
            'Cache performance analysis',
            'Error tracking integration',
          ],
          usage:
            'Add ?action=metrics|alerts|health|mining_dashboard|sentry_integration',
        });
    }
  } catch (error) {
    console.error('Test observability endpoint error:', error);

    const errorId = sentryMiningService.captureError(
      error as Error,
      MiningErrorType.EXTERNAL_API_ERROR,
      { apiEndpoint: '/api/test-observability' }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get test observability metrics',
        errorId: errorId,
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
