import { NextRequest, NextResponse } from 'next/server';

// Simple CSRF token generation and validation
// Using double-submit cookie pattern for stateless CSRF protection

const CSRF_COOKIE_NAME = 'qaznedr-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCSRFToken(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

export function validateCSRFToken(
  cookieToken: string | undefined,
  headerToken: string | undefined
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Length check first (constant time for same lengths)
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

// Timing-safe comparison function using strings
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export async function csrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF check for GET and HEAD requests (read-only operations)
  if (['GET', 'HEAD'].includes(request.method)) {
    return null;
  }

  // Skip CSRF for webhook endpoints (they use different authentication)
  const pathname = request.nextUrl.pathname;
  if (pathname.includes('/webhook') || pathname.includes('/api/auth/')) {
    return null;
  }

  // SECURITY FIX: CSRF protection is now ALWAYS enabled
  // Only allow bypassing for specific test endpoints with explicit flag
  const isTestEndpoint =
    pathname.includes('/api/test/') &&
    process.env.NODE_ENV === 'test' &&
    process.env.DISABLE_CSRF_FOR_TESTS === 'true';

  if (!isTestEndpoint) {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken =
      request.headers.get(CSRF_HEADER_NAME) ||
      request.headers.get('x-xsrf-token') ||
      request.headers.get('X-XSRF-TOKEN'); // Support different casing

    if (!validateCSRFToken(cookieToken, headerToken)) {
      // Log CSRF attack attempt
      console.warn(
        `CSRF attack attempt detected: ${request.method} ${pathname} from ${request.ip}`
      );

      return NextResponse.json(
        {
          error: 'CSRF validation failed',
          message: 'Invalid or missing CSRF token',
        },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }
  }

  return null;
}

// Middleware to add CSRF token to response
export function addCSRFToken(response: NextResponse): NextResponse {
  const token = generateCSRFToken();

  // Set CSRF token as httpOnly:false so JavaScript can read it
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Also add to response header for easy access
  response.headers.set('X-CSRF-Token', token);

  return response;
}

// Hook for client-side to get CSRF token
export function getCSRFTokenFromCookie(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(`(^| )${CSRF_COOKIE_NAME}=([^;]+)`)
  );
  return match ? match[2] : null;
}
