import { NextRequest, NextResponse } from 'next/server';
import { redisCacheService } from '@/lib/cache/redis-cache-service';

// Cache middleware configuration
interface CacheConfig {
  ttl?: number;
  varyByUser?: boolean;
  varyByQuery?: boolean;
  skipCache?: (req: NextRequest) => boolean;
  cacheKey?: (req: NextRequest) => string;
}

/**
 * HTTP caching middleware for API routes
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CacheConfig = {}
) {
  return async function cachedHandler(req: NextRequest): Promise<NextResponse> {
    const {
      ttl = 300, // 5 minutes default
      varyByUser = false,
      varyByQuery = true,
      skipCache = () => false,
      cacheKey,
    } = config;

    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return handler(req);
    }

    // Skip caching if specified
    if (skipCache(req)) {
      return handler(req);
    }

    try {
      // Generate cache key
      const key = cacheKey
        ? cacheKey(req)
        : generateCacheKey(req, { varyByUser, varyByQuery });

      // Try to get cached response
      const cached = await redisCacheService.getCachedApiResponse(
        'middleware',
        key
      );

      if (cached) {
        console.log(`🎯 Cache hit for: ${key}`);

        // Return cached response with cache headers
        const response = NextResponse.json(cached.data, {
          status: cached.status,
        });
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-Key', key);
        response.headers.set('Cache-Control', `public, max-age=${ttl}`);

        return response;
      }

      // Execute handler
      const response = await handler(req);

      // Only cache successful responses
      if (response.status >= 200 && response.status < 300) {
        try {
          // Get response body
          const responseData = await response.json();

          // Cache the response
          await redisCacheService.cacheApiResponse(
            'middleware',
            key,
            {
              data: responseData,
              status: response.status,
              timestamp: new Date().toISOString(),
            },
            ttl
          );

          console.log(`📦 Cached response for: ${key}`);

          // Return response with cache headers
          const newResponse = NextResponse.json(responseData, {
            status: response.status,
          });
          newResponse.headers.set('X-Cache', 'MISS');
          newResponse.headers.set('X-Cache-Key', key);
          newResponse.headers.set('Cache-Control', `public, max-age=${ttl}`);

          return newResponse;
        } catch (error) {
          console.error('❌ Failed to cache response:', error);
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Cache middleware error:', error);
      return handler(req);
    }
  };
}

/**
 * Generate cache key for request
 */
function generateCacheKey(
  req: NextRequest,
  options: { varyByUser: boolean; varyByQuery: boolean }
): string {
  const { pathname, searchParams } = req.nextUrl;
  const { varyByUser, varyByQuery } = options;

  const keyParts = [pathname];

  // Include query parameters
  if (varyByQuery && searchParams.toString()) {
    // Sort params for consistent keys
    const sortedParams = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    keyParts.push(sortedParams);
  }

  // Include user identifier
  if (varyByUser) {
    const userId = req.headers.get('x-user-id');
    if (userId) {
      keyParts.push(`user:${userId}`);
    }
  }

  return keyParts.join('|');
}

/**
 * Cache invalidation middleware
 */
export function withCacheInvalidation(
  handler: (req: NextRequest) => Promise<NextResponse>,
  invalidationConfig: {
    patterns?: string[];
    keys?: string[];
    userSpecific?: boolean;
  } = {}
) {
  return async function invalidatingHandler(
    req: NextRequest
  ): Promise<NextResponse> {
    // Execute handler first
    const response = await handler(req);

    // Only invalidate on successful mutations
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      response.status >= 200 &&
      response.status < 300
    ) {
      try {
        const {
          patterns = [],
          keys = [],
          userSpecific = false,
        } = invalidationConfig;

        // Invalidate specific patterns
        for (const pattern of patterns) {
          await redisCacheService.deleteByPattern(pattern);
          console.log(`🗑️ Invalidated cache pattern: ${pattern}`);
        }

        // Invalidate specific keys
        for (const key of keys) {
          await redisCacheService.delete(key);
          console.log(`🗑️ Invalidated cache key: ${key}`);
        }

        // Invalidate user-specific caches
        if (userSpecific) {
          const userId = req.headers.get('x-user-id');
          if (userId) {
            await redisCacheService.invalidateUserCaches(userId);
          }
        }
      } catch (error) {
        console.error('❌ Cache invalidation error:', error);
      }
    }

    return response;
  };
}

/**
 * Smart cache middleware that automatically invalidates related caches
 */
export function withSmartCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: {
    cache?: CacheConfig;
    invalidation?: {
      patterns?: string[];
      keys?: string[];
      userSpecific?: boolean;
    };
  } = {}
) {
  const cachedHandler = config.cache
    ? withCache(handler, config.cache)
    : handler;
  return config.invalidation
    ? withCacheInvalidation(cachedHandler, config.invalidation)
    : cachedHandler;
}

/**
 * Prebuilt cache configurations for common use cases
 */
export const CacheConfigs = {
  // Short cache for frequently changing data
  short: {
    ttl: 60, // 1 minute
    varyByQuery: true,
  },

  // Medium cache for semi-static data
  medium: {
    ttl: 300, // 5 minutes
    varyByQuery: true,
  },

  // Long cache for static data
  long: {
    ttl: 3600, // 1 hour
    varyByQuery: true,
  },

  // User-specific cache
  userSpecific: {
    ttl: 900, // 15 minutes
    varyByUser: true,
    varyByQuery: true,
  },

  // Search results cache
  search: {
    ttl: 300, // 5 minutes
    varyByQuery: true,
    skipCache: (req: NextRequest) => {
      // Skip cache for searches with very specific queries
      const query = req.nextUrl.searchParams.get('q');
      return query ? query.length > 50 : false;
    },
  },

  // Public listings cache
  listings: {
    ttl: 180, // 3 minutes
    varyByQuery: true,
  },
};

/**
 * Cache warming utility
 */
export async function warmCache(
  routes: Array<{ path: string; params?: Record<string, string> }>
) {
  console.log('🔥 Starting cache warming...');

  let warmed = 0;
  for (const route of routes) {
    try {
      const url = new URL(
        route.path,
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      );

      if (route.params) {
        for (const [key, value] of Object.entries(route.params)) {
          url.searchParams.set(key, value);
        }
      }

      // Make request to warm cache
      const response = await fetch(url.toString());
      if (response.ok) {
        warmed++;
        console.log(`🔥 Warmed cache for: ${url.pathname}`);
      }
    } catch (error) {
      console.error(`❌ Failed to warm cache for ${route.path}:`, error);
    }
  }

  console.log(
    `✅ Cache warming completed: ${warmed}/${routes.length} routes warmed`
  );
}
