import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSecureAuthConfig } from '@/lib/auth/jwt-security';

// Define authorization levels
export enum AuthLevel {
  PUBLIC = 'public', // No authentication required
  AUTHENTICATED = 'authenticated', // Valid session required
  ADMIN = 'admin', // Admin role required
  SUPER_ADMIN = 'super_admin', // Super admin role required
}

// Define API route permissions
interface RoutePermission {
  pattern: RegExp;
  level: AuthLevel;
  methods?: string[];
  customCheck?: (req: NextRequest, token: any) => Promise<boolean>;
}

// API route permissions configuration
const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Public endpoints (no auth required)
  { pattern: /^\/api\/listings$/, level: AuthLevel.PUBLIC, methods: ['GET'] },
  {
    pattern: /^\/api\/listings\/[^\/]+$/,
    level: AuthLevel.PUBLIC,
    methods: ['GET'],
  },
  { pattern: /^\/api\/search\//, level: AuthLevel.PUBLIC, methods: ['GET'] },
  { pattern: /^\/api\/health$/, level: AuthLevel.PUBLIC },
  { pattern: /^\/api\/auth\//, level: AuthLevel.PUBLIC }, // NextAuth routes

  // Authenticated endpoints
  {
    pattern: /^\/api\/listings$/,
    level: AuthLevel.AUTHENTICATED,
    methods: ['POST', 'PUT', 'DELETE'],
  },
  {
    pattern: /^\/api\/listings\/[^\/]+$/,
    level: AuthLevel.AUTHENTICATED,
    methods: ['PUT', 'DELETE'],
  },
  { pattern: /^\/api\/user\/profile/, level: AuthLevel.AUTHENTICATED },
  { pattern: /^\/api\/user\/favorites/, level: AuthLevel.AUTHENTICATED },
  { pattern: /^\/api\/messages/, level: AuthLevel.AUTHENTICATED },
  { pattern: /^\/api\/notifications/, level: AuthLevel.AUTHENTICATED },
  {
    pattern: /^\/api\/payments\/create-intent/,
    level: AuthLevel.AUTHENTICATED,
  },

  // Admin endpoints
  { pattern: /^\/api\/admin\//, level: AuthLevel.ADMIN },
  { pattern: /^\/api\/users$/, level: AuthLevel.ADMIN },
  { pattern: /^\/api\/analytics/, level: AuthLevel.ADMIN },

  // Super admin endpoints
  { pattern: /^\/api\/system\//, level: AuthLevel.SUPER_ADMIN },

  // Custom authorization examples
  {
    pattern: /^\/api\/listings\/[^\/]+\/edit$/,
    level: AuthLevel.AUTHENTICATED,
    customCheck: async (req, token) => {
      // Check if user owns the listing or is admin
      const listingId = req.nextUrl.pathname.split('/')[3];
      // Implementation would check database
      return true; // Placeholder
    },
  },
];

// Default permission for unmatched routes (secure by default)
const DEFAULT_PERMISSION: RoutePermission = {
  pattern: /.*/,
  level: AuthLevel.AUTHENTICATED,
};

/**
 * Get user role from database
 */
async function getUserRole(userId: string): Promise<string | null> {
  try {
    // This would typically query your database
    // For now, return null to indicate regular user
    // In production, implement proper role checking
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user has required authorization level
 */
async function hasRequiredAuthLevel(
  token: any,
  requiredLevel: AuthLevel
): Promise<boolean> {
  switch (requiredLevel) {
    case AuthLevel.PUBLIC:
      return true;

    case AuthLevel.AUTHENTICATED:
      return !!token?.sub; // Has valid token with user ID

    case AuthLevel.ADMIN:
      if (!token?.sub) return false;
      const userRole = await getUserRole(token.sub);
      return userRole === 'admin' || userRole === 'super_admin';

    case AuthLevel.SUPER_ADMIN:
      if (!token?.sub) return false;
      const superAdminRole = await getUserRole(token.sub);
      return superAdminRole === 'super_admin';

    default:
      return false;
  }
}

/**
 * Find matching route permission
 */
function findRoutePermission(
  pathname: string,
  method: string
): RoutePermission {
  for (const permission of ROUTE_PERMISSIONS) {
    if (permission.pattern.test(pathname)) {
      // Check if method is allowed (if methods are specified)
      if (permission.methods && !permission.methods.includes(method)) {
        continue;
      }
      return permission;
    }
  }

  return DEFAULT_PERMISSION;
}

/**
 * Authentication middleware
 */
export function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>,
  overrideLevel?: AuthLevel
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      const pathname = req.nextUrl.pathname;
      const method = req.method;

      // Skip auth for non-API routes
      if (!pathname.startsWith('/api/')) {
        return handler(req);
      }

      // Find required permission level
      const routePermission = overrideLevel
        ? { pattern: /.*/, level: overrideLevel }
        : findRoutePermission(pathname, method);

      // Get JWT token
      const secureConfig = getSecureAuthConfig();
      const token = await getToken({
        req,
        secret: secureConfig.secret,
      });

      // Check authentication level
      const hasAuth = await hasRequiredAuthLevel(token, routePermission.level);

      if (!hasAuth) {
        const errorMessage =
          routePermission.level === AuthLevel.PUBLIC
            ? 'Access denied'
            : routePermission.level === AuthLevel.AUTHENTICATED
              ? 'Authentication required'
              : 'Insufficient permissions';

        return NextResponse.json(
          { error: errorMessage },
          {
            status:
              routePermission.level === AuthLevel.AUTHENTICATED ? 401 : 403,
            headers: {
              'WWW-Authenticate': 'Bearer',
            },
          }
        );
      }

      // Run custom authorization check if defined
      if (routePermission.customCheck) {
        const customAuthPassed = await routePermission.customCheck(req, token);
        if (!customAuthPassed) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }

      // Add user context to headers for the handler
      if (token?.sub) {
        req.headers.set('x-user-id', token.sub);
        req.headers.set('x-user-email', token.email || '');
      }

      // Log successful authentication
      if (routePermission.level !== AuthLevel.PUBLIC) {
        console.log(
          `Authenticated request: ${method} ${pathname} by user ${token?.sub}`
        );
      }

      return handler(req);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function withRole(requiredRole: string) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return withAuth(async function (req: NextRequest): Promise<NextResponse> {
      const token = await getToken({
        req,
        secret: getSecureAuthConfig().secret,
      });

      if (!token?.sub) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const userRole = await getUserRole(token.sub);

      if (userRole !== requiredRole && userRole !== 'super_admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req);
    }, AuthLevel.AUTHENTICATED);
  };
}

/**
 * Owner-based authorization middleware
 */
export function withOwnership(
  getResourceOwnerId: (req: NextRequest) => Promise<string | null>
) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return withAuth(async function (req: NextRequest): Promise<NextResponse> {
      const token = await getToken({
        req,
        secret: getSecureAuthConfig().secret,
      });

      if (!token?.sub) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if user is admin (admins can access everything)
      const userRole = await getUserRole(token.sub);
      if (userRole === 'admin' || userRole === 'super_admin') {
        return handler(req);
      }

      // Check ownership
      const resourceOwnerId = await getResourceOwnerId(req);

      if (resourceOwnerId !== token.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return handler(req);
    }, AuthLevel.AUTHENTICATED);
  };
}

/**
 * API key authentication for external services
 */
export function withApiKey(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const apiKey =
      req.headers.get('x-api-key') ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    // Validate API key (implement proper API key validation)
    const validApiKey = process.env.API_SECRET_KEY;

    if (!validApiKey || apiKey !== validApiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    return handler(req);
  };
}

/**
 * Rate limiting by user
 */
export function withUserRateLimit(
  requests: number = 100,
  windowMs: number = 60000 // 1 minute
) {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return withAuth(async function (req: NextRequest): Promise<NextResponse> {
      const token = await getToken({
        req,
        secret: getSecureAuthConfig().secret,
      });

      const userId = token?.sub || req.ip || 'anonymous';
      const now = Date.now();

      // Clean up expired entries
      for (const [key, value] of userRequests.entries()) {
        if (now > value.resetTime) {
          userRequests.delete(key);
        }
      }

      // Check current user's rate limit
      const userLimit = userRequests.get(userId);

      if (userLimit) {
        if (now < userLimit.resetTime) {
          if (userLimit.count >= requests) {
            return NextResponse.json(
              { error: 'Rate limit exceeded' },
              {
                status: 429,
                headers: {
                  'X-RateLimit-Limit': requests.toString(),
                  'X-RateLimit-Remaining': '0',
                  'X-RateLimit-Reset': new Date(
                    userLimit.resetTime
                  ).toISOString(),
                },
              }
            );
          }
          userLimit.count++;
        } else {
          // Reset window
          userLimit.count = 1;
          userLimit.resetTime = now + windowMs;
        }
      } else {
        // First request for this user
        userRequests.set(userId, {
          count: 1,
          resetTime: now + windowMs,
        });
      }

      return handler(req);
    }, AuthLevel.PUBLIC);
  };
}

// Export route permission configuration for testing
export { ROUTE_PERMISSIONS, DEFAULT_PERMISSION };
