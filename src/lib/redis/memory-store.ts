/**
 * In-memory implementation of Redis for fallback
 */

// Initialize global memory store if needed
declare global {
  var inMemoryRedisStore: Map<string, any>;
}

if (typeof global !== 'undefined' && !global.inMemoryRedisStore) {
  global.inMemoryRedisStore = new Map<string, any>();
  console.log('[Redis] Created global in-memory Redis store');
}

export class MemoryRedis {
  store: Map<string, any>;

  constructor() {
    this.store = global.inMemoryRedisStore;
    console.log(`[MemoryRedis] Using in-memory store with ${this.store.size} keys`);
  }

  // Connection status methods
  async isConnected(): Promise<boolean> {
    return true; // Memory implementation is always "connected"
  }

  // Basic Redis operations
  async get(key: string): Promise<any> {
    return this.store.get(key);
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.store.set(key, value);
    this.expire(key, seconds);
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
      zadd: addCommand('zadd'),
      zrange: addCommand('zrange'),
      zrevrange: addCommand('zrevrange'),
      zcount: addCommand('zcount'),
      scan: addCommand('scan'),
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
      }
    }, seconds * 1000);

    return 1;
  }

  // Utility
  async ping(): Promise<string> {
    return 'PONG';
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

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.store.has(key)) return [];
    const zset = this.store.get(key);
    const entries = Array.from(zset.entries());
    entries.sort((a, b) => b[1] - a[1]); // Sort by score in reverse
    const members = entries.map(entry => entry[0]);
    return members.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async zcount(key: string, min: string, max: string): Promise<number> {
    if (!this.store.has(key)) return 0;
    const zset = this.store.get(key);
    const minScore = min === '-inf' ? Number.NEGATIVE_INFINITY : parseFloat(min);
    const maxScore = max === '+inf' ? Number.POSITIVE_INFINITY : parseFloat(max);

    let count = 0;
    for (const score of zset.values()) {
      if (score >= minScore && score <= maxScore) {
        count++;
      }
    }

    return count;
  }

  async scan(cursor: string, ...args: any[]): Promise<[string, string[]]> {
    // Parse args
    const match = args.indexOf('MATCH') >= 0 ? args[args.indexOf('MATCH') + 1] : '*';
    const count = args.indexOf('COUNT') >= 0 ? parseInt(args[args.indexOf('COUNT') + 1]) : 10;

    // Get all keys matching the pattern
    const allKeys = await this.keys(match);

    // Simple implementation: return all keys at once
    return ['0', allKeys];
  }
}
