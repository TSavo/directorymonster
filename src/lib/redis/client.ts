/**
 * Redis client with automatic fallback to in-memory implementation
 */
import { createRedisClient, isRedisConnected, forceRedisReconnect, getRedisConnectionState, onRedisConnectionStateChange } from './connection-manager';
import { MemoryRedis } from './memory-store';

// Import hash operations to extend MemoryRedis
import './hash-operations';

// Create or reuse the global client instance
declare global {
  var redisClient: any;
  var redisInitTime: number;
}

// Initialize Redis client if not already created
if (typeof global !== 'undefined' && (!global.redisClient || !global.redisInitTime)) {
  console.log('[Redis] Initializing Redis client');

  // Track when we initialized Redis - for debugging connection cycles
  global.redisInitTime = Date.now();

  // Only create a new client if one doesn't exist
  if (!global.redisClient) {
    global.redisClient = createRedisClient();
  } else {
    console.log('[Redis] Reusing existing Redis client');
  }
} else if (typeof global !== 'undefined' && global.redisClient) {
  // Log but don't recreate if client already exists
  const timeSinceInit = Date.now() - (global.redisInitTime || 0);
  console.log(`[Redis] Redis client already initialized ${timeSinceInit}ms ago`);
}

// The Redis client (real or in-memory)
export const redis = global.redisClient;

/**
 * Helper function to clear all users from the database
 * This is useful for testing the first user setup flow
 */
export const clearUsers = async (): Promise<void> => {
  try {
    // Get all user keys
    const userKeys = await redis.keys('user:*');

    if (userKeys.length > 0) {
      // Delete each user key
      if (redis instanceof MemoryRedis) {
        // For memory Redis, delete each key individually
        for (const key of userKeys) {
          redis.store.delete(key);
        }
      } else {
        // For real Redis, delete all keys at once
        await redis.del(...userKeys);
      }
      console.log(`[Redis] Cleared ${userKeys.length} users from the database`);
    }
  } catch (error) {
    console.error('[Redis] Error clearing users:', error);
  }
};

// Export connection management functions
export {
  isRedisConnected,
  forceRedisReconnect,
  getRedisConnectionState,
  onRedisConnectionStateChange
};

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
        await redis.setex(key, options.ex, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
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
    return await isRedisConnected();
  },

  // Force reconnection
  reconnect: (): void => {
    forceRedisReconnect();
  },

  // Get connection state
  getConnectionState: (): string => {
    return getRedisConnectionState();
  }
};
