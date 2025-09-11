import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import {
  applySecurityHeaders,
  withSecurity,
  checkRateLimit,
} from '@/lib/middleware/security';
import { logger } from '@/lib/utils/logger';

export default withAuth(
  function middleware(req: NextRequest) {
    // Performance optimizations
    let response = NextResponse.next();
    
    // Add performance hints and prefetch headers
    if (req.nextUrl.pathname.startsWith('/listings')) {
      response.headers.set('Link', '</api/listings>; rel=prefetch');
      response.headers.set('X-DNS-Prefetch-Control', 'on');
    }
    
    // Early hints for critical resources
    if (req.nextUrl.pathname === '/') {
      response.headers.set('Link', [
        '</api/listings>; rel=prefetch',
        '</api/stats>; rel=prefetch',
        '</images/hero.webp>; rel=preload; as=image'
      ].join(', '));
    }
    
    // Apply security checks first
    const securityResponse = withSecurity(req);
    if (securityResponse) {
      return securityResponse;
    }

    // Rate limiting for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const clientIP =
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown';
      const rateLimit = checkRateLimit(`api:${clientIP}`);

      if (!rateLimit.allowed) {
        logger.warn('Rate limit exceeded', {
          ip: clientIP,
          path: req.nextUrl.pathname,
          resetTime: new Date(rateLimit.resetTime).toISOString(),
        });

        const rateLimitResponse = NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Превышен лимит запросов. Попробуйте позже.',
              resetTime: rateLimit.resetTime,
            },
          },
          { status: 429 }
        );

        rateLimitResponse.headers.set('X-RateLimit-Limit', '100');
        rateLimitResponse.headers.set('X-RateLimit-Remaining', '0');
        rateLimitResponse.headers.set(
          'X-RateLimit-Reset',
          rateLimit.resetTime.toString()
        );

        return rateLimitResponse;
      }

      // Add rate limit headers to response
      const apiResponse = NextResponse.next();
      apiResponse.headers.set('X-RateLimit-Limit', '100');
      apiResponse.headers.set(
        'X-RateLimit-Remaining',
        rateLimit.remaining.toString()
      );
      apiResponse.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

      return applySecurityHeaders(apiResponse, req);
    }

    // Apply security headers to all responses
    return applySecurityHeaders(response, req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Define which paths require authentication
        const protectedPaths = ['/dashboard', '/profile', '/settings'];
        const isProtectedPath = protectedPaths.some((path) =>
          req.nextUrl.pathname.startsWith(path)
        );

        // Allow access to non-protected paths
        if (!isProtectedPath) {
          return true;
        }

        // Require authentication for protected paths
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
