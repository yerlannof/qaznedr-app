/**
 * Health Check Endpoint
 * Provides system status and health information for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { config } from '@/lib/config/env';
import { logger } from '@/lib/utils/logger';

const prisma = new PrismaClient();

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    authentication: ServiceStatus;
    fileSystem: ServiceStatus;
    memory: ServiceStatus;
  };
  stats: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    connections: {
      database: number;
    };
  };
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

// Check database connectivity
async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime > 1000 ? 'degraded' : 'up',
      responseTime,
      message: responseTime > 1000 ? 'Slow response time' : 'OK',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(
      'Database health check failed',
      error instanceof Error ? error : new Error(String(error))
    );

    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message:
        error instanceof Error ? error.message : 'Database connection failed',
      lastCheck: new Date().toISOString(),
    };
  }
}

// Check authentication service
async function checkAuthentication(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Simple check - verify NextAuth configuration
    const hasSecret = !!config.nextAuth.secret;
    const hasUrl = !!config.nextAuth.url;

    if (!hasSecret || !hasUrl) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        message: 'NextAuth configuration incomplete',
        lastCheck: new Date().toISOString(),
      };
    }

    return {
      status: 'up',
      responseTime: Date.now() - startTime,
      message: 'OK',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message:
        error instanceof Error ? error.message : 'Authentication check failed',
      lastCheck: new Date().toISOString(),
    };
  }
}

// Check file system access
async function checkFileSystem(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Check if we can access the uploads directory (or create it)
    const fs = await import('fs/promises');
    const path = await import('path');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    try {
      await fs.access(uploadsDir);
    } catch {
      // Directory doesn't exist, try to create it
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    return {
      status: 'up',
      responseTime: Date.now() - startTime,
      message: 'OK',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message:
        error instanceof Error ? error.message : 'File system check failed',
      lastCheck: new Date().toISOString(),
    };
  }
}

// Check memory usage
function checkMemory(): ServiceStatus {
  const memoryUsage = process.memoryUsage();
  const memoryLimitMB = 512; // Adjust based on your deployment
  const currentUsageMB = memoryUsage.heapUsed / 1024 / 1024;
  const usagePercentage = (currentUsageMB / memoryLimitMB) * 100;

  let status: 'up' | 'degraded' | 'down' = 'up';
  let message = 'OK';

  if (usagePercentage > 90) {
    status = 'down';
    message = 'Critical memory usage';
  } else if (usagePercentage > 75) {
    status = 'degraded';
    message = 'High memory usage';
  }

  return {
    status,
    message: `${message} (${usagePercentage.toFixed(1)}%)`,
    lastCheck: new Date().toISOString(),
  };
}

// Get database connection count
async function getDatabaseConnections(): Promise<number> {
  try {
    // This is database-specific. For PostgreSQL:
    // const result = await prisma.$queryRaw`SELECT count(*) FROM pg_stat_activity WHERE state = 'active'`;
    // For SQLite, we'll just return 1 as it's single-connection
    return 1;
  } catch {
    return 0;
  }
}

// Determine overall system status
function determineOverallStatus(
  services: HealthCheck['services']
): HealthCheck['status'] {
  const statuses = Object.values(services).map((service) => service.status);

  if (statuses.includes('down')) {
    return 'unhealthy';
  }

  if (statuses.includes('degraded')) {
    return 'degraded';
  }

  return 'healthy';
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [databaseStatus, authStatus, fileSystemStatus] = await Promise.all([
      checkDatabase(),
      checkAuthentication(),
      checkFileSystem(),
    ]);

    const memoryStatus = checkMemory();
    const connectionCount = await getDatabaseConnections();

    const services = {
      database: databaseStatus,
      authentication: authStatus,
      fileSystem: fileSystemStatus,
      memory: memoryStatus,
    };

    const healthCheck: HealthCheck = {
      status: determineOverallStatus(services),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.isDevelopment ? 'development' : 'production',
      services,
      stats: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: {
          database: connectionCount,
        },
      },
    };

    const responseTime = Date.now() - startTime;

    // Log health check if it's slow or unhealthy
    if (responseTime > 1000 || healthCheck.status !== 'healthy') {
      logger.warn('Health check completed', {
        status: healthCheck.status,
        responseTime,
        services: Object.entries(services).reduce(
          (acc, [key, service]) => {
            acc[key] = service.status;
            return acc;
          },
          {} as Record<string, string>
        ),
      });
    }

    // Return appropriate HTTP status based on health
    const httpStatus =
      healthCheck.status === 'healthy'
        ? 200
        : healthCheck.status === 'degraded'
          ? 200
          : 503;

    const response = NextResponse.json(healthCheck, { status: httpStatus });
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate'
    );
    response.headers.set('X-Health-Check-Duration', responseTime.toString());

    return response;
  } catch (error) {
    logger.error(
      'Health check failed',
      error instanceof Error ? error : new Error(String(error))
    );

    const errorResponse: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.isDevelopment ? 'development' : 'production',
      services: {
        database: {
          status: 'down',
          message: 'Health check failed',
          lastCheck: new Date().toISOString(),
        },
        authentication: {
          status: 'down',
          message: 'Health check failed',
          lastCheck: new Date().toISOString(),
        },
        fileSystem: {
          status: 'down',
          message: 'Health check failed',
          lastCheck: new Date().toISOString(),
        },
        memory: {
          status: 'down',
          message: 'Health check failed',
          lastCheck: new Date().toISOString(),
        },
      },
      stats: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: { database: 0 },
      },
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}
