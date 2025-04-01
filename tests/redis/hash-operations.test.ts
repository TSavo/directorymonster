/**
 * Tests for Redis hash operations
 * 
 * This test verifies that the hash operations (hset, hget, hdel, hkeys)
 * work correctly in the in-memory Redis implementation.
 */
import { MemoryRedis } from '../../src/lib/redis/memory-store';

// Import hash operations
import '../../src/lib/redis/hash-operations';

describe('Redis Hash Operations', () => {
  let memoryRedis: MemoryRedis;

  beforeEach(() => {
    // Clear global store before each test
    if (global.inMemoryRedisStore) {
      global.inMemoryRedisStore.clear();
    }
    memoryRedis = new MemoryRedis();
  });

  describe('hset', () => {
    it('should create a new hash and set a field', async () => {
      const result = await memoryRedis.hset('user:1', 'name', 'John');
      
      expect(result).toBe(1); // 1 for new field
      
      // Verify the hash was created with the field
      const hash = global.inMemoryRedisStore.get('user:1');
      expect(hash).toBeInstanceOf(Map);
      expect(hash.get('name')).toBe('John');
    });

    it('should update an existing field', async () => {
      // First set
      await memoryRedis.hset('user:1', 'name', 'John');
      
      // Update
      const result = await memoryRedis.hset('user:1', 'name', 'Jane');
      
      expect(result).toBe(0); // 0 for updated field
      
      // Verify the field was updated
      const hash = global.inMemoryRedisStore.get('user:1');
      expect(hash.get('name')).toBe('Jane');
    });
  });

  describe('hget', () => {
    it('should return null for non-existent hash', async () => {
      const result = await memoryRedis.hget('user:1', 'name');
      expect(result).toBeNull();
    });

    it('should return null for non-existent field', async () => {
      // Create hash with one field
      await memoryRedis.hset('user:1', 'name', 'John');
      
      // Try to get non-existent field
      const result = await memoryRedis.hget('user:1', 'email');
      expect(result).toBeNull();
    });

    it('should return the value for an existing field', async () => {
      // Create hash with field
      await memoryRedis.hset('user:1', 'name', 'John');
      
      // Get the field
      const result = await memoryRedis.hget('user:1', 'name');
      expect(result).toBe('John');
    });
  });

  describe('hdel', () => {
    it('should return 0 for non-existent hash', async () => {
      const result = await memoryRedis.hdel('user:1', 'name');
      expect(result).toBe(0);
    });

    it('should return 0 for non-existent field', async () => {
      // Create hash with one field
      await memoryRedis.hset('user:1', 'name', 'John');
      
      // Try to delete non-existent field
      const result = await memoryRedis.hdel('user:1', 'email');
      expect(result).toBe(0);
    });

    it('should delete an existing field and return 1', async () => {
      // Create hash with fields
      await memoryRedis.hset('user:1', 'name', 'John');
      await memoryRedis.hset('user:1', 'email', 'john@example.com');
      
      // Delete one field
      const result = await memoryRedis.hdel('user:1', 'name');
      
      expect(result).toBe(1);
      
      // Verify the field was deleted
      const hash = global.inMemoryRedisStore.get('user:1');
      expect(hash.has('name')).toBe(false);
      expect(hash.has('email')).toBe(true);
    });

    it('should delete multiple fields and return the count', async () => {
      // Create hash with fields
      await memoryRedis.hset('user:1', 'name', 'John');
      await memoryRedis.hset('user:1', 'email', 'john@example.com');
      await memoryRedis.hset('user:1', 'age', '30');
      
      // Delete multiple fields
      const result = await memoryRedis.hdel('user:1', 'name', 'email', 'nonexistent');
      
      expect(result).toBe(2); // Only 2 fields existed and were deleted
      
      // Verify the fields were deleted
      const hash = global.inMemoryRedisStore.get('user:1');
      expect(hash.has('name')).toBe(false);
      expect(hash.has('email')).toBe(false);
      expect(hash.has('age')).toBe(true);
    });

    it('should remove the hash if all fields are deleted', async () => {
      // Create hash with one field
      await memoryRedis.hset('user:1', 'name', 'John');
      
      // Delete the field
      await memoryRedis.hdel('user:1', 'name');
      
      // Verify the hash was removed
      expect(global.inMemoryRedisStore.has('user:1')).toBe(false);
    });
  });

  describe('hkeys', () => {
    it('should return empty array for non-existent hash', async () => {
      const result = await memoryRedis.hkeys('user:1');
      expect(result).toEqual([]);
    });

    it('should return all field names in a hash', async () => {
      // Create hash with fields
      await memoryRedis.hset('user:1', 'name', 'John');
      await memoryRedis.hset('user:1', 'email', 'john@example.com');
      await memoryRedis.hset('user:1', 'age', '30');
      
      // Get all keys
      const result = await memoryRedis.hkeys('user:1');
      
      // Verify all keys are returned (order not guaranteed)
      expect(result).toHaveLength(3);
      expect(result).toContain('name');
      expect(result).toContain('email');
      expect(result).toContain('age');
    });
  });

  describe('hgetall', () => {
    it('should return null for non-existent hash', async () => {
      const result = await memoryRedis.hgetall('user:1');
      expect(result).toBeNull();
    });

    it('should return all field-value pairs in a hash', async () => {
      // Create hash with fields
      await memoryRedis.hset('user:1', 'name', 'John');
      await memoryRedis.hset('user:1', 'email', 'john@example.com');
      
      // Get all field-value pairs
      const result = await memoryRedis.hgetall('user:1');
      
      // Verify all field-value pairs are returned
      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com'
      });
    });
  });

  describe('hmset', () => {
    it('should set multiple fields at once', async () => {
      // Set multiple fields
      const result = await memoryRedis.hmset(
        'user:1',
        'name', 'John',
        'email', 'john@example.com',
        'age', '30'
      );
      
      expect(result).toBe('OK');
      
      // Verify all fields were set
      const hash = global.inMemoryRedisStore.get('user:1');
      expect(hash.get('name')).toBe('John');
      expect(hash.get('email')).toBe('john@example.com');
      expect(hash.get('age')).toBe('30');
    });
  });

  describe('hincrby', () => {
    it('should increment a field by the specified amount', async () => {
      // Set initial value
      await memoryRedis.hset('user:1', 'visits', '10');
      
      // Increment
      const result = await memoryRedis.hincrby('user:1', 'visits', 5);
      
      expect(result).toBe(15);
      
      // Verify the field was incremented
      const hash = global.inMemoryRedisStore.get('user:1');
      expect(hash.get('visits')).toBe('15');
    });

    it('should create a field with the increment if it does not exist', async () => {
      // Increment non-existent field
      const result = await memoryRedis.hincrby('user:1', 'visits', 5);
      
      expect(result).toBe(5);
      
      // Verify the field was created
      const hash = global.inMemoryRedisStore.get('user:1');
      expect(hash.get('visits')).toBe('5');
    });
  });
});
