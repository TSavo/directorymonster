/**
 * Mock implementation of Redis client for testing
 */

export class RedisMock {
  store: Map<string, any>;

  constructor() {
    this.store = new Map<string, any>();
    console.log('[RedisMock] Created mock Redis client');
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

  // Transaction support
  multi(): any {
    const commands: { cmd: string; args: any[] }[] = [];
    const self = this;

    const multi = {
      exec: async function(): Promise<Array<[Error | null, any]>> {
        const results: Array<[Error | null, any]> = [];
        
        for (const { cmd, args } of commands) {
          try {
            // Call the method on the Redis client instance
            if (typeof self[cmd] === 'function') {
              const result = await self[cmd](...args);
              results.push([null, result]);
            } else {
              // If the method doesn't exist, return an error
              throw new Error(`Method ${cmd} not implemented in RedisMock`);
            }
          } catch (error) {
            results.push([error as Error, null]);
          }
        }
        
        return results;
      },
      
      // Add methods to the multi object
      set: function(...args: any[]) {
        commands.push({ cmd: 'set', args });
        return this;
      },
      
      get: function(...args: any[]) {
        commands.push({ cmd: 'get', args });
        return this;
      },
      
      del: function(...args: any[]) {
        commands.push({ cmd: 'del', args });
        return this;
      },
      
      sadd: function(...args: any[]) {
        commands.push({ cmd: 'sadd', args });
        return this;
      },
      
      smembers: function(...args: any[]) {
        commands.push({ cmd: 'smembers', args });
        return this;
      },
      
      // Add other methods as needed
      hset: function(...args: any[]) {
        commands.push({ cmd: 'hset', args });
        return this;
      },
      
      hget: function(...args: any[]) {
        commands.push({ cmd: 'hget', args });
        return this;
      },
      
      hgetall: function(...args: any[]) {
        commands.push({ cmd: 'hgetall', args });
        return this;
      },
      
      zadd: function(...args: any[]) {
        commands.push({ cmd: 'zadd', args });
        return this;
      },
      
      zrange: function(...args: any[]) {
        commands.push({ cmd: 'zrange', args });
        return this;
      }
    };
    
    return multi;
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.store.has(key)) {
      this.store.set(key, new Map<string, string>());
    }
    const hash = this.store.get(key);
    const isNew = !hash.has(field);
    hash.set(field, value);
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.store.has(key)) return null;
    const hash = this.store.get(key);
    return hash.get(field) || null;
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    if (!this.store.has(key)) return null;
    const hash = this.store.get(key);
    const result: Record<string, string> = {};
    for (const [field, value] of hash.entries()) {
      result[field] = value;
    }
    return result;
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.store.has(key)) {
      this.store.set(key, new Map());
    }
    const zset = this.store.get(key);
    const isNew = !zset.has(member);
    zset.set(member, score);
    return isNew ? 1 : 0;
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.store.has(key)) return [];
    const zset = this.store.get(key);
    const entries = Array.from(zset.entries());
    entries.sort((a, b) => a[1] - b[1]); // Sort by score
    const members = entries.map(entry => entry[0]);
    return members.slice(start, stop === -1 ? undefined : stop + 1);
  }

  // Utility
  async ping(): Promise<string> {
    return 'PONG';
  }
}

// Create a mock Redis client
export const createMockRedisClient = () => {
  return new RedisMock();
};

export default RedisMock;
