import { Redis } from 'ioredis';

// Enable in-memory fallback for development without Redis
const USE_MEMORY_FALLBACK = true;

// Create a Redis client using REDIS_URL environment variable
// Use environment variable, with fallbacks for different scenarios
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

console.log(`Connecting to Redis at ${redisUrl}`);

// Create Redis client with fallback to in-memory store
let redis;

// Type definition for mock Redis
type MockRedis = {
  get: (key: string) => Promise<any>;
  set: (key: string, value: string, ...args: any[]) => Promise<string>;
  del: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  ping: () => Promise<string>;
  sadd: (key: string, ...values: any[]) => Promise<number>;
};

// In-memory mock Redis implementation
const createMemoryRedis = (): MockRedis => {
  console.log('Using in-memory fallback for Redis');
  
  // Try to import pre-seeded data if available
  try {
    // Use pre-seeded data if available (from our seed script)
    const seedData = require('../../scripts/seed-data');
    console.log('Using pre-seeded data from seed-data.js');
    
    // Run the seed function to populate the memory store if needed
    seedData.seedData().catch((error: Error) => {
      console.error('Error seeding data:', error);
    });
    
    return seedData.redis as MockRedis;
  } catch (error) {
    console.log('Could not load pre-seeded data, using empty memory store');
    
    // Create a fresh memory store
    const memoryStore = new Map<string, any>();
    
    return {
      get: async (key: string) => memoryStore.get(key),
      set: async (key: string, value: string, ...args: any[]) => {
        memoryStore.set(key, value);
        return 'OK';
      },
      del: async (...keys: string[]) => {
        let count = 0;
        for (const key of keys) {
          if (memoryStore.delete(key)) count++;
        }
        return count;
      },
      keys: async (pattern: string) => {
        const wildcard = pattern.includes('*');
        const prefix = pattern.replace('*', '');
        return Array.from(memoryStore.keys()).filter(k => 
          wildcard ? k.startsWith(prefix) : k === pattern
        );
      },
      ping: async () => 'PONG',
      sadd: async (key: string, ...values: any[]) => {
        if (!memoryStore.has(key)) {
          memoryStore.set(key, new Set());
        }
        const set = memoryStore.get(key);
        values.forEach((v: any) => set.add(v));
        return values.length;
      },
    };
  }
};

if (USE_MEMORY_FALLBACK) {
  redis = createMemoryRedis();
} else {
  try {
    // Create Redis client with retry options
    redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        console.log(`Redis connection attempt ${times}`);
        if (times > 3) {
          console.log('Max Redis connection attempts reached, using memory fallback');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 30000);
      },
    });
  } catch (error) {
    console.error('Redis connection error:', error);
    redis = createMemoryRedis();
  }
}

// Export Redis client directly
export { redis };

// Also export a simple KV-like interface for compatibility with existing code
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
      await redis.set(key, serializedValue, 'EX', options.ex);
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
};