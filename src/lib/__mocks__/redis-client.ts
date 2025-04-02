/**
 * Mock Redis client for testing
 */
import redis from './redis';

// Key-value interface for simplified Redis operations
export const kv = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`[Redis] Error getting key ${key}:`, error);
      return null;
    }
  },

  set: async (key: string, value: any, options?: { ex?: number }): Promise<void> => {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (options?.ex) {
        await redis.expire(key, options.ex);
      }
      await redis.set(key, serializedValue);
    } catch (error) {
      console.error(`[Redis] Error setting key ${key}:`, error);
    }
  },

  del: async (key: string): Promise<void> => {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`[Redis] Error deleting key ${key}:`, error);
    }
  },

  keys: async (pattern: string): Promise<string[]> => {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error(`[Redis] Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  },

  // Add expire function for rate limiting
  expire: async (key: string, seconds: number): Promise<void> => {
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      console.error(`[Redis] Error setting expiry for key ${key}:`, error);
    }
  },

  // Check connection status
  isConnected: async (): Promise<boolean> => {
    return true;
  },

  // Force reconnection
  reconnect: (): void => {
    // No-op for tests
  },

  // Get connection state
  getConnectionState: (): string => {
    return 'connected';
  }
};

// Export the Redis client
export { redis };

// Export the MemoryRedis class
export class MemoryRedis {
  store: Map<string, any>;

  constructor() {
    this.store = new Map<string, any>();
  }
}
