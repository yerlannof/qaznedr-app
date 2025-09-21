import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiting configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Public endpoints - more restrictive
  public: {
    requests: 100,
    window: '1h',
    identifier: 'ip',
  },

  // Authentication endpoints - very restrictive to prevent brute force
  auth: {
    requests: 5,
    window: '15m',
    identifier: 'ip',
  },

  // API endpoints for authenticated users
  api: {
    requests: 1000,
    window: '1h',
    identifier: 'user',
  },

  // Search endpoints - moderate limits
  search: {
    requests: 200,
    window: '1h',
    identifier: 'ip',
  },

  // Payment endpoints - strict limits
  payments: {
    requests: 10,
    window: '1h',
    identifier: 'user',
  },

  // Webhook endpoints - specific to Stripe IPs
  webhooks: {
    requests: 100,
    window: '5m',
    identifier: 'ip',
  },

  // File upload endpoints
  uploads: {
    requests: 20,
    window: '1h',
    identifier: 'user',
  },

  // Admin endpoints - stricter limits
  admin: {
    requests: 500,
    window: '1h',
    identifier: 'user',
  },
};

// Create rate limiters for each configuration
const rateLimiters = {
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1h'),
    analytics: true,
    prefix: 'ratelimit:public',
  }),

  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1h'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '1h'),
    analytics: true,
    prefix: 'ratelimit:search',
  }),

  payments: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1h'),
    analytics: true,
    prefix: 'ratelimit:payments',
  }),

  webhooks: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '5m'),
    analytics: true,
    prefix: 'ratelimit:webhooks',
  }),

  uploads: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1h'),
    analytics: true,
    prefix: 'ratelimit:uploads',
  }),

  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(500, '1h'),
    analytics: true,
    prefix: 'ratelimit:admin',
  }),
};

// Determine rate limit type based on request path
function getRateLimitType(pathname: string): keyof typeof rateLimiters {
  if (pathname.includes('/api/auth/')) return 'auth';
  if (pathname.includes('/api/payments/')) return 'payments';
  if (pathname.includes('/api/webhooks/') || pathname.includes('/webhook'))
    return 'webhooks';
  if (pathname.includes('/api/search/') || pathname.includes('/api/listings'))
    return 'search';
  if (pathname.includes('/api/upload/') || pathname.includes('/api/files/'))
    return 'uploads';
  if (pathname.includes('/api/admin/')) return 'admin';
  if (pathname.startsWith('/api/')) return 'api';
  return 'public';
}

// Get identifier for rate limiting (IP or user ID)
function getRateLimitIdentifier(
  request: NextRequest,
  type: keyof typeof rateLimiters
): string {
  const config = RATE_LIMIT_CONFIGS[type];

  if (config.identifier === 'user') {
    // Try to get user ID from auth header
    const userId = request.headers.get('x-user-id');
    if (userId) return `user:${userId}`;

    // Fall back to IP if no user ID
    const ip = getClientIP(request);
    return `ip:${ip}`;
  }

  // Default to IP-based rate limiting
  const ip = getClientIP(request);
  return `ip:${ip}`;
}

// Extract client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.ip;

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, use the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return remoteAddr || 'unknown';
}

// Check if IP is whitelisted (for development/testing)
function isWhitelistedIP(ip: string): boolean {
  const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];

  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    whitelistedIPs.push('127.0.0.1', '::1', 'localhost');
  }

  return whitelistedIPs.includes(ip);
}

