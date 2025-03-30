/**
 * Redis client with automatic fallback to in-memory implementation
 */
import { createRedisClient, isRedisConnected, forceRedisReconnect, getRedisConnectionState, onRedisConnectionStateChange } from './connection-manager';
import { MemoryRedis } from './memory-store';

// Create or reuse the global client instance
declare global {
  var redisClient: any;
}

// Initialize Redis client if not already created
if (typeof global !== 'undefined' && !global.redisClient) {
  console.log('[Redis] Initializing Redis client');
  global.redisClient = createRedisClient();
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
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      return value as unknown as T;
    }
  },
  
  set: async (key: string, value: any, options?: { ex?: number }): Promise<void> => {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (options?.ex) {
      await redis.setex(key, options.ex, serializedValue);
    } else {
      await redis.set(key, serializedValue);
    }
  },
  
  del: async (key: string): Promise<void> => {
    await redis.del(key);
  },
  
  keys: async (pattern: string): Promise<string[]> => {
    return await redis.keys(pattern);
  },
  
  // Add expire function for rate limiting
  expire: async (key: string, seconds: number): Promise<void> => {
    await redis.expire(key, seconds);
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
