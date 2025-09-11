/**
 * Client-side caching utilities for better performance
 */

import { logger } from './logger';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Cache configuration
interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

// Memory cache implementation
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      cleanupInterval: 60 * 1000, // 1 minute
      ...config,
    };

    this.startCleanup();
  }

  // Set cache entry
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, entry);
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Delete cache entry
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.config.maxSize,
    };
  }

  // Start cleanup timer
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      logger.debug('Cache cleanup', {
        expired: keysToDelete.length,
        remaining: this.cache.size,
      });
    }
  }

  // Destroy cache and cleanup timer
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

// Global cache instance
const globalCache = new MemoryCache();

// Export cache functions
export const cache = {
  set: globalCache.set.bind(globalCache),
  get: globalCache.get.bind(globalCache),
  has: globalCache.has.bind(globalCache),
  delete: globalCache.delete.bind(globalCache),
  clear: globalCache.clear.bind(globalCache),
  getStats: globalCache.getStats.bind(globalCache),
};

// localStorage cache with fallback to memory
class PersistentCache {
  private memoryFallback = new MemoryCache();
  private isLocalStorageAvailable = false;

  constructor() {
    this.checkLocalStorageAvailability();
  }

  private checkLocalStorageAvailability(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        this.isLocalStorageAvailable = true;
      }
    } catch {
      this.isLocalStorageAvailable = false;
    }
  }

  private getStorageKey(key: string): string {
    return `qaznedr_cache_${key}`;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 5 * 60 * 1000,
    };

    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
        return;
      } catch (error) {
        logger.warn('localStorage cache set failed', { key, error });
      }
    }

    // Fallback to memory cache
    this.memoryFallback.set(key, data, ttl);
  }

  get<T>(key: string): T | null {
    if (this.isLocalStorageAvailable) {
      try {
        const stored = localStorage.getItem(this.getStorageKey(key));
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);

          // Check if expired
          if (Date.now() - entry.timestamp > entry.ttl) {
            localStorage.removeItem(this.getStorageKey(key));
            return null;
          }

          return entry.data;
        }
      } catch (error) {
        logger.warn('localStorage cache get failed', { key, error });
      }
    }

    // Fallback to memory cache
    return this.memoryFallback.get(key);
  }

  delete(key: string): void {
    if (this.isLocalStorageAvailable) {
      localStorage.removeItem(this.getStorageKey(key));
    }
    this.memoryFallback.delete(key);
  }

  clear(): void {
    if (this.isLocalStorageAvailable) {
      // Remove all qaznedr cache keys
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('qaznedr_cache_')) {
          localStorage.removeItem(key);
        }
      });
    }
    this.memoryFallback.clear();
  }
}

// Persistent cache instance
export const persistentCache = new PersistentCache();

// Memoization decorator
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const memoCache = new Map<string, CacheEntry<ReturnType<T>>>();

  const memoizedFn = (...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args) || 'default';
    const cached = memoCache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const result = fn(...args);
    memoCache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl: ttl || 5 * 60 * 1000,
    });

    return result;
  };

  return memoizedFn as T;
}

// Async memoization
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const memoCache = new Map<
    string,
    {
      promise: Promise<Awaited<ReturnType<T>>>;
      timestamp: number;
      ttl: number;
    }
  >();

  const memoizedFn = (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args) || 'default';
    const cached = memoCache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.promise;
    }

    const promise = fn(...args);
    memoCache.set(key, {
      promise,
      timestamp: Date.now(),
      ttl: ttl || 5 * 60 * 1000,
    });

    // Clean up on rejection
    promise.catch(() => {
      memoCache.delete(key);
    });

    return promise;
  };

  return memoizedFn as T;
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalCache.destroy();
  });
}
