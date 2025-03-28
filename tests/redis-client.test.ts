/**
 * @jest-environment node
 */
import { redis, kv } from '../src/lib/redis-client';

// Reset modules before testing to ensure clean state
beforeEach(() => {
  jest.resetModules();
});

describe('Redis Client', () => {
  // Clear the memory store before each test
  beforeEach(() => {
    if (global.inMemoryRedisStore) {
      global.inMemoryRedisStore.clear();
    }
  });

  describe('Memory Redis Implementation', () => {
    it('should create and use in-memory Redis store', () => {
      // Based on the implementation, we know this is using the in-memory fallback
      expect(redis).toBeDefined();
      expect(redis.store).toBeDefined();
      expect(redis.store instanceof Map).toBe(true);
    });

    it('should set and get values correctly', async () => {
      // Test basic set/get operations
      await redis.set('test-key', 'test-value');
      const value = await redis.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should delete keys correctly', async () => {
      // Test key deletion
      await redis.set('delete-test', 'test-value');
      expect(await redis.get('delete-test')).toBe('test-value');
      
      const deleteCount = await redis.del('delete-test');
      expect(deleteCount).toBe(1);
      expect(await redis.get('delete-test')).toBeUndefined();
    });

    it('should return 0 when deleting non-existent key', async () => {
      const deleteCount = await redis.del('non-existent-key');
      expect(deleteCount).toBe(0);
    });

    it('should handle multiple key deletion', async () => {
      await redis.set('key1', 'value1');
      await redis.set('key2', 'value2');
      await redis.set('key3', 'value3');
      
      const deleteCount = await redis.del('key1', 'key2', 'non-existent');
      expect(deleteCount).toBe(2);
      
      expect(await redis.get('key1')).toBeUndefined();
      expect(await redis.get('key2')).toBeUndefined();
      expect(await redis.get('key3')).toBe('value3');
    });

    it('should find keys with wildcard pattern', async () => {
      await redis.set('prefix:key1', 'value1');
      await redis.set('prefix:key2', 'value2');
      await redis.set('other:key3', 'value3');
      
      const keys = await redis.keys('prefix:*');
      expect(keys).toHaveLength(2);
      expect(keys.includes('prefix:key1')).toBe(true);
      expect(keys.includes('prefix:key2')).toBe(true);
      expect(keys.includes('other:key3')).toBe(false);
    });

    it('should find exact key without wildcard', async () => {
      await redis.set('exact-key', 'value');
      
      const keys = await redis.keys('exact-key');
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('exact-key');
    });

    it('should handle set operations correctly', async () => {
      // Test Set operations
      const addCount1 = await redis.sadd('test-set', 'value1', 'value2');
      expect(addCount1).toBe(2);
      
      const addCount2 = await redis.sadd('test-set', 'value2', 'value3');
      expect(addCount2).toBe(1); // Only one new item was added
      
      const members = await redis.smembers('test-set');
      expect(members).toHaveLength(3);
      expect(members.includes('value1')).toBe(true);
      expect(members.includes('value2')).toBe(true);
      expect(members.includes('value3')).toBe(true);
    });

    it('should handle set removal correctly', async () => {
      await redis.sadd('remove-set', 'value1', 'value2', 'value3');
      
      const removeCount = await redis.srem('remove-set', 'value1', 'non-existent');
      expect(removeCount).toBe(1);
      
      const members = await redis.smembers('remove-set');
      expect(members).toHaveLength(2);
      expect(members.includes('value1')).toBe(false);
      expect(members.includes('value2')).toBe(true);
      expect(members.includes('value3')).toBe(true);
    });

    it('should return empty array for non-existent set', async () => {
      const members = await redis.smembers('non-existent-set');
      expect(members).toEqual([]);
    });

    it('should handle set intersection correctly', async () => {
      await redis.sadd('set1', 'value1', 'value2', 'value3');
      await redis.sadd('set2', 'value2', 'value3', 'value4');
      await redis.sadd('set3', 'value3', 'value4', 'value5');
      
      const intersection = await redis.sinter('set1', 'set2', 'set3');
      expect(intersection).toHaveLength(1);
      expect(intersection[0]).toBe('value3');
    });

    it('should return empty array when intersecting with non-existent set', async () => {
      await redis.sadd('existing-set', 'value1', 'value2');
      
      const intersection = await redis.sinter('existing-set', 'non-existent-set');
      expect(intersection).toEqual([]);
    });

    it('should support basic transaction operations', async () => {
      const multi = redis.multi();
      multi.set('tx-key1', 'value1');
      multi.set('tx-key2', 'value2');
      multi.get('tx-key1');
      
      const results = await multi.exec();
      expect(results).toHaveLength(3);
      expect(results[0][1]).toBe('OK');
      expect(results[1][1]).toBe('OK');
      expect(results[2][1]).toBe('value1');
      
      // Verify keys were set
      expect(await redis.get('tx-key1')).toBe('value1');
      expect(await redis.get('tx-key2')).toBe('value2');
    });

    it('should handle errors in transactions', async () => {
      // Create an error condition by spying on get and making it throw
      const getSpy = jest.spyOn(redis, 'get');
      getSpy.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      
      const multi = redis.multi();
      multi.set('error-key', 'value');
      multi.get('error-key');
      multi.set('after-error', 'value');
      
      const results = await multi.exec();
      expect(results).toHaveLength(3);
      expect(results[0][0]).toBeNull();
      expect(results[1][0]).toBeInstanceOf(Error);
      expect(results[2][0]).toBeNull();
      
      // Restore original implementation
      getSpy.mockRestore();
    });

    it('should ping correctly', async () => {
      const pong = await redis.ping();
      expect(pong).toBe('PONG');
    });
  });

  describe('KV Interface', () => {
    it('should get and set JSON values', async () => {
      const testObject = { test: 'value', number: 123 };
      await kv.set('json-key', testObject);
      
      const retrieved = await kv.get('json-key');
      expect(retrieved).toEqual(testObject);
    });

    it('should get and set string values', async () => {
      await kv.set('string-key', 'plain-string');
      
      const retrieved = await kv.get('string-key');
      expect(retrieved).toBe('plain-string');
    });

    it('should return null for non-existent keys', async () => {
      const value = await kv.get('non-existent-key');
      expect(value).toBeNull();
    });

    it('should handle key deletion', async () => {
      await kv.set('delete-me', 'value');
      expect(await kv.get('delete-me')).not.toBeNull();
      
      await kv.del('delete-me');
      expect(await kv.get('delete-me')).toBeNull();
    });

    it('should find keys by pattern', async () => {
      await kv.set('pattern:one', 'value1');
      await kv.set('pattern:two', 'value2');
      await kv.set('other:key', 'value3');
      
      const keys = await kv.keys('pattern:*');
      expect(keys).toHaveLength(2);
      expect(keys.includes('pattern:one')).toBe(true);
      expect(keys.includes('pattern:two')).toBe(true);
    });

    it('should handle expiration (not fully testable with in-memory implementation)', async () => {
      // This test is more of a smoke test for the API, since we can't
      // actually test expiration with the in-memory implementation
      await kv.set('expire-key', 'value', { ex: 60 });
      
      // Verify the key was set
      const value = await kv.get('expire-key');
      expect(value).toBe('value');
      
      // The actual expiration can't be tested without timer mocks
    });
  });
});
