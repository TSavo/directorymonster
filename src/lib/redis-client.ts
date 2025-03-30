// In-memory Redis implementation that doesn't depend on ioredis
class MemoryRedis {
  store: Map<string, any>;
  
  constructor() {
    // Create a new store if it doesn't exist globally
    if (typeof global !== 'undefined' && !global.inMemoryRedisStore) {
      global.inMemoryRedisStore = new Map<string, any>();
      console.log('Created global in-memory Redis store');
    }
    
    // Use the global store if available, otherwise create a local one
    this.store = (typeof global !== 'undefined' && global.inMemoryRedisStore) 
      ? global.inMemoryRedisStore 
      : new Map<string, any>();
      
    console.log(`Using in-memory Redis with ${this.store.size} keys`);
  }
  
  // Basic Redis operations
  async get(key: string): Promise<any> {
    return this.store.get(key);
  }
  
  async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }
  
  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }
  
  async keys(pattern: string): Promise<string[]> {
    console.log(`[MemoryRedis] Searching for keys matching pattern: ${pattern}`);
    const wildcard = pattern.includes('*');
    const prefix = pattern.replace('*', '');
    
    const allKeys = Array.from(this.store.keys());
    
    const matchingKeys = allKeys.filter(k => 
      wildcard ? k.startsWith(prefix) : k === pattern
    );
    
    return matchingKeys;
  }
  
  // Set operations
  async sadd(key: string, ...values: any[]): Promise<number> {
    if (!this.store.has(key)) {
      this.store.set(key, new Set());
    }
    const set = this.store.get(key);
    let added = 0;
    for (const value of values) {
      const size = set.size;
      set.add(value);
      if (set.size > size) added++;
    }
    return added;
  }
  
  async smembers(key: string): Promise<string[]> {
    if (!this.store.has(key)) return [];
    return Array.from(this.store.get(key));
  }
  
  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.store.has(key)) return 0;
    const set = this.store.get(key);
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    return removed;
  }
  
  async sinter(...keys: string[]): Promise<string[]> {
    if (keys.length === 0) return [];
    
    const sets: Set<string>[] = [];
    for (const key of keys) {
      if (!this.store.has(key)) return []; // Empty intersection
      sets.push(new Set(this.store.get(key)));
    }
    
    if (sets.length === 0) return [];
    
    const [firstSet, ...restSets] = sets;
    const result = new Set(firstSet);
    
    for (const item of result) {
      if (!restSets.every(set => set.has(item))) {
        result.delete(item);
      }
    }
    
    return Array.from(result);
  }
  
  async scard(key: string): Promise<number> {
    if (!this.store.has(key)) return 0;
    return this.store.get(key).size;
  }
  
  // Transaction support
  multi(): any {
    const commands: { cmd: string; args: any[] }[] = [];
    
    const exec = async (): Promise<Array<[Error | null, any]>> => {
      const results: Array<[Error | null, any]> = [];
      
      for (const { cmd, args } of commands) {
        try {
          // @ts-ignore - We know these methods exist
          const result = await this[cmd](...args);
          results.push([null, result]);
        } catch (error) {
          results.push([error as Error, null]);
        }
      }
      
      return results;
    };
    
    // Helper to add commands to the transaction
    const addCommand = (cmd: string) => {
      return (...args: any[]) => {
        commands.push({ cmd, args });
        return multi;
      };
    };
    
    // Build multi object with methods
    const multi = {
      exec,
      get: addCommand('get'),
      set: addCommand('set'),
      del: addCommand('del'),
      keys: addCommand('keys'),
      sadd: addCommand('sadd'),
      srem: addCommand('srem'),
      smembers: addCommand('smembers'),
      sinter: addCommand('sinter'),
      scard: addCommand('scard'),
    };
    
    return multi;
  }
  
  // Expiration support
  async expire(key: string, seconds: number): Promise<number> {
    if (!this.store.has(key)) return 0;
    
    // Schedule deletion after the specified seconds
    setTimeout(() => {
      if (this.store.has(key)) {
        this.store.delete(key);
        console.log(`[Memory Redis] Expired key: ${key}`);
      }
    }, seconds * 1000);
    
    return 1;
  }
  
  // Utility
  async ping(): Promise<string> {
    return 'PONG';
  }
}

// Load real Redis conditionally
let Redis: any = null;
let isRedisAvailable = false;

// First check if we're in a proper Node.js environment
// Edge runtime or certain Next.js contexts might lack full Node.js APIs
const isNodeEnvironment = typeof process !== 'undefined' 
                          && typeof process.version === 'string'
                          && typeof process.version.charCodeAt === 'function';

