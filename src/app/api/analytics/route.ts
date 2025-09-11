/**
 * Analytics API endpoint for collecting custom events
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { handleApiError, validateRequired } from '@/lib/utils/error-handler';

const prisma = new PrismaClient();

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate required fields
    validateRequired(body, ['name', 'timestamp']);

    const event: AnalyticsEvent = {
      name: body.name,
      properties: body.properties || {},
      userId: body.userId,
      sessionId: body.sessionId,
      timestamp: body.timestamp,
    };

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Store analytics event in database
    await prisma.analyticsEvent.create({
      data: {
        name: event.name,
        properties: event.properties as any,
        userId: event.userId,
        sessionId: event.sessionId,
        timestamp: new Date(event.timestamp),
        clientIP,
        userAgent,
      },
    });

    // Log important events
    if (isImportantEvent(event.name)) {
      logger.info('Analytics event stored', {
        event: event.name,
        userId: event.userId,
        sessionId: event.sessionId,
        properties: event.properties,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Analytics API error', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error, request.headers.get('x-request-id') || undefined);
  }
}

// Get analytics data (for internal use/dashboards)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventName = searchParams.get('eventName');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause
    const where: any = {};
    
    if (startDate) {
      where.timestamp = { ...where.timestamp, gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.timestamp = { ...where.timestamp, lte: new Date(endDate) };
    }
    
    if (eventName) {
      where.name = eventName;
    }
    
    if (userId) {
      where.userId = userId;
    }

    // Get events
    const events = await prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 1000), // Cap at 1000 events
      select: {
        id: true,
        name: true,
        properties: true,
        userId: true,
        sessionId: true,
        timestamp: true,
        clientIP: true,
        userAgent: true,
      },
    });

    // Get summary statistics
    const totalEvents = await prisma.analyticsEvent.count({ where });
    
    const eventCounts = await prisma.analyticsEvent.groupBy({
      by: ['name'],
      where,
      _count: { name: true },
      orderBy: { _count: { name: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        totalEvents,
        eventCounts: eventCounts.map(item => ({
          name: item.name,
          count: item._count.name,
        })),
      },
    });
  } catch (error) {
    logger.error('Analytics GET API error', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error, request.headers.get('x-request-id') || undefined);
  }
}

function isImportantEvent(eventName: string): boolean {
  const importantEvents = [
    'user_registered',
    'user_login',
    'listing_created',
    'listing_viewed',
    'listing_favorited',
    'search_performed',
    'error_occurred',
  ];
  return importantEvents.includes(eventName);
}