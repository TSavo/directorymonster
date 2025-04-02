import { 
  redis, 
  kv, 
  isRedisConnected, 
  forceRedisReconnect, 
  getRedisConnectionState, 
  onRedisConnectionStateChange 
} from '@/lib/redis';
import { MemoryRedis } from '@/lib/redis/memory-store';
import { redisCache } from '@/lib/redis-cache';
import { checkRedisConnection } from '@/lib/redis-health';

describe('Redis Integration Tests', () => {
  test('redis client should be available', () => {
    expect(redis).toBeDefined();
    // In test environment, should be MemoryRedis
    expect(redis instanceof MemoryRedis).toBeTruthy();
  });

  test('key-value operations should work end-to-end', async () => {
    // Set a value
    await kv.set('integration-test-key', { value: 'test-value' });
    
    // Verify it was stored
    const retrieved = await kv.get('integration-test-key');
    expect(retrieved).toEqual({ value: 'test-value' });
    
    // Delete it
    await kv.del('integration-test-key');
    
    // Verify it's gone
    const afterDelete = await kv.get('integration-test-key');
    expect(afterDelete).toBeNull();
  });

  test('redis cache should work with the client', async () => {
    let fetchCount = 0;
    const fetchFn = async () => {
      fetchCount++;
      return { data: 'fetched-data' };
    };
    
    // First call should fetch
    const result1 = await redisCache.getOrSet('cache-test', fetchFn);
    expect(result1).toEqual({ data: 'fetched-data' });
    expect(fetchCount).toBe(1);
    
    // Second call should use cache
    const result2 = await redisCache.getOrSet('cache-test', fetchFn);
    expect(result2).toEqual({ data: 'fetched-data' });
    expect(fetchCount).toBe(1); // Still 1, didn't fetch again
    
    // After invalidation, should fetch again
    await redisCache.invalidate('cache-test');
    const result3 = await redisCache.getOrSet('cache-test', fetchFn);
    expect(result3).toEqual({ data: 'fetched-data' });
    expect(fetchCount).toBe(2);
  });

  test('health check should work with the client', async () => {
    const health = await checkRedisConnection();
    
    expect(health.status).toBe('ok');
    expect(health.connectionState).toBeDefined();
    expect(health.timestamp).toBeDefined();
  });

  test('connection management functions should be available', () => {
    expect(typeof isRedisConnected).toBe('function');
    expect(typeof forceRedisReconnect).toBe('function');
    expect(typeof getRedisConnectionState).toBe('function');
    expect(typeof onRedisConnectionStateChange).toBe('function');
  });

  test('should work with various data types', async () => {
    // String
    await kv.set('string-key', 'plain string');
    expect(await kv.get('string-key')).toBe('plain string');
    
    // Number (stored as JSON)
    await kv.set('number-key', 42);
    expect(await kv.get('number-key')).toBe(42);
    
    // Object
    const testObj = { 
      string: 'value',
      number: 123,
      boolean: true,
      nested: {
        array: [1, 2, 3]
      }
    };
    await kv.set('object-key', testObj);
    expect(await kv.get('object-key')).toEqual(testObj);
    
    // Array
    const testArray = ['a', 'b', 'c', { complex: true }];
    await kv.set('array-key', testArray);
    expect(await kv.get('array-key')).toEqual(testArray);
    
    // Clean up
    await kv.del('string-key');
    await kv.del('number-key');
    await kv.del('object-key');
    await kv.del('array-key');
  });

  test('should handle key expiration', async () => {
    jest.useFakeTimers();
    
    await kv.set('expiring-key', 'will-expire', { ex: 1 });
    
    // Still exists before expiration
    expect(await kv.get('expiring-key')).toBe('will-expire');
    
    // Advance time past expiration
    jest.advanceTimersByTime(1100);
    
    // Should be gone after expiration
    expect(await kv.get('expiring-key')).toBeNull();
    
    jest.useRealTimers();
  });
});
