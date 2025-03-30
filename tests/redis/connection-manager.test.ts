import { 
  createRedisClient, 
  getRedisConnectionState, 
  updateConnectionState, 
  attemptReconnect,
  forceRedisReconnect,
  isRedisConnected,
  onRedisConnectionStateChange,
  ConnectionState
} from '../../src/lib/redis/connection-manager';
import { MemoryRedis } from '../../src/lib/redis/memory-store';

// Mock Redis client constructor
jest.mock('ioredis', () => {
  const mockRedisInstance = {
    on: jest.fn(),
    connect: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  };
  
  const mockRedisError = {
    on: jest.fn((event, callback) => {
      if (event === 'error') {
        // Simulate error immediately
        setTimeout(() => callback(new Error('Connection error')), 10);
      }
      return mockRedisError;
    }),
    connect: jest.fn().mockRejectedValue(new Error('Connect error')),
    ping: jest.fn().mockRejectedValue(new Error('Ping error')),
  };

  return {
    Redis: jest.fn(() => mockRedisInstance),
    // To test error scenarios we'll need to change the implementation
    __setMockImplementation: (shouldFail) => {
      if (shouldFail) {
        module.exports.Redis.mockImplementation(() => mockRedisError);
      } else {
        module.exports.Redis.mockImplementation(() => mockRedisInstance);
      }
    }
  };
});

// Mock EventEmitter
jest.mock('events', () => {
  const mockEmit = jest.fn();
  const mockOn = jest.fn();
  
  return {
    EventEmitter: jest.fn(() => ({
      emit: mockEmit,
      on: mockOn
    })),
    __getMockEmit: () => mockEmit,
    __getMockOn: () => mockOn
  };
});

describe('Redis Connection Manager', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset globals
    global.redisConnectionState = ConnectionState.DISCONNECTED;
    global.redisReconnectAttempts = 0;
    if (global.redisReconnectTimer) {
      clearTimeout(global.redisReconnectTimer);
      global.redisReconnectTimer = null;
    }
    
    // Reset Redis mock to success mode
    require('ioredis').__setMockImplementation(false);
  });

  test('should create a Redis client with proper setup', () => {
    const Redis = require('ioredis').Redis;
    const client = createRedisClient();
    
    expect(Redis).toHaveBeenCalled();
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  test('should use memory implementation when Redis unavailable', () => {
    // Make Redis construction fail
    require('ioredis').__setMockImplementation(true);
    
    const client = createRedisClient();
    expect(client).toBeInstanceOf(MemoryRedis);
  });

  test('should update connection state and emit events', () => {
    const mockEmit = require('events').__getMockEmit();
    
    // Test state transition
    updateConnectionState(ConnectionState.CONNECTING);
    expect(global.redisConnectionState).toBe(ConnectionState.CONNECTING);
    expect(mockEmit).toHaveBeenCalledWith('connecting');
    
    // Test another transition
    mockEmit.mockClear();
    updateConnectionState(ConnectionState.CONNECTED);
    expect(global.redisConnectionState).toBe(ConnectionState.CONNECTED);
    expect(mockEmit).toHaveBeenCalledWith('connected');
  });

  test('should not emit events if state unchanged', () => {
    const mockEmit = require('events').__getMockEmit();
    
    // Set initial state
    global.redisConnectionState = ConnectionState.CONNECTED;
    
    // Update to same state
    updateConnectionState(ConnectionState.CONNECTED);
    expect(mockEmit).not.toHaveBeenCalled();
  });

  test('should allow subscribing to connection events', () => {
    const mockOn = require('events').__getMockOn();
    const mockCallback = jest.fn();
    
    onRedisConnectionStateChange('connected', mockCallback);
    expect(mockOn).toHaveBeenCalledWith('connected', mockCallback);
  });

  test('should return current connection state', () => {
    global.redisConnectionState = ConnectionState.RECONNECTING;
    const state = getRedisConnectionState();
    expect(state).toBe(ConnectionState.RECONNECTING);
  });

  test('should perform connection status check', async () => {
    // Test with memory client
    global.redisClient = new MemoryRedis();
    let connected = await isRedisConnected();
    expect(connected).toBe(true);
    
    // Test with real client (mock)
    const mockRedisClient = {
      ping: jest.fn().mockResolvedValue('PONG')
    };
    global.redisClient = mockRedisClient;
    connected = await isRedisConnected();
    expect(connected).toBe(true);
    expect(mockRedisClient.ping).toHaveBeenCalled();
    
    // Test with failing client
    global.redisClient = {
      ping: jest.fn().mockRejectedValue(new Error('Connection error'))
    };
    connected = await isRedisConnected();
    expect(connected).toBe(false);
  });

  test('should force reconnection when requested', () => {
    // Mock implementation of attemptReconnect
    const originalAttemptReconnect = global.attemptReconnect;
    global.attemptReconnect = jest.fn();
    
    global.redisConnectionState = ConnectionState.CONNECTED;
    forceRedisReconnect();
    
    expect(global.redisConnectionState).toBe(ConnectionState.DISCONNECTED);
    expect(global.attemptReconnect).toHaveBeenCalled();
    
    // Restore original function
    global.attemptReconnect = originalAttemptReconnect;
  });

  test('should not reconnect when already reconnecting', () => {
    // Mock implementation of attemptReconnect
    const originalAttemptReconnect = global.attemptReconnect;
    global.attemptReconnect = jest.fn();
    
    global.redisConnectionState = ConnectionState.RECONNECTING;
    forceRedisReconnect();
    
    expect(global.attemptReconnect).not.toHaveBeenCalled();
    
    // Restore original function
    global.attemptReconnect = originalAttemptReconnect;
  });

  // We would need more sophisticated test setup for attemptReconnect
  // as it involves timers and complex retry logic
});