// Rate limiting middleware
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  customType?: keyof typeof rateLimiters
) {
  return async function rateLimitedHandler(
    req: NextRequest
  ): Promise<NextResponse> {
    try {
      const pathname = req.nextUrl.pathname;
      const clientIP = getClientIP(req);

      // Skip rate limiting for whitelisted IPs
      if (isWhitelistedIP(clientIP)) {
        return handler(req);
      }

      // Determine rate limit type
      const rateLimitType = customType || getRateLimitType(pathname);
      const rateLimiter = rateLimiters[rateLimitType];

      if (!rateLimiter) {
        console.warn(`No rate limiter configured for type: ${rateLimitType}`);
        return handler(req);
      }

      // Get identifier for this request
      const identifier = getRateLimitIdentifier(req, rateLimitType);

      // Check rate limit
      const { success, limit, reset, remaining } =
        await rateLimiter.limit(identifier);

      // Add rate limit headers to all responses
      const addRateLimitHeaders = (response: NextResponse) => {
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set(
          'X-RateLimit-Reset',
          new Date(reset).toISOString()
        );
        response.headers.set('X-RateLimit-Type', rateLimitType);
        return response;
      };

      if (!success) {
        // Rate limit exceeded
        console.warn(
          `Rate limit exceeded for ${rateLimitType}:${identifier} on ${pathname}`
        );

        const rateLimitResponse = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${limit} requests per ${RATE_LIMIT_CONFIGS[rateLimitType].window}`,
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        );

        return addRateLimitHeaders(rateLimitResponse);
      }

      // Execute handler
      const response = await handler(req);

      // Add rate limit headers to successful response
      return addRateLimitHeaders(response);
    } catch (error) {
      console.error('Rate limiting middleware error:', error);

      // If rate limiting fails, allow the request but log the error
      // This ensures the service remains available even if Redis is down
      return handler(req);
    }
  };
}

// Advanced rate limiting with burst protection
export function withBurstProtection(
  handler: (req: NextRequest) => Promise<NextResponse>,
  burstLimit: number = 10,
  burstWindow: string = '1m'
) {
  const burstLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(burstLimit, burstWindow),
    analytics: true,
    prefix: 'ratelimit:burst',
  });

  return withRateLimit(async function burstProtectedHandler(
    req: NextRequest
  ): Promise<NextResponse> {
    const clientIP = getClientIP(req);

    // Skip burst protection for whitelisted IPs
    if (isWhitelistedIP(clientIP)) {
      return handler(req);
    }

    // Check burst limit
    const identifier = `ip:${clientIP}`;
    const { success } = await burstLimiter.limit(identifier);

    if (!success) {
      console.warn(`Burst limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          error: 'Too many requests in short time',
          message: `Burst limit exceeded. Maximum ${burstLimit} requests per ${burstWindow}`,
        },
        { status: 429 }
      );
    }

    return handler(req);
  });
}

// User-specific rate limiting with authentication
export function withUserRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limit: number = 100,
  window: string = '1h'
) {
  const userLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: 'ratelimit:user',
  });

  return async function userRateLimitedHandler(
    req: NextRequest
  ): Promise<NextResponse> {
    try {
      // Get user ID from headers (set by auth middleware)
      const userId = req.headers.get('x-user-id');
      const clientIP = getClientIP(req);

      if (!userId) {
        // If no user ID, fall back to IP-based rate limiting
        return withRateLimit(handler)(req);
      }

      // Skip rate limiting for whitelisted IPs
      if (isWhitelistedIP(clientIP)) {
        return handler(req);
      }

      const identifier = `user:${userId}`;
      const {
        success,
        limit: rateLimitLimit,
        reset,
        remaining,
      } = await userLimiter.limit(identifier);

      if (!success) {
        console.warn(`User rate limit exceeded for ${userId}`);

        const response = NextResponse.json(
          {
            error: 'User rate limit exceeded',
            message: `You have exceeded your rate limit of ${limit} requests per ${window}`,
          },
          { status: 429 }
        );

        response.headers.set('X-RateLimit-Limit', rateLimitLimit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set(
          'X-RateLimit-Reset',
          new Date(reset).toISOString()
        );

        return response;
      }

      // Execute handler
      const response = await handler(req);

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimitLimit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

      return response;
    } catch (error) {
      console.error('User rate limiting error:', error);
      return handler(req);
    }
  };
}

// Global rate limiting for all requests
export async function applyGlobalRateLimit(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const pathname = request.nextUrl.pathname;
    const clientIP = getClientIP(request);

    // Skip for static files and internal routes
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/robots.txt') ||
      pathname.startsWith('/sitemap.xml')
    ) {
      return null;
    }

    // Skip rate limiting for whitelisted IPs
    if (isWhitelistedIP(clientIP)) {
      return null;
    }

    // Determine rate limit type and apply
    const rateLimitType = getRateLimitType(pathname);
    const rateLimiter = rateLimiters[rateLimitType];

    if (!rateLimiter) {
      return null;
    }

    const identifier = getRateLimitIdentifier(request, rateLimitType);
    const { success, limit, reset, remaining } =
      await rateLimiter.limit(identifier);

    if (!success) {
      console.warn(
        `Global rate limit exceeded: ${rateLimitType}:${identifier} on ${pathname}`
      );

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${limit} requests per ${RATE_LIMIT_CONFIGS[rateLimitType].window}`,
          type: rateLimitType,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'X-RateLimit-Type': rateLimitType,
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Continue with request
  } catch (error) {
    console.error('Global rate limiting error:', error);
    return null; // Allow request if rate limiting fails
  }
}

// Export utilities for monitoring and configuration
export { rateLimiters, redis };

// Health check for rate limiting service
export async function checkRateLimitHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  redis: boolean;
  rateLimiters: boolean;
}> {
  try {
    // Test Redis connection
    await redis.ping();

    return {
      status: 'healthy',
      redis: true,
      rateLimiters: true,
    };
  } catch (error) {
    console.error('Rate limit health check failed:', error);

    return {
      status: 'unhealthy',
      redis: false,
      rateLimiters: false,
    };
  }
}
