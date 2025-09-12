/**
 * Error reporting API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { handleApiError, validateRequired } from '@/lib/utils/error-handler';
import type { MonitoredError } from '@/lib/utils/error-monitoring';

const prisma = new PrismaClient();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: MonitoredError = await request.json();

    // Validate required fields
    validateRequired(body as unknown as Record<string, unknown>, [
      'message',
      'severity',
      'fingerprint',
      'timestamp',
    ]);

    // Get client information
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Store error in database
    await prisma.errorLog.create({
      data: {
        message: body.message,
        stack: body.stack,
        severity: body.severity,
        fingerprint: body.fingerprint,
        count: body.count || 1,
        context: body.context as any,
        timestamp: new Date(body.timestamp),
        clientIP,
        userAgent,
        userId: body.context?.userId,
        sessionId: body.context?.sessionId,
        url: body.context?.url,
        component: body.context?.component,
        action: body.context?.action,
      },
    });

    // Log critical errors
    if (body.severity === 'critical') {
      logger.error('Critical error reported', new Error(body.message), {
        fingerprint: body.fingerprint,
        context: body.context,
        clientIP,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      'Error reporting API error',
      error instanceof Error ? error : new Error(String(error))
    );
    return handleApiError(
      error,
      request.headers.get('x-request-id') || undefined
    );
  }
}

// Get error statistics and recent errors
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const severity = searchParams.get('severity');
    const component = searchParams.get('component');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};

    if (startDate) {
      where.timestamp = { ...where.timestamp, gte: new Date(startDate) };
    }

    if (endDate) {
      where.timestamp = { ...where.timestamp, lte: new Date(endDate) };
    }

    if (severity) {
      where.severity = severity;
    }

    if (component) {
      where.component = component;
    }

    // Get recent errors
    const recentErrors = await prisma.errorLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        message: true,
        severity: true,
        fingerprint: true,
        count: true,
        timestamp: true,
        userId: true,
        component: true,
        action: true,
        url: true,
      },
    });

    // Get error statistics
    const totalErrors = await prisma.errorLog.count({ where });

    // Get error counts by severity
    const errorsBySeverity = await prisma.errorLog.groupBy({
      by: ['severity'],
      where,
      _count: { severity: true },
    });

    // Get error counts by component
    const errorsByComponent = await prisma.errorLog.groupBy({
      by: ['component'],
      where,
      _count: { component: true },
      orderBy: { _count: { component: 'desc' } },
      take: 10,
    });

    // Get most frequent errors
    const frequentErrors = await prisma.errorLog.groupBy({
      by: ['fingerprint', 'message'],
      where,
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        recentErrors,
        statistics: {
          totalErrors,
          errorsBySeverity: errorsBySeverity.map((item) => ({
            severity: item.severity,
            count: item._count.severity,
          })),
          errorsByComponent: errorsByComponent.map((item) => ({
            component: item.component,
            count: item._count.component,
          })),
          frequentErrors: frequentErrors.map((item) => ({
            fingerprint: item.fingerprint,
            message: item.message,
            count: item._sum.count || 0,
          })),
        },
      },
    });
  } catch (error) {
    logger.error(
      'Error statistics API error',
      error instanceof Error ? error : new Error(String(error))
    );
    return handleApiError(
      error,
      request.headers.get('x-request-id') || undefined
    );
  }
}
