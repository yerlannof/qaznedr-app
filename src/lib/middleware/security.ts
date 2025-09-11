/**
 * Security Middleware for QAZNEDR.KZ
 * Implements security headers, CORS, and other security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/env';

// Security headers configuration
const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',

  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

// Content Security Policy
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Needed for Next.js development
    "'unsafe-eval'", // Needed for Next.js development
    'https://apis.google.com',
    'https://cdn.jsdelivr.net',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': [
    "'self'",
    'https://api.qaznedr.kz',
    config.isDevelopment ? 'http://localhost:*' : '',
  ].filter(Boolean),
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

// Generate CSP string
function generateCSP(): string {
  const directives = Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');

  return directives;
}

// CORS configuration
function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = config.security.corsOrigins;
  const isAllowedOrigin =
    !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin || '*' : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

// Apply security headers
export function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CSP header (relaxed in development)
  if (config.isProduction) {
    response.headers.set('Content-Security-Policy', generateCSP());
  }

  // Add CORS headers
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin || undefined);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Handle CORS preflight requests
export function handleCorsPreflightRequest(
  request: NextRequest
): NextResponse | null {
  if (request.method !== 'OPTIONS') return null;

  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin || undefined);

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Check for suspicious activity
export function detectSuspiciousActivity(request: NextRequest): {
  isSuspicious: boolean;
  reason?: string;
} {
  const userAgent = request.headers.get('user-agent') || '';
  const url = new URL(request.url);

  // Check for common bot patterns
  const botPatterns = [
    /crawler/i,
    /spider/i,
    /bot/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  if (botPatterns.some((pattern) => pattern.test(userAgent))) {
    return { isSuspicious: true, reason: 'Bot detected' };
  }

  // Check for suspicious paths
  const suspiciousPaths = [
    '/.env',
    '/admin',
    '/wp-admin',
    '/phpmyadmin',
    '/.git',
    '/config',
  ];

  if (suspiciousPaths.some((path) => url.pathname.includes(path))) {
    return { isSuspicious: true, reason: 'Suspicious path access' };
  }

  // Check for SQL injection patterns in query parameters
  const sqlInjectionPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /'.*or.*'/i,
    /".*or.*"/i,
  ];

  const queryString = url.search;
  if (sqlInjectionPatterns.some((pattern) => pattern.test(queryString))) {
    return { isSuspicious: true, reason: 'SQL injection attempt' };
  }

  // Check for XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  if (xssPatterns.some((pattern) => pattern.test(queryString))) {
    return { isSuspicious: true, reason: 'XSS attempt' };
  }

  return { isSuspicious: false };
}

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Simple rate limiting
export function checkRateLimit(
  identifier: string,
  maxRequests: number = config.rateLimit.maxRequests,
  windowMs: number = config.rateLimit.windowMs
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, resetTime, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, resetTime: record.resetTime, remaining: 0 };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(identifier, record);
  return {
    allowed: true,
    resetTime: record.resetTime,
    remaining: maxRequests - record.count,
  };
}

// Clean up expired rate limit records (call periodically)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Security middleware wrapper
export function withSecurity(request: NextRequest): NextResponse | null {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(request);
  if (preflightResponse) {
    return applySecurityHeaders(preflightResponse, request);
  }

  // Check for suspicious activity
  const suspiciousCheck = detectSuspiciousActivity(request);
  if (suspiciousCheck.isSuspicious) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: 'SUSPICIOUS_ACTIVITY',
          message: 'Request blocked due to suspicious activity',
        },
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}
