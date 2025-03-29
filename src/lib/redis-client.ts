// Dynamically import Redis to avoid 'dns' module issues in browser
let Redis: any = null;

// Only import Redis in server context
if (typeof window === 'undefined') {
  // This import style is compatible with Next.js and doesn't break browser builds
  const ioredis = require('ioredis');
  Redis = ioredis.Redis;
}

// Enable in-memory fallback for development without Redis
const USE_MEMORY_FALLBACK = true;

// Declare global memory store for persistence across API routes
declare global {
  var inMemoryRedisStore: Map<string, any>;
  var redisClient: any;
}

// Initialize global memory store if needed
if (!global.inMemoryRedisStore) {
  global.inMemoryRedisStore = new Map<string, any>();
  console.log('Created global in-memory Redis store');
}

// In-memory Redis implementation
class MemoryRedis {
  store: Map<string, any>;
  
  constructor() {
    this.store = global.inMemoryRedisStore;
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
    const wildcard = pattern.includes('*');
    const prefix = pattern.replace('*', '');
    return Array.from(this.store.keys()).filter(k => 
      wildcard ? k.startsWith(prefix) : k === pattern
    );
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

// Setup Redis client (real or in-memory)
console.log('Setting up Redis client...');
let redis;

if (USE_MEMORY_FALLBACK || typeof window !== 'undefined') {
  // Use singleton pattern for memory redis
  if (!global.redisClient) {
    global.redisClient = new MemoryRedis();
  }
  redis = global.redisClient;
} else {
  // Create Redis client with retry options
  const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
  console.log(`Connecting to Redis at ${redisUrl}`);
  
  try {
    if (!global.redisClient && Redis) {
      global.redisClient = new Redis(redisUrl, {
        retryStrategy: (times) => {
          console.log(`Redis connection attempt ${times}`);
          if (times > 3) {
            console.log('Max Redis connection attempts reached, using memory fallback');
            global.redisClient = new MemoryRedis();
            return null; // Stop retrying
          }
          return Math.min(times * 100, 30000);
        },
      });
    } else if (!Redis) {
      // Fallback to memory Redis if Redis class is not available
      global.redisClient = new MemoryRedis();
    }
    redis = global.redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    redis = new MemoryRedis();
  }
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
    
    if (userKeys.length > 0) {
      // Delete each user key
      await redis.del(...userKeys);
      console.log(`Cleared ${userKeys.length} users from the database`);
    } else {
      console.log('No users found to clear');
    }
  } catch (error) {
    console.error('Error clearing users:', error);
  }
};

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
  
  // Add expire function for rate limiting
  expire: async (key: string, seconds: number): Promise<void> => {
    if (redis instanceof MemoryRedis) {
      // For in-memory implementation, we don't have a real expire
      // We could implement a setTimeout to delete the key after the specified time
      // but for now, we'll just make it a no-op for simplicity
      console.log(`[Memory Redis] Set expiry on ${key} for ${seconds} seconds`);
      return;
    } else {
      // For real Redis, call the expire command
      await redis.expire(key, seconds);
    }
  }
};