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
    const response = NextResponse.next();
    
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

        const response = NextResponse.json(
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

        response.headers.set('X-RateLimit-Limit', '100');
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set(
          'X-RateLimit-Reset',
          rateLimit.resetTime.toString()
        );

        return response;
      }

      // Add rate limit headers to response
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set(
        'X-RateLimit-Remaining',
        rateLimit.remaining.toString()
      );
      response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

      return applySecurityHeaders(response, req);
    }

    // Apply security headers to all responses
    const response = NextResponse.next();
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
