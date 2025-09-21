import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Cache key prefixes
const CACHE_PREFIX = {
  LISTINGS: 'listings:',
  DEPOSIT: 'deposit:',
  USER: 'user:',
  ANALYTICS: 'analytics:',
  SEARCH: 'search:',
} as const;

// Cache TTL in seconds
const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

export class CacheService {
  private static instance: CacheService;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const data = await redis.get(key);
      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<boolean> {
    if (!redis) return false;

    try {
      await redis.set(key, value, {
        ex: ttl,
      });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!redis) return false;

    try {
      // Note: This is a simplified version. In production, you might want to use SCAN
      // For now, we'll invalidate specific known keys
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
      return false;
    }
  }

  // Generate cache key
  generateKey(prefix: keyof typeof CACHE_PREFIX, ...parts: string[]): string {
    return `${CACHE_PREFIX[prefix]}${parts.join(':')}`;
  }

  // Cache wrapper for functions
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}

// Export singleton instance
export const cache = CacheService.getInstance();

// Export constants
export { CACHE_TTL, CACHE_PREFIX };

// Helper function for query caching
export function getCacheKey(
  prefix: keyof typeof CACHE_PREFIX,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join(':');
  return cache.generateKey(prefix, sortedParams);
}
