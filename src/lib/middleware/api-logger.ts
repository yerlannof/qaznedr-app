/**
 * API Request Logging Middleware
 * Logs all API requests with timing and context information
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { logger, createRequestLogger } from '@/lib/utils/logger';

export interface RequestContext {
  requestId: string;
  startTime: number;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

// Extract user ID from JWT token (if present)
function extractUserIdFromToken(request: NextRequest): string | undefined {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return undefined;

    // This would need to be implemented based on your JWT structure
    // For now, return undefined as we're using NextAuth sessions
    return undefined;
  } catch {
    return undefined;
  }
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

// Create request context
export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: nanoid(),
    startTime: Date.now(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: getClientIP(request),
    userId: extractUserIdFromToken(request),
  };
}

// Log API request
export function logApiRequest(
  context: RequestContext,
  response: NextResponse,
  error?: Error
): void {
  const duration = Date.now() - context.startTime;
  const statusCode = response.status;

  const requestLogger = createRequestLogger(
    context.requestId,
    context.userId,
    context.ip,
    context.userAgent
  );

  // Log the request
  requestLogger.apiRequest(context.method, context.url, statusCode, duration, {
    error: error
      ? {
          name: error.name,
          message: error.message,
        }
      : undefined,
  });

  // Log additional details for errors
  if (error) {
    requestLogger.error(
      `API request failed: ${context.method} ${context.url}`,
      error,
      {
        statusCode,
        duration,
      }
    );
  }

  // Log slow requests (>1s)
  if (duration > 1000) {
    requestLogger.warn(`Slow API request: ${context.method} ${context.url}`, {
      duration,
      threshold: 1000,
    });
  }
}

// Middleware wrapper for API routes
export function withApiLogging<
  T extends (...args: any[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args;
    const context = createRequestContext(request as NextRequest);

    // Add request ID to headers for debugging
    const headers = new Headers();
    headers.set('x-request-id', context.requestId);

    let response: NextResponse;
    let error: Error | undefined;

    try {
      response = await handler(...args);

      // Add request ID to response headers
      response.headers.set('x-request-id', context.requestId);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));

      // Create error response
      response = NextResponse.json(
        {
          success: false,
          error: {
            message: 'Internal Server Error',
            requestId: context.requestId,
          },
        },
        {
          status: 500,
          headers,
        }
      );
    }

    // Log the request
    logApiRequest(context, response, error);

    return response;
  }) as T;
}

// Simple logging decorator for functions
export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  operationName?: string
): T {
  return ((...args: Parameters<T>) => {
    const startTime = Date.now();
    const operation = operationName || fn.name || 'anonymous';

    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - startTime;
            logger.debug(`Operation completed: ${operation}`, { duration });
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            logger.error(`Operation failed: ${operation}`, error, { duration });
            throw error;
          });
      }

      // Handle sync functions
      const duration = Date.now() - startTime;
      logger.debug(`Operation completed: ${operation}`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        `Operation failed: ${operation}`,
        error instanceof Error ? error : new Error(String(error)),
        { duration }
      );
      throw error;
    }
  }) as T;
}
