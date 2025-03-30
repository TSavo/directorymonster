import { 
  redis, 
  kv, 
  isRedisConnected, 
  forceRedisReconnect, 
  getRedisConnectionState 
} from '../src/lib/redis';
import { MemoryRedis } from '../src/lib/redis/memory-store';

// Mock EventEmitter for tests
jest.mock('events', () => {
  return {
    EventEmitter: class MockEventEmitter {
      on = jest.fn();
      emit = jest.fn();
    }
  };
});

describe('Redis Connection Fallback', () => {
  beforeEach(() => {
    // Clear mock calls
    jest.clearAllMocks();
  });

  test('Should use memory implementation when Redis unavailable', async () => {
    // Verify the client is using MemoryRedis
    expect(redis instanceof MemoryRedis).toBeTruthy();
    
    // Verify connection state
    expect(getRedisConnectionState()).toBe('connected');
    
    // Test basic operations
    await kv.set('test-key', 'test-value');
    const value = await kv.get('test-key');
    expect(value).toBe('test-value');
    
    // Verify connection check
    const connected = await isRedisConnected();
    expect(connected).toBeTruthy();
  });
  
  test('Key-value operations should work with memory implementation', async () => {
    // Set a value
    await kv.set('test-key-2', { foo: 'bar' });
    
    // Get the value back
    const value = await kv.get('test-key-2');
    expect(value).toEqual({ foo: 'bar' });
    
    // List keys
    const keys = await kv.keys('test*');
    expect(keys.includes('test-key-2')).toBeTruthy();
    
    // Delete key
    await kv.del('test-key-2');
    const deletedValue = await kv.get('test-key-2');
    expect(deletedValue).toBeNull();
  });
  
  test('Should handle expiration in memory implementation', async () => {
    // Set a value with expiration
    await kv.set('expiring-key', 'expiring-value', { ex: 1 });
    
    // Should be available immediately
    const value = await kv.get('expiring-key');
    expect(value).toBe('expiring-value');
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should be gone after expiration
    const expiredValue = await kv.get('expiring-key');
    expect(expiredValue).toBeNull();
  });
  
  test('Should not throw when reconnection is forced', async () => {
    // This shouldn't throw even though we're using memory implementation
    expect(() => {
      forceRedisReconnect();
    }).not.toThrow();
  });
});