// Only import Redis in server context, in a proper Node environment, and if not in test mode
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test' && isNodeEnvironment) {
  try {
    // This import style is compatible with Next.js and doesn't break browser builds
    const ioredis = require('ioredis');
    Redis = ioredis.Redis;
    isRedisAvailable = true;
    console.log('Successfully loaded ioredis');
  } catch (error) {
    console.error('Failed to load ioredis, will use memory fallback:', error);
    isRedisAvailable = false;
  }
} else {
  // Log the reason for not attempting to load ioredis
  if (typeof window !== 'undefined') {
    console.log('Browser environment detected, using memory fallback');
  } else if (process.env.NODE_ENV === 'test') {
    console.log('Test environment detected, using memory fallback');
  } else if (!isNodeEnvironment) {
    console.log('Not a full Node.js environment (possibly Edge runtime), using memory fallback');
  }
}

// Only use real Redis if explicitly enabled and we're in a server context
const USE_MEMORY_FALLBACK = !isRedisAvailable || 
  process.env.NODE_ENV === "test" || 
  (process.env.USE_MEMORY_FALLBACK === 'true');

// Declare global memory store for persistence across API routes
declare global {
  var inMemoryRedisStore: Map<string, any>;
  var redisClient: any;
}

// Setup Redis client (real or in-memory)
console.log('Setting up Redis client...');
let redis;

if (USE_MEMORY_FALLBACK || typeof window !== 'undefined') {
  console.log('Using memory fallback for Redis');
  // Use singleton pattern for memory redis
  if (typeof global !== 'undefined' && !global.redisClient) {
    global.redisClient = new MemoryRedis();
  }
  redis = typeof global !== 'undefined' ? global.redisClient : new MemoryRedis();
} else if (isRedisAvailable) {
  // Create Redis client with retry options
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    console.log(`Connecting to Redis at ${redisUrl}`);
    
    if (typeof global !== 'undefined' && !global.redisClient) {
      global.redisClient = new Redis(redisUrl, {
        retryStrategy: (times: number) => {
          console.log(`Redis connection attempt ${times}`);
          if (times > 3) {
            console.log('Max Redis connection attempts reached, using memory fallback');
            global.redisClient = new MemoryRedis();
            return null; // Stop retrying
          }
          return Math.min(times * 100, 30000);
        },
      });
    }
    redis = typeof global !== 'undefined' ? global.redisClient : new MemoryRedis();
  } catch (error) {
    console.error('Redis connection error:', error);
    if (typeof global !== 'undefined') {
      global.redisClient = new MemoryRedis();
    }
    redis = typeof global !== 'undefined' ? global.redisClient : new MemoryRedis();
  }
} else {
  // Fallback to memory Redis if Redis class is not available
  console.log('Redis not available, using memory fallback');
  if (typeof global !== 'undefined') {
    global.redisClient = new MemoryRedis();
  }
  redis = typeof global !== 'undefined' ? global.redisClient : new MemoryRedis();
}

// Export Redis client directly
export { redis };

/**
 * Helper function to clear all users from the database
 * This is useful for testing the first user setup flow
 */
export const clearUsers = async (): Promise<void> => {
  try {
    // Get all user keys
    const userKeys = await redis.keys('user:*');
    console.log('[clearUsers] Found user keys to clear:', userKeys);
    
    if (userKeys.length > 0) {
      // Delete each user key
      if (redis instanceof MemoryRedis) {
        // For memory Redis, delete each key individually
        for (const key of userKeys) {
          redis.store.delete(key);
          console.log(`[clearUsers] Deleted key: ${key}`);
        }
      } else {
        // For real Redis, delete all keys at once
        await redis.del(...userKeys);
      }
      console.log(`[clearUsers] Cleared ${userKeys.length} users from the database`);
    } else {
      console.log('[clearUsers] No users found to clear');
    }
  } catch (error) {
    console.error('[clearUsers] Error clearing users:', error);
  }
};

// Also export a simple KV-like interface for compatibility with existing code
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
      console.error(`[kv.get] Error getting key ${key}:`, error);
      return null;
    }
  },
  
  set: async (key: string, value: any, options?: { ex?: number }): Promise<void> => {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (options?.ex) {
        await redis.set(key, serializedValue, 'EX', options.ex);
      } else {
        await redis.set(key, serializedValue);
      }
    } catch (error) {
      console.error(`[kv.set] Error setting key ${key}:`, error);
    }
  },
  
  del: async (key: string): Promise<void> => {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`[kv.del] Error deleting key ${key}:`, error);
    }
  },
  
  keys: async (pattern: string): Promise<string[]> => {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error(`[kv.keys] Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  },
  
  // Add expire function for rate limiting
  expire: async (key: string, seconds: number): Promise<void> => {
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      console.error(`[kv.expire] Error setting expiry for key ${key}:`, error);
    }
  }
};