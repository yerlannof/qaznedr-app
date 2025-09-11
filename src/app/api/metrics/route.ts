/**
 * Metrics Endpoint for Monitoring
 * Exports basic metrics in Prometheus format
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { config } from '@/lib/config/env';

const prisma = new PrismaClient();

// Simple metrics collector
class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number> = new Map();
  private startTime = Date.now();

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  increment(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  set(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }

  get(metric: string): number {
    return this.metrics.get(metric) || 0;
  }

  getAll(): Map<string, number> {
    return new Map(this.metrics);
  }

  getUptime(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}

export const metrics = MetricsCollector.getInstance();

// Collect database metrics
async function collectDatabaseMetrics(): Promise<Record<string, number>> {
  try {
    // Count total users
    const userCount = await prisma.user.count();

    // Count total deposits
    const depositCount = await prisma.kazakhstanDeposit.count();

    // Count active deposits
    const activeDepositCount = await prisma.kazakhstanDeposit.count({
      where: { status: 'ACTIVE' },
    });

    // Count total views
    const viewCount = await prisma.view.count();

    // Count total favorites
    const favoriteCount = await prisma.favorite.count();

    return {
      qaznedr_users_total: userCount,
      qaznedr_deposits_total: depositCount,
      qaznedr_deposits_active: activeDepositCount,
      qaznedr_views_total: viewCount,
      qaznedr_favorites_total: favoriteCount,
    };
  } catch (error) {
    console.error('Failed to collect database metrics:', error);
    return {};
  }
}

// Format metrics in Prometheus format
function formatPrometheusMetrics(metrics: Record<string, number>): string {
  const lines: string[] = [];

  // Add metadata
  lines.push('# HELP qaznedr_info Information about QAZNEDR.KZ application');
  lines.push('# TYPE qaznedr_info gauge');
  lines.push(
    `qaznedr_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${config.isDevelopment ? 'development' : 'production'}"} 1`
  );

  // Add uptime
  lines.push('# HELP qaznedr_uptime_seconds Application uptime in seconds');
  lines.push('# TYPE qaznedr_uptime_seconds gauge');
  lines.push(`qaznedr_uptime_seconds ${process.uptime()}`);

  // Add memory metrics
  const memUsage = process.memoryUsage();
  lines.push('# HELP qaznedr_memory_usage_bytes Memory usage in bytes');
  lines.push('# TYPE qaznedr_memory_usage_bytes gauge');
  lines.push(`qaznedr_memory_usage_bytes{type="rss"} ${memUsage.rss}`);
  lines.push(
    `qaznedr_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}`
  );
  lines.push(
    `qaznedr_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}`
  );
  lines.push(
    `qaznedr_memory_usage_bytes{type="external"} ${memUsage.external}`
  );

  // Add custom metrics
  for (const [key, value] of Object.entries(metrics)) {
    if (key.startsWith('qaznedr_')) {
      lines.push(`# HELP ${key} Application metric`);
      lines.push(`# TYPE ${key} gauge`);
      lines.push(`${key} ${value}`);
    }
  }

  return lines.join('\n') + '\n';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Only allow access in production or with proper auth
    if (config.isProduction) {
      const authHeader = request.headers.get('authorization');
      const expectedAuth = process.env.METRICS_AUTH_TOKEN;

      if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Collect metrics
    const dbMetrics = await collectDatabaseMetrics();
    const appMetrics = Object.fromEntries(metrics.getAll());
    const allMetrics = { ...dbMetrics, ...appMetrics };

    // Format as Prometheus metrics
    const prometheusFormat = formatPrometheusMetrics(allMetrics);

    return new NextResponse(prometheusFormat, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export metrics collector for use in other parts of the app
export { metrics as metricsCollector };
