import { NextRequest, NextResponse } from 'next/server';

// Comprehensive security headers configuration
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    enabled: boolean;
    directives?: Record<string, string | string[]>;
    reportOnly?: boolean;
  };
  crossOriginEmbedderPolicy?: 'require-corp' | 'unsafe-none' | 'credentialless';
  crossOriginOpenerPolicy?:
    | 'same-origin'
    | 'same-origin-allow-popups'
    | 'unsafe-none';
  crossOriginResourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin';
  originAgentCluster?: boolean;
  permissionsPolicy?: Record<string, string | string[]>;
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin';
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xContentTypeOptions?: boolean;
  xDnsPrefetchControl?: boolean;
  xDownloadOptions?: boolean;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  xPermittedCrossDomainPolicies?:
    | 'none'
    | 'master-only'
    | 'by-content-type'
    | 'all';
  xPoweredBy?: boolean;
  xXssProtection?: boolean;
}

// Default secure configuration for Kazakhstan mining platform
const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : '', // Only in dev
        'https://*.sentry.io',
        'https://va.vercel-scripts.com',
        'https://vitals.vercel-insights.com',
        'https://cdn.jsdelivr.net', // For libraries
      ].filter(Boolean),
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind and styled-components
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://*.supabase.co',
        'https://qaznedr.kz',
        'https://*.amazonaws.com',
        'https://images.unsplash.com',
        process.env.NODE_ENV === 'development' ? 'http://localhost:*' : '',
      ].filter(Boolean),
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'https://*.sentry.io',
        'https://vitals.vercel-insights.com',
        'https://api.github.com',
        'wss://*.supabase.co',
        process.env.NODE_ENV === 'development' ? 'http://localhost:*' : '',
        process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : '',
      ].filter(Boolean),
      'frame-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'", 'https://*.supabase.co'],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : undefined,
    },
    reportOnly: false, // Enforce in production
  },
  crossOriginEmbedderPolicy: 'credentialless',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'cross-origin',
  originAgentCluster: true,
  permissionsPolicy: {
    camera: ["'none'"],
    microphone: ["'none'"],
    geolocation: ["'self'"],
    'interest-cohort': ["'none'"], // Disable FLoC
    payment: ["'self'", 'https://js.stripe.com'],
    fullscreen: ["'self'"],
    'display-capture': ["'none'"],
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  xContentTypeOptions: true,
  xDnsPrefetchControl: false,
  xDownloadOptions: true,
  xFrameOptions: 'DENY',
  xPermittedCrossDomainPolicies: 'none',
  xPoweredBy: false,
  xXssProtection: false, // Disabled as CSP is more effective
};

/**
 * Generate Content Security Policy string from directives
 */
function generateCSP(directives: Record<string, string | string[]>): string {
  return Object.entries(directives)
    .map(([directive, values]) => {
      if (Array.isArray(values)) {
        return values.length > 0
          ? `${directive} ${values.join(' ')}`
          : directive;
      }
      return `${directive} ${values}`;
    })
    .join('; ');
}

/**
 * Generate Permissions Policy string
 */
function generatePermissionsPolicy(
  permissions: Record<string, string | string[]>
): string {
  return Object.entries(permissions)
    .map(([directive, values]) => {
      if (Array.isArray(values)) {
        return `${directive}=(${values.join(' ')})`;
      }
      return `${directive}=(${values})`;
    })
    .join(', ');
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = DEFAULT_CONFIG
): NextResponse {
  // Content Security Policy
  if (
    config.contentSecurityPolicy?.enabled &&
    config.contentSecurityPolicy.directives
  ) {
    const csp = generateCSP(config.contentSecurityPolicy.directives);
    const headerName = config.contentSecurityPolicy.reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
    response.headers.set(headerName, csp);
  }

  // Cross-Origin Headers
  if (config.crossOriginEmbedderPolicy) {
    response.headers.set(
      'Cross-Origin-Embedder-Policy',
      config.crossOriginEmbedderPolicy
    );
  }

  if (config.crossOriginOpenerPolicy) {
    response.headers.set(
      'Cross-Origin-Opener-Policy',
      config.crossOriginOpenerPolicy
    );
  }

  if (config.crossOriginResourcePolicy) {
    response.headers.set(
      'Cross-Origin-Resource-Policy',
      config.crossOriginResourcePolicy
    );
  }

  // Origin Agent Cluster
  if (config.originAgentCluster) {
    response.headers.set('Origin-Agent-Cluster', '?1');
  }

  // Permissions Policy
  if (config.permissionsPolicy) {
    const permissionsPolicy = generatePermissionsPolicy(
      config.permissionsPolicy
    );
    response.headers.set('Permissions-Policy', permissionsPolicy);
  }

  // Referrer Policy
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', config.referrerPolicy);
  }

  // Strict Transport Security (HTTPS only)
  if (config.strictTransportSecurity && process.env.NODE_ENV === 'production') {
    const { maxAge, includeSubDomains, preload } =
      config.strictTransportSecurity;
    let stsValue = `max-age=${maxAge}`;
    if (includeSubDomains) stsValue += '; includeSubDomains';
    if (preload) stsValue += '; preload';
    response.headers.set('Strict-Transport-Security', stsValue);
  }

  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // X-DNS-Prefetch-Control
  if (config.xDnsPrefetchControl !== undefined) {
    response.headers.set(
      'X-DNS-Prefetch-Control',
      config.xDnsPrefetchControl ? 'on' : 'off'
    );
  }

  // X-Download-Options
  if (config.xDownloadOptions) {
    response.headers.set('X-Download-Options', 'noopen');
  }

  // X-Frame-Options
  if (config.xFrameOptions) {
    response.headers.set('X-Frame-Options', config.xFrameOptions);
  }

  // X-Permitted-Cross-Domain-Policies
  if (config.xPermittedCrossDomainPolicies) {
    response.headers.set(
      'X-Permitted-Cross-Domain-Policies',
      config.xPermittedCrossDomainPolicies
    );
  }

  // X-Powered-By (remove it)
  if (config.xPoweredBy === false) {
    response.headers.delete('X-Powered-By');
  }

  // X-XSS-Protection (legacy header, disabled by default)
  if (config.xXssProtection) {
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }

  // Security-related headers for API responses
  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, nosnippet, noarchive'
  );
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

/**
 * Security headers middleware for API routes
 */
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: SecurityHeadersConfig
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      // Execute the handler
      const response = await handler(req);

      // Apply security headers to the response
      return applySecurityHeaders(response, config);
    } catch (error) {
      console.error('Security headers middleware error:', error);

      // Create error response with security headers
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );

      return applySecurityHeaders(errorResponse, config);
    }
  };
}

/**
 * Create a security headers middleware with custom configuration
 */
export function createSecurityHeadersMiddleware(config: SecurityHeadersConfig) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) =>
    withSecurityHeaders(handler, config);
}

/**
 * Validate security headers configuration
 */
export function validateSecurityConfig(config: SecurityHeadersConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate CSP directives
  if (
    config.contentSecurityPolicy?.enabled &&
    config.contentSecurityPolicy.directives
  ) {
    const directives = config.contentSecurityPolicy.directives;

    // Check for dangerous directives
    if (directives['script-src']?.includes("'unsafe-eval'")) {
      warnings.push("Using 'unsafe-eval' in script-src can be dangerous");
    }

    if (directives['script-src']?.includes("'unsafe-inline'")) {
      warnings.push(
        "Using 'unsafe-inline' in script-src reduces XSS protection"
      );
    }

    if (
      !directives['object-src'] ||
      !directives['object-src'].includes("'none'")
    ) {
      warnings.push(
        "Consider setting object-src to 'none' for better security"
      );
    }
  }

  // Validate HSTS settings
  if (config.strictTransportSecurity) {
    const { maxAge } = config.strictTransportSecurity;
    if (maxAge < 31536000) {
      // Less than 1 year
      warnings.push(
        'HSTS max-age should be at least 1 year (31536000 seconds)'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Export default configuration for use in other modules
export { DEFAULT_CONFIG as defaultSecurityConfig };

// Pre-configured middleware for common use cases
export const strictSecurityHeaders = createSecurityHeadersMiddleware({
  ...DEFAULT_CONFIG,
  contentSecurityPolicy: {
    ...DEFAULT_CONFIG.contentSecurityPolicy!,
    directives: {
      ...DEFAULT_CONFIG.contentSecurityPolicy!.directives!,
      'script-src': ["'self'"], // No unsafe-eval or unsafe-inline
      'style-src': ["'self'"], // No unsafe-inline
    },
  },
});

export const apiSecurityHeaders = createSecurityHeadersMiddleware({
  ...DEFAULT_CONFIG,
  contentSecurityPolicy: {
    enabled: false, // APIs don't need CSP
  },
  xFrameOptions: 'DENY',
  crossOriginResourcePolicy: 'same-origin',
});
