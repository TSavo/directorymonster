import { redis } from './redis';

const DEFAULT_CACHE_TTL = 60 * 5; // 5 minutes in seconds

/**
 * Cache wrapper for Redis that implements a basic caching strategy
 * with automatic JSON parsing/stringifying
 */
export const redisCache = {
  /**
   * Get a value from cache, or compute and store if not present
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: { ttl?: number } = {}
  ): Promise<T> {
    const cacheKey = `cache:${key}`;
    const cachedValue = await redis.get(cacheKey);
    
    // If we have a cache hit, parse and return the value
    if (cachedValue) {
      try {
        return JSON.parse(cachedValue) as T;
      } catch (e) {
        // If parsing fails, continue to fetch fresh data
        console.warn(`[Redis Cache] Parse error for key ${key}:`, e);
      }
    }
    
    // No cache hit or parse error, execute the fetch function
    const freshData = await fetchFn();
    
    // Store the fresh data in cache
    const ttl = options.ttl !== undefined ? options.ttl : DEFAULT_CACHE_TTL;
    await redis.setex(cacheKey, ttl, JSON.stringify(freshData));
    
    return freshData;
  },
  
  /**
   * Invalidate a cache entry
   */
  async invalidate(key: string): Promise<void> {
    await redis.del(`cache:${key}`);
  },
  
  /**
   * Clear all cache entries (use with caution)
   */
  async clear(): Promise<void> {
    const keys = await redis.keys('cache:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};