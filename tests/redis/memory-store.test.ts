import { MemoryRedis } from '@/lib/redis/memory-store';

describe('MemoryRedis Implementation', () => {
  let memoryRedis: MemoryRedis;

  beforeEach(() => {
    // Clear global store before each test
    if (global.inMemoryRedisStore) {
      global.inMemoryRedisStore.clear();
    }
    memoryRedis = new MemoryRedis();
  });

  test('should create a new instance with empty store', () => {
    expect(memoryRedis).toBeInstanceOf(MemoryRedis);
    expect(memoryRedis.store.size).toBe(0);
  });

  test('should always report as connected', async () => {
    const isConnected = await memoryRedis.isConnected();
    expect(isConnected).toBe(true);
  });

  test('should store and retrieve string values', async () => {
    await memoryRedis.set('test-key', 'test-value');
    const value = await memoryRedis.get('test-key');
    expect(value).toBe('test-value');
  });

  test('should delete keys', async () => {
    await memoryRedis.set('test-key', 'test-value');
    const initialValue = await memoryRedis.get('test-key');
    expect(initialValue).toBe('test-value');

    await memoryRedis.del('test-key');
    const afterDelete = await memoryRedis.get('test-key');
    expect(afterDelete).toBeUndefined();
  });

  test('should handle pattern-based key lookups', async () => {
    await memoryRedis.set('prefix:key1', 'value1');
    await memoryRedis.set('prefix:key2', 'value2');
    await memoryRedis.set('other:key', 'value3');

    const keys = await memoryRedis.keys('prefix:*');
    expect(keys).toHaveLength(2);
    expect(keys).toContain('prefix:key1');
    expect(keys).toContain('prefix:key2');
    expect(keys).not.toContain('other:key');
  });

  test('should support set operations', async () => {
    // Test sadd
    await memoryRedis.sadd('test-set', 'item1', 'item2');
    await memoryRedis.sadd('test-set', 'item3');

    // Test smembers
    const members = await memoryRedis.smembers('test-set');
    expect(members).toHaveLength(3);
    expect(members).toContain('item1');
    expect(members).toContain('item2');
    expect(members).toContain('item3');

    // Test srem
    await memoryRedis.srem('test-set', 'item2');
    const afterRemove = await memoryRedis.smembers('test-set');
    expect(afterRemove).toHaveLength(2);
    expect(afterRemove).toContain('item1');
    expect(afterRemove).toContain('item3');
    expect(afterRemove).not.toContain('item2');
  });

  test('should support sismember operation', async () => {
    // Add items to a set
    await memoryRedis.sadd('test-set', 'member1', 'member2');

    // Test for existing members
    const isMember1 = await memoryRedis.sismember('test-set', 'member1');
    expect(isMember1).toBe(1); // Redis returns 1 for true

    const isMember2 = await memoryRedis.sismember('test-set', 'member2');
    expect(isMember2).toBe(1);

    // Test for non-existing member
    const isNonMember = await memoryRedis.sismember('test-set', 'nonexistent');
    expect(isNonMember).toBe(0); // Redis returns 0 for false

    // Test for non-existing set
    const nonExistingSet = await memoryRedis.sismember('nonexistent-set', 'member');
    expect(nonExistingSet).toBe(0);
  });

  test('should support set intersection', async () => {
    await memoryRedis.sadd('set1', 'common', 'set1-only');
    await memoryRedis.sadd('set2', 'common', 'set2-only');

    const intersection = await memoryRedis.sinter('set1', 'set2');
    expect(intersection).toHaveLength(1);
    expect(intersection).toContain('common');
  });

  test('should handle transactions with multi/exec', async () => {
    const multi = memoryRedis.multi();
    multi.set('multi-key1', 'value1');
    multi.set('multi-key2', 'value2');

    const results = await multi.exec();
    expect(results).toHaveLength(2);
    expect(results[0][0]).toBeNull(); // No error
    expect(results[0][1]).toBe('OK'); // Result of set
    expect(results[1][0]).toBeNull();
    expect(results[1][1]).toBe('OK');

    // Verify values were actually set
    const value1 = await memoryRedis.get('multi-key1');
    const value2 = await memoryRedis.get('multi-key2');
    expect(value1).toBe('value1');
    expect(value2).toBe('value2');
  });

  test('should expire keys after specified time', async () => {
    await memoryRedis.set('expiring-key', 'expiring-value');
    await memoryRedis.expire('expiring-key', 0.5); // 500ms

    // Key should exist initially
    const beforeExpire = await memoryRedis.get('expiring-key');
    expect(beforeExpire).toBe('expiring-value');

    // Wait for key to expire
    await new Promise(resolve => setTimeout(resolve, 600));

    // Key should be gone
    const afterExpire = await memoryRedis.get('expiring-key');
    expect(afterExpire).toBeUndefined();
  });

  test('should successfully respond to ping', async () => {
    const response = await memoryRedis.ping();
    expect(response).toBe('PONG');
  });

  test('should implement setex correctly', async () => {
    await memoryRedis.setex('setex-key', 0.5, 'setex-value');

    // Key should exist initially
    const beforeExpire = await memoryRedis.get('setex-key');
    expect(beforeExpire).toBe('setex-value');

    // Wait for key to expire
    await new Promise(resolve => setTimeout(resolve, 600));

    // Key should be gone
    const afterExpire = await memoryRedis.get('setex-key');
    expect(afterExpire).toBeUndefined();
  });
});
