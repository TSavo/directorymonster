import { redisCache } from '../../src/lib/redis-cache';

// Mock Redis client
jest.mock('../../src/lib/redis', () => {
  // Create mock storage
  const storage = new Map<string, string>();
  
  return {
    redis: {
      get: jest.fn(async (key) => storage.get(key)),
      setex: jest.fn(async (key, ttl, value) => {
        storage.set(key, value);
        return 'OK';
      }),
      del: jest.fn(async (...keys) => {
        let count = 0;
        for (const key of keys) {
          if (storage.delete(key)) count++;
        }
        return count;
      }),
      keys: jest.fn(async (pattern) => {
        if (pattern === 'cache:*') {
          return Array.from(storage.keys()).filter(k => k.startsWith('cache:'));
        }
        return [];
      }),
    },
    __storage: storage,
    __reset: () => {
      storage.clear();
    }
  };
});

describe('Redis Cache', () => {
  beforeEach(() => {
    // Reset mock storage
    jest.clearAllMocks();
    require('../../src/lib/redis').__reset();
  });

  test('getOrSet should fetch and store data when cache miss', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'test-data' });
    const { redis } = require('../../src/lib/redis');
    
    const result = await redisCache.getOrSet('test-key', mockFetch);
    
    expect(result).toEqual({ data: 'test-data' });
    expect(mockFetch).toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalledWith('cache:test-key');
    expect(redis.setex).toHaveBeenCalledWith(
      'cache:test-key',
      300, // Default TTL
      JSON.stringify({ data: 'test-data' })
    );
  });

  test('getOrSet should use custom TTL when provided', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'test-data' });
    const { redis } = require('../../src/lib/redis');
    
    await redisCache.getOrSet('test-key', mockFetch, { ttl: 60 });
    
    expect(redis.setex).toHaveBeenCalledWith(
      'cache:test-key',
      60, // Custom TTL
      expect.any(String)
    );
  });

  test('getOrSet should return cached data on cache hit', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'new-data' });
    const { redis, __storage } = require('../../src/lib/redis');
    
    // Prime the cache
    __storage.set('cache:test-key', JSON.stringify({ data: 'cached-data' }));
    
    const result = await redisCache.getOrSet('test-key', mockFetch);
    
    expect(result).toEqual({ data: 'cached-data' });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalledWith('cache:test-key');
    expect(redis.setex).not.toHaveBeenCalled();
  });

  test('getOrSet should handle JSON parse errors', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'fresh-data' });
    const { redis, __storage } = require('../../src/lib/redis');
    
    // Set invalid JSON in cache
    __storage.set('cache:test-key', '{invalid-json');
    
    const result = await redisCache.getOrSet('test-key', mockFetch);
    
    expect(result).toEqual({ data: 'fresh-data' });
    expect(mockFetch).toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalledWith('cache:test-key');
    expect(redis.setex).toHaveBeenCalled();
  });

  test('invalidate should delete cache entry', async () => {
    const { redis } = require('../../src/lib/redis');
    
    await redisCache.invalidate('test-key');
    
    expect(redis.del).toHaveBeenCalledWith('cache:test-key');
  });

  test('clear should remove all cache entries', async () => {
    const { redis, __storage } = require('../../src/lib/redis');
    
    // Add some cache entries
    __storage.set('cache:key1', 'value1');
    __storage.set('cache:key2', 'value2');
    __storage.set('other:key', 'value3');
    
    // Mock keys return
    redis.keys.mockResolvedValueOnce(['cache:key1', 'cache:key2']);
    
    await redisCache.clear();
    
    expect(redis.keys).toHaveBeenCalledWith('cache:*');
    expect(redis.del).toHaveBeenCalledWith('cache:key1', 'cache:key2');
  });

  test('clear should not call del if no cache keys found', async () => {
    const { redis } = require('../../src/lib/redis');
    
    // Mock empty keys return
    redis.keys.mockResolvedValueOnce([]);
    
    await redisCache.clear();
    
    expect(redis.keys).toHaveBeenCalledWith('cache:*');
    expect(redis.del).not.toHaveBeenCalled();
  });
});
