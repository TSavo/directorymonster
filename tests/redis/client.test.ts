import { 
  redis, 
  kv, 
  clearUsers,
  isRedisConnected,
  forceRedisReconnect,
  getRedisConnectionState
} from '@/lib/redis/client';
import { MemoryRedis } from '@/lib/redis/memory-store';

// Mock Redis global instance
jest.mock('../../src/lib/redis/connection-manager', () => {
  // Keep track of the memory store for inspection
  let memoryStore = new Map<string, any>();
  const memoryRedis = {
    get: jest.fn((key) => memoryStore.get(key)),
    set: jest.fn((key, value) => {
      memoryStore.set(key, value);
      return 'OK';
    }),
    setex: jest.fn((key, seconds, value) => {
      memoryStore.set(key, value);
      return 'OK';
    }),
    del: jest.fn((key) => {
      return memoryStore.delete(key) ? 1 : 0;
    }),
    keys: jest.fn((pattern) => {
      if (pattern === 'user:*') {
        return ['user:1', 'user:2'];
      }
      return [];
    }),
    expire: jest.fn(() => 1),
    ping: jest.fn(() => 'PONG'),
    store: memoryStore,
  };
  
  return {
    createRedisClient: jest.fn(() => memoryRedis),
    isRedisConnected: jest.fn(() => true),
    forceRedisReconnect: jest.fn(),
    getRedisConnectionState: jest.fn(() => 'connected'),
    onRedisConnectionStateChange: jest.fn(),
    ConnectionState: {
      DISCONNECTED: 'disconnected',
      CONNECTING: 'connecting',
      CONNECTED: 'connected',
      RECONNECTING: 'reconnecting',
      FAILED: 'failed'
    },
    __memoryStore: memoryStore,
    __resetStore: () => {
      memoryStore.clear();
    }
  };
});

describe('Redis Client', () => {
  beforeEach(() => {
    // Reset mocks and store
    jest.clearAllMocks();
    require('../../src/lib/redis/connection-manager').__resetStore();
  });

  test('should provide access to redis client', () => {
    expect(redis).toBeDefined();
  });

  test('kv.get should parse JSON values', async () => {
    const jsonObj = { test: 'value', num: 123 };
    redis.get.mockResolvedValueOnce(JSON.stringify(jsonObj));
    
    const result = await kv.get('json-key');
    expect(result).toEqual(jsonObj);
    expect(redis.get).toHaveBeenCalledWith('json-key');
  });

  test('kv.get should handle non-JSON values', async () => {
    redis.get.mockResolvedValueOnce('plain-string');
    
    const result = await kv.get('string-key');
    expect(result).toBe('plain-string');
  });

  test('kv.get should return null for missing keys', async () => {
    redis.get.mockResolvedValueOnce(null);
    
    const result = await kv.get('missing-key');
    expect(result).toBeNull();
  });

  test('kv.set should stringify objects', async () => {
    const obj = { foo: 'bar' };
    await kv.set('obj-key', obj);
    
    expect(redis.set).toHaveBeenCalledWith('obj-key', JSON.stringify(obj));
  });

  test('kv.set should handle strings directly', async () => {
    await kv.set('string-key', 'string-value');
    
    expect(redis.set).toHaveBeenCalledWith('string-key', 'string-value');
  });

  test('kv.set should use setex when expiration provided', async () => {
    await kv.set('exp-key', 'exp-value', { ex: 60 });
    
    expect(redis.setex).toHaveBeenCalledWith('exp-key', 60, 'exp-value');
  });

  test('kv.del should delete keys', async () => {
    await kv.del('del-key');
    
    expect(redis.del).toHaveBeenCalledWith('del-key');
  });

  test('kv.keys should list matching keys', async () => {
    redis.keys.mockResolvedValueOnce(['key1', 'key2']);
    
    const keys = await kv.keys('key*');
    expect(keys).toEqual(['key1', 'key2']);
    expect(redis.keys).toHaveBeenCalledWith('key*');
  });

  test('kv.expire should set key expiration', async () => {
    await kv.expire('exp-key', 30);
    
    expect(redis.expire).toHaveBeenCalledWith('exp-key', 30);
  });

  test('clearUsers should delete all user keys', async () => {
    await clearUsers();
    
    expect(redis.keys).toHaveBeenCalledWith('user:*');
    expect(redis.del).toHaveBeenCalledWith('user:1', 'user:2');
  });

  test('kv.isConnected should check connection status', async () => {
    const mockIsConnected = require('../../src/lib/redis/connection-manager').isRedisConnected;
    mockIsConnected.mockResolvedValueOnce(true);
    
    const connected = await kv.isConnected();
    expect(connected).toBe(true);
    expect(mockIsConnected).toHaveBeenCalled();
  });

  test('kv.reconnect should force reconnection', () => {
    const mockReconnect = require('../../src/lib/redis/connection-manager').forceRedisReconnect;
    
    kv.reconnect();
    expect(mockReconnect).toHaveBeenCalled();
  });

  test('kv.getConnectionState should return connection state', () => {
    const mockGetState = require('../../src/lib/redis/connection-manager').getRedisConnectionState;
    mockGetState.mockReturnValueOnce('reconnecting');
    
    const state = kv.getConnectionState();
    expect(state).toBe('reconnecting');
    expect(mockGetState).toHaveBeenCalled();
  });
});
