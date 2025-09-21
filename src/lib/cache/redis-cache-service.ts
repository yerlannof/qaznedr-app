import { Redis } from '@upstash/redis';
import { SearchFilters, SearchResult } from '@/lib/search/search-service';
import { Database } from '@/lib/supabase/database.types';

type Deposit = Database['public']['Tables']['kazakhstan_deposits']['Row'];

// Cache configuration
const CACHE_CONFIG = {
  // TTL (Time To Live) in seconds
  ttl: {
    search: 5 * 60, // 5 minutes for search results
    deposit: 15 * 60, // 15 minutes for individual deposits
    facets: 10 * 60, // 10 minutes for search facets
    suggestions: 30 * 60, // 30 minutes for search suggestions
    userProfile: 60 * 60, // 1 hour for user profiles
    listings: 5 * 60, // 5 minutes for listings page
    statistics: 30 * 60, // 30 minutes for site statistics
    session: 15 * 60, // 15 minutes for session data
  },
  // Key prefixes for organization
  prefixes: {
    search: 'search:',
    deposit: 'deposit:',
    facets: 'facets:',
    suggestions: 'suggest:',
    user: 'user:',
    listings: 'listings:',
    stats: 'stats:',
    session: 'session:',
    api: 'api:',
  },
  // Cache sizes and limits
  maxSearchResults: 1000,
  maxSuggestions: 50,
  batchSize: 100,
};

// Initialize Redis connection (using existing Upstash configuration)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class RedisCacheService {
  private static instance: RedisCacheService;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  static getInstance(): RedisCacheService {
    if (!this.instance) {
      this.instance = new RedisCacheService();
    }
    return this.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Test Redis connection
      await redis.ping();
      this.isConnected = true;
      console.log('✅ Redis cache connected successfully');
    } catch (error) {
      console.error('❌ Redis cache connection failed:', error);
      this.isConnected = false;
    }
  }

  /**
   * Generic cache get with JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value as string) : null;
    } catch (error) {
      console.error(`❌ Cache get failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Generic cache set with JSON serialization and TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`❌ Cache set failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a cache key
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Cache delete failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple cache keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error(`❌ Cache delete by pattern failed for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    filters: SearchFilters,
    results: SearchResult
  ): Promise<void> {
    const key = this.generateSearchKey(filters);
    await this.set(key, results, CACHE_CONFIG.ttl.search);
    console.log(`📦 Cached search results: ${key}`);
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(
    filters: SearchFilters
  ): Promise<SearchResult | null> {
    const key = this.generateSearchKey(filters);
    const cached = await this.get<SearchResult>(key);
    if (cached) {
      console.log(`🎯 Cache hit for search: ${key}`);
    }
    return cached;
  }

  /**
   * Cache individual deposit
   */
  async cacheDeposit(deposit: Deposit): Promise<void> {
    const key = `${CACHE_CONFIG.prefixes.deposit}${deposit.id}`;
    await this.set(key, deposit, CACHE_CONFIG.ttl.deposit);
  }

  /**
   * Get cached deposit
   */
  async getCachedDeposit(id: string): Promise<Deposit | null> {
    const key = `${CACHE_CONFIG.prefixes.deposit}${id}`;
    return await this.get<Deposit>(key);
  }

  /**
   * Cache multiple deposits
   */
  async cacheDepositsBatch(deposits: Deposit[]): Promise<void> {
    if (!this.isConnected || deposits.length === 0) return;

    try {
      const pipeline = redis.pipeline();

      for (const deposit of deposits) {
        const key = `${CACHE_CONFIG.prefixes.deposit}${deposit.id}`;
        pipeline.setex(key, CACHE_CONFIG.ttl.deposit, JSON.stringify(deposit));
      }

      await pipeline.exec();
      console.log(`📦 Cached ${deposits.length} deposits in batch`);
    } catch (error) {
      console.error('❌ Batch cache deposits failed:', error);
    }
  }

  /**
   * Cache search suggestions
   */
  async cacheSuggestions(query: string, suggestions: string[]): Promise<void> {
    const key = `${CACHE_CONFIG.prefixes.suggestions}${query.toLowerCase()}`;
    await this.set(key, suggestions, CACHE_CONFIG.ttl.suggestions);
  }

  /**
   * Get cached suggestions
   */
  async getCachedSuggestions(query: string): Promise<string[] | null> {
    const key = `${CACHE_CONFIG.prefixes.suggestions}${query.toLowerCase()}`;
    return await this.get<string[]>(key);
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    const key = `${CACHE_CONFIG.prefixes.session}${userId}`;
    await this.set(key, sessionData, CACHE_CONFIG.ttl.session);
  }

  /**
   * Get cached user session
   */
  async getCachedUserSession(userId: string): Promise<any | null> {
    const key = `${CACHE_CONFIG.prefixes.session}${userId}`;
    return await this.get(key);
  }

  /**
   * Cache API response
   */
  async cacheApiResponse(
    endpoint: string,
    params: any,
    response: any,
    ttl?: number
  ): Promise<void> {
    const key = this.generateApiKey(endpoint, params);
    await this.set(key, response, ttl || CACHE_CONFIG.ttl.listings);
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(
    endpoint: string,
    params: any
  ): Promise<any | null> {
    const key = this.generateApiKey(endpoint, params);
    return await this.get(key);
  }

  /**
   * Cache site statistics
   */
  async cacheStatistics(stats: any): Promise<void> {
    const key = `${CACHE_CONFIG.prefixes.stats}global`;
    await this.set(key, stats, CACHE_CONFIG.ttl.statistics);
  }

  /**
   * Get cached statistics
   */
  async getCachedStatistics(): Promise<any | null> {
    const key = `${CACHE_CONFIG.prefixes.stats}global`;
    return await this.get(key);
  }

  /**
   * Invalidate related caches when deposit changes
   */
  async invalidateDepositCaches(depositId: string): Promise<void> {
    console.log(`🗑️ Invalidating caches for deposit: ${depositId}`);

    // Delete specific deposit cache
    await this.delete(`${CACHE_CONFIG.prefixes.deposit}${depositId}`);

    // Delete related search caches (they might contain this deposit)
    await this.deleteByPattern(`${CACHE_CONFIG.prefixes.search}*`);

    // Delete facets cache (counts might have changed)
    await this.deleteByPattern(`${CACHE_CONFIG.prefixes.facets}*`);

    // Delete listings caches
    await this.deleteByPattern(`${CACHE_CONFIG.prefixes.listings}*`);

    // Delete API caches that might include this deposit
    await this.deleteByPattern(`${CACHE_CONFIG.prefixes.api}*`);
  }

  /**
   * Invalidate all user-related caches
   */
  async invalidateUserCaches(userId: string): Promise<void> {
    console.log(`🗑️ Invalidating caches for user: ${userId}`);

    // Delete user session
    await this.delete(`${CACHE_CONFIG.prefixes.session}${userId}`);

    // Delete user-specific data
    await this.deleteByPattern(`${CACHE_CONFIG.prefixes.user}${userId}*`);
  }

  /**
   * Invalidate all search-related caches
   */
  async invalidateSearchCaches(): Promise<void> {
    console.log('🗑️ Invalidating all search caches');

    const deletedCounts = await Promise.all([
      this.deleteByPattern(`${CACHE_CONFIG.prefixes.search}*`),
      this.deleteByPattern(`${CACHE_CONFIG.prefixes.facets}*`),
      this.deleteByPattern(`${CACHE_CONFIG.prefixes.suggestions}*`),
    ]);

    const totalDeleted = deletedCounts.reduce((sum, count) => sum + count, 0);
    console.log(`🗑️ Deleted ${totalDeleted} search cache keys`);
  }

  /**
   * Generate cache key for search results
   */
  private generateSearchKey(filters: SearchFilters): string {
    // Create a deterministic key from search filters
    const keyData = {
      query: filters.query?.toLowerCase() || '',
      type: filters.type?.sort() || [],
      mineral: filters.mineral?.sort() || [],
      region: filters.region?.sort() || [],
      priceMin: filters.priceMin || 0,
      priceMax: filters.priceMax || 0,
      areaMin: filters.areaMin || 0,
      areaMax: filters.areaMax || 0,
      verified: filters.verified,
      featured: filters.featured,
      status: filters.status?.sort() || [],
      sortBy: filters.sortBy || 'created_at',
      sortOrder: filters.sortOrder || 'desc',
      page: filters.page || 1,
      limit: filters.limit || 12,
    };

    const keyString = JSON.stringify(keyData);
    const hash = this.simpleHash(keyString);
    return `${CACHE_CONFIG.prefixes.search}${hash}`;
  }

  /**
   * Generate cache key for API responses
   */
  private generateApiKey(endpoint: string, params: any): string {
    const keyData = { endpoint, params };
    const keyString = JSON.stringify(keyData);
    const hash = this.simpleHash(keyString);
    return `${CACHE_CONFIG.prefixes.api}${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    connected: boolean;
    totalKeys: number;
    keysByPrefix: Record<string, number>;
    memoryUsage?: string;
  }> {
    if (!this.isConnected) {
      return { connected: false, totalKeys: 0, keysByPrefix: {} };
    }

    try {
      // Get all keys
      const allKeys = await redis.keys('*');

      // Count keys by prefix
      const keysByPrefix: Record<string, number> = {};
      for (const prefix of Object.values(CACHE_CONFIG.prefixes)) {
        const prefixKeys = allKeys.filter((key) => key.startsWith(prefix));
        keysByPrefix[prefix] = prefixKeys.length;
      }

      return {
        connected: true,
        totalKeys: allKeys.length,
        keysByPrefix,
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return { connected: false, totalKeys: 0, keysByPrefix: {} };
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const keys = await redis.keys('*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      console.log(`🗑️ Cleared all cache: ${keys.length} keys deleted`);
      return keys.length;
    } catch (error) {
      console.error('❌ Failed to clear all cache:', error);
      return 0;
    }
  }

  /**
   * Warm up cache with popular data
   */
  async warmUp(): Promise<void> {
    if (!this.isConnected) return;

    console.log('🔥 Warming up cache...');

    try {
      // You can implement cache warming strategies here
      // For example, pre-cache popular search results, featured deposits, etc.

      console.log('✅ Cache warm-up completed');
    } catch (error) {
      console.error('❌ Cache warm-up failed:', error);
    }
  }

  /**
   * Health check for Redis cache
   */
  async healthCheck(): Promise<{
    connected: boolean;
    latency: number;
    memoryUsage?: any;
  }> {
    try {
      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;

      return {
        connected: true,
        latency,
      };
    } catch (error) {
      console.error('❌ Redis health check failed:', error);
      return {
        connected: false,
        latency: -1,
      };
    }
  }
}

// Export singleton instance
export const redisCacheService = RedisCacheService.getInstance();
