// No need to import hash operations - we'll implement them directly

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

  async sismember(key: string, member: string): Promise<number> {
    if (!this.store.has(key)) return 0;
    const set = this.store.get(key);
    return set.has(member) ? 1 : 0;
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

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    // Create a Map for the hash if it doesn't exist
    if (!this.store.has(key)) {
      this.store.set(key, new Map<string, string>());
    }

    const hash = this.store.get(key);
    const isNew = !hash.has(field);

    // Set the field-value pair
    hash.set(field, value);

    // Return 1 if field is new, 0 if field was updated
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    // Return null if hash doesn't exist
    if (!this.store.has(key)) {
      return null;
    }

    const hash = this.store.get(key);
    const value = hash.get(field);

    // Return null if field doesn't exist
    return value !== undefined ? value : null;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    // Return 0 if hash doesn't exist
    if (!this.store.has(key)) {
      return 0;
    }

    const hash = this.store.get(key);
    let deleted = 0;

    // Delete each field and count successful deletions
    for (const field of fields) {
      if (hash.delete(field)) {
        deleted++;
      }
    }

    // If hash is now empty, remove it
    if (hash.size === 0) {
      this.store.delete(key);
    }

    return deleted;
  }

  async hkeys(key: string): Promise<string[]> {
    // Return empty array if hash doesn't exist
    if (!this.store.has(key)) {
      return [];
    }

    const hash = this.store.get(key);

    // Return all field names
    return Array.from(hash.keys());
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    // Return null if hash doesn't exist
    if (!this.store.has(key)) {
      return null;
    }

    const hash = this.store.get(key);
    const result: Record<string, string> = {};

    // Convert Map to plain object
    for (const [field, value] of hash.entries()) {
      result[field] = value;
    }

    return result;
  }

  async hmset(key: string, ...fieldValues: string[]): Promise<'OK'> {
    // Create a Map for the hash if it doesn't exist
    if (!this.store.has(key)) {
      this.store.set(key, new Map<string, string>());
    }

    const hash = this.store.get(key);

    // Process field-value pairs
    for (let i = 0; i < fieldValues.length; i += 2) {
      const field = fieldValues[i];
      const value = fieldValues[i + 1];

      if (field && value !== undefined) {
        hash.set(field, value);
      }
    }

    return 'OK';
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    // Create a Map for the hash if it doesn't exist
    if (!this.store.has(key)) {
      this.store.set(key, new Map<string, string>());
    }

    const hash = this.store.get(key);

    // Get current value or default to 0
    const currentValue = hash.has(field) ? parseInt(hash.get(field), 10) : 0;

    // Calculate new value
    const newValue = currentValue + increment;

    // Store new value
    hash.set(field, newValue.toString());

    return newValue;
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
      sismember: addCommand('sismember'),
      sinter: addCommand('sinter'),
      scard: addCommand('scard'),
      sismember: addCommand('sismember'),
      // Hash operations
      hset: addCommand('hset'),
      hget: addCommand('hget'),
      hdel: addCommand('hdel'),
      hkeys: addCommand('hkeys'),
      hgetall: addCommand('hgetall'),
      hmset: addCommand('hmset'),
      hincrby: addCommand('hincrby'),
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

// Create a singleton instance of the in-memory Redis client
const memoryRedis = new MemoryRedis();

// First check if we're in a proper Node.js environment
// Edge runtime or certain Next.js contexts might lack full Node.js APIs
const isNodeEnvironment = typeof process !== 'undefined'
                          && typeof process.version === 'string'
                          && typeof process.version.charCodeAt === 'function';

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Log environment detection
if (isBrowser) {
  console.log('Browser environment detected, using memory fallback');
}

// Only use real Redis if explicitly enabled and we're in a server context
const USE_MEMORY_FALLBACK = process.env.NODE_ENV === "test" ||
  (process.env.USE_MEMORY_FALLBACK === 'true');

// Declare global memory store for persistence across API routes
declare global {
  var inMemoryRedisStore: Map<string, any>;
  var redisClient: any;
}

// Setup Redis client (real or in-memory)
console.log('Setting up Redis client...');

// Use memory implementation for browser or testing
if (isBrowser || process.env.NODE_ENV === 'test') {
  console.log('Using memory fallback for Redis');
}

// Export the Redis client
export const redis = memoryRedis;
export const kv = memoryRedis;

// Export the Redis client class for testing
export { MemoryRedis };
