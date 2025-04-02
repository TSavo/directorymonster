/**
 * Integration test for Redis hash operations
 * 
 * This test verifies that the hash operations are available in the Redis client
 * and work correctly in a real application.
 */
import { redis } from '@/lib/redis-client';

describe('Redis Hash Operations Integration', () => {
  beforeEach(() => {
    // Clear the in-memory Redis store
    if (global.inMemoryRedisStore) {
      global.inMemoryRedisStore.clear();
    }
  });

  it('should set and get hash fields', async () => {
    // Set a hash field
    await redis.hset('user:1', 'name', 'John');
    
    // Get the hash field
    const name = await redis.hget('user:1', 'name');
    
    expect(name).toBe('John');
  });

  it('should delete hash fields', async () => {
    // Set hash fields
    await redis.hset('user:1', 'name', 'John');
    await redis.hset('user:1', 'email', 'john@example.com');
    
    // Delete a hash field
    const deleted = await redis.hdel('user:1', 'name');
    
    expect(deleted).toBe(1);
    
    // Verify the field was deleted
    const name = await redis.hget('user:1', 'name');
    expect(name).toBeNull();
    
    // Verify other fields still exist
    const email = await redis.hget('user:1', 'email');
    expect(email).toBe('john@example.com');
  });

  it('should get all hash keys', async () => {
    // Set hash fields
    await redis.hset('user:1', 'name', 'John');
    await redis.hset('user:1', 'email', 'john@example.com');
    await redis.hset('user:1', 'age', '30');
    
    // Get all hash keys
    const keys = await redis.hkeys('user:1');
    
    expect(keys).toHaveLength(3);
    expect(keys).toContain('name');
    expect(keys).toContain('email');
    expect(keys).toContain('age');
  });

  it('should get all hash fields and values', async () => {
    // Set hash fields
    await redis.hset('user:1', 'name', 'John');
    await redis.hset('user:1', 'email', 'john@example.com');
    
    // Get all hash fields and values
    const hash = await redis.hgetall('user:1');
    
    expect(hash).toEqual({
      name: 'John',
      email: 'john@example.com'
    });
  });

  it('should set multiple hash fields at once', async () => {
    // Set multiple hash fields
    await redis.hmset('user:1', 'name', 'John', 'email', 'john@example.com', 'age', '30');
    
    // Get all hash fields and values
    const hash = await redis.hgetall('user:1');
    
    expect(hash).toEqual({
      name: 'John',
      email: 'john@example.com',
      age: '30'
    });
  });

  it('should increment hash field values', async () => {
    // Set initial value
    await redis.hset('user:1', 'visits', '10');
    
    // Increment the value
    const newValue = await redis.hincrby('user:1', 'visits', 5);
    
    expect(newValue).toBe(15);
    
    // Verify the value was incremented
    const visits = await redis.hget('user:1', 'visits');
    expect(visits).toBe('15');
  });
});
