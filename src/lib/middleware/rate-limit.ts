import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting for development/fallback
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Simple rate limiter implementation
function simpleRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): {
  success: boolean;
  limit: number;
  reset: number;
  remaining: number;
} {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = requestCounts.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit,
      reset: Math.floor((now + windowMs) / 1000),
      remaining: limit - 1,
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      reset: Math.floor(entry.resetTime / 1000),
      remaining: 0,
    };
  }

  entry.count++;
  requestCounts.set(identifier, entry);

  return {
    success: true,
    limit,
    reset: Math.floor(entry.resetTime / 1000),
    remaining: limit - entry.count,
  };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean every minute

export async function rateLimit(
  request: NextRequest,
  identifier?: string
): Promise<{
  success: boolean;
  limit?: number;
  reset?: number;
  remaining?: number;
} | null> {
  // Skip rate limiting in development for faster testing
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  try {
    // Use IP address or custom identifier for rate limiting
    const id =
      identifier ||
      request.ip ||
      request.headers.get('x-forwarded-for') ||
      'anonymous';

    // Use stricter limits for write operations
    const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
      request.method
    );

    const limit = isWriteOperation ? 10 : 30;
    const windowSeconds = 10;

    const result = simpleRateLimit(id, limit, windowSeconds);

    return result;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    return null;
  }
}

export function createRateLimitResponse(
  limit?: number,
  reset?: number,
  remaining?: number
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
    },
    { status: 429 }
  );

  if (limit) response.headers.set('X-RateLimit-Limit', limit.toString());
  if (remaining !== undefined)
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
  if (reset) response.headers.set('X-RateLimit-Reset', reset.toString());
  response.headers.set('Retry-After', '10');

  return response;
}

export async function verifyRateLimit(
  request: NextRequest,
  identifier?: string
): Promise<NextResponse | null> {
  const result = await rateLimit(request, identifier);

  if (!result) {
    return null; // Rate limiting disabled
  }

  if (!result.success) {
    return createRateLimitResponse(
      result.limit,
      result.reset,
      result.remaining
    );
  }

  return null; // Rate limit passed
}
