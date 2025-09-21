import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfProtection, addCSRFToken } from '@/lib/middleware/csrf';
import {
  applySecurityHeaders,
  defaultSecurityConfig,
} from '@/lib/middleware/security-headers';
// Simple rate limiting without Redis for development
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function simpleRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const entry = requestCounts.get(identifier);

  if (!entry || now > entry.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  requestCounts.set(identifier, entry);
  return true;
}

async function applyGlobalRateLimit(request: NextRequest): Promise<NextResponse | null> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  const identifier = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
  
  if (!simpleRateLimit(identifier)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  return null;
}

const locales = ['ru', 'kz', 'en'];
const defaultLocale = 'ru';

function getLocale(pathname: string): string {
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  return locales.includes(firstSegment) ? firstSegment : defaultLocale;
}

function hasLocale(pathname: string): boolean {
  const segments = pathname.split('/');
  return locales.includes(segments[1]);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply global rate limiting first (before any other processing)
  const rateLimitResponse = await applyGlobalRateLimit(request);
  if (rateLimitResponse) {
    // Apply security headers to rate limit response
    return applySecurityHeaders(rateLimitResponse, {
      contentSecurityPolicy: { enabled: false },
      xFrameOptions: 'DENY',
    });
  }

  // Handle API routes with CSRF protection
  if (pathname.startsWith('/api')) {
    // Skip CSRF for auth endpoints, public APIs, and webhooks
    const skipCSRFPaths = [
      '/api/auth/',
      '/api/auth/csrf-token',
      '/api/listings',
      '/api/payments/webhook', // Stripe webhooks have their own security
      '/api/webhooks/', // Any webhook endpoints
    ];
    const shouldSkipCSRF = skipCSRFPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (!shouldSkipCSRF) {
      const csrfResponse = await csrfProtection(request);
      if (csrfResponse) {
        // Apply security headers to CSRF error responses
        return applySecurityHeaders(csrfResponse, {
          ...defaultSecurityConfig,
          contentSecurityPolicy: { enabled: false }, // APIs don't need CSP
        });
      }
    }

    // Apply API-specific security headers
    const response = NextResponse.next();
    return applySecurityHeaders(response, {
      ...defaultSecurityConfig,
      contentSecurityPolicy: { enabled: false }, // APIs don't need CSP
      xFrameOptions: 'DENY',
      crossOriginResourcePolicy: 'same-origin',
    });
  }

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // If the pathname doesn't have a locale, redirect with proper locale
  if (!hasLocale(pathname)) {
    // Try to get locale from cookie first
    const cookieLocale = request.cookies.get('locale')?.value;

    // Then check the referer header to preserve current locale
    const referer = request.headers.get('referer');
    let locale = defaultLocale;

    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale;
    } else if (referer) {
      const refererUrl = new URL(referer);
      const refererLocale = getLocale(refererUrl.pathname);
      if (locales.includes(refererLocale)) {
        locale = refererLocale;
      }
    }

    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    const response = NextResponse.redirect(newUrl, 302);

    // Set the locale cookie for future requests
    response.cookies.set('locale', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      path: '/',
    });

    // Apply security headers to redirect response
    return applySecurityHeaders(response, defaultSecurityConfig);
  }

  // If we have a locale in the path, save it to cookie
  const currentLocale = getLocale(pathname);
  let response = NextResponse.next();

  // Update the locale cookie with current locale
  response.cookies.set('locale', currentLocale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    path: '/',
  });

  // Add CSRF token to responses if not present
  if (!request.cookies.get('qaznedr-csrf-token')) {
    response = addCSRFToken(response);
  }

  // Apply comprehensive security headers to all page responses
  return applySecurityHeaders(response, defaultSecurityConfig);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - other static files
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
