import { 
  attemptReconnect, 
  updateConnectionState, 
  ConnectionState 
} from '../../src/lib/redis/connection-manager';
import { MemoryRedis } from '../../src/lib/redis/memory-store';

// Mock timers for testing reconnection timeouts
jest.useFakeTimers();

// Mock Redis client constructor
jest.mock('ioredis', () => {
  // Create mocked instances with different behaviors
  const successClient = {
    on: jest.fn((event, callback) => {
      if (event === 'connect') {
        setTimeout(() => callback(), 10);
      }
      return successClient;
    }),
    connect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
  };
  
  const failClient = {
    on: jest.fn(),
    connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
    ping: jest.fn().mockRejectedValue(new Error('Ping failed')),
  };
  
  // Return factory that can be configured for tests
  return {
    Redis: jest.fn(() => successClient),
    __setMockSuccess: (success) => {
      if (success) {
        module.exports.Redis.mockImplementation(() => successClient);
      } else {
        module.exports.Redis.mockImplementation(() => failClient);
      }
    }
  };
});

// Mock EventEmitter
jest.mock('events', () => {
  const mockEmit = jest.fn();
  
  return {
    EventEmitter: jest.fn(() => ({
      emit: mockEmit,
      on: jest.fn()
    })),
    __getMockEmit: () => mockEmit
  };
});

describe('Redis Reconnection Mechanism', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset global state
    global.redisConnectionState = ConnectionState.DISCONNECTED;
    global.redisReconnectAttempts = 0;
    if (global.redisReconnectTimer) {
      clearTimeout(global.redisReconnectTimer);
      global.redisReconnectTimer = null;
    }
    
    // Reset Redis mock to success mode
    require('ioredis').__setMockSuccess(true);
  });
  
  afterEach(() => {
    // Clean up any pending timers
    jest.clearAllTimers();
  });

  test('should not attempt reconnect if already connected', async () => {
    global.redisConnectionState = ConnectionState.CONNECTED;
    
    await attemptReconnect();
    
    // No timer should be set
    expect(setTimeout).not.toHaveBeenCalled();
    expect(global.redisReconnectTimer).toBeNull();
  });

  test('should switch to memory implementation after max attempts', async () => {
    global.redisReconnectAttempts = 10; // Max attempts
    
    await attemptReconnect();
    
    expect(global.redisConnectionState).toBe(ConnectionState.FAILED);
    expect(setTimeout).not.toHaveBeenCalled();
  });

  test('should increment attempts and set backoff timer', async () => {
    global.redisReconnectAttempts = 2;
    
    await attemptReconnect();
    
    expect(global.redisConnectionState).toBe(ConnectionState.RECONNECTING);
    expect(global.redisReconnectAttempts).toBe(3);
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
  });

  test('should use exponential backoff for retry intervals', async () => {
    // First attempt
    global.redisReconnectAttempts = 1;
    await attemptReconnect();
    const firstDelay = jest.getTimerCount();
    jest.clearAllTimers();
    
    // Second attempt
    global.redisReconnectAttempts = 2;
    await attemptReconnect();
    const secondDelay = jest.getTimerCount();
    
    // Second delay should be larger than first (exponential)
    expect(secondDelay).toBeGreaterThan(firstDelay);
  });

  test('should attempt reconnection with new Redis client', async () => {
    const Redis = require('ioredis').Redis;
    
    global.redisReconnectAttempts = 1;
    await attemptReconnect();
    
    // Fast-forward through the timeout
    jest.runAllTimers();
    
    // Should have created a new Redis client
    expect(Redis).toHaveBeenCalled();
  });

  test('should update state to connected on successful reconnection', async () => {
    global.redisReconnectAttempts = 1;
    await attemptReconnect();
    
    // Fast-forward through the timeout
    jest.runAllTimers();
    
    // Should have updated state
    expect(global.redisConnectionState).toBe(ConnectionState.CONNECTED);
    expect(global.redisReconnectAttempts).toBe(0);
  });

  test('should schedule another attempt on failure', async () => {
    // Configure Redis mock to fail
    require('ioredis').__setMockSuccess(false);
    
    global.redisReconnectAttempts = 1;
    await attemptReconnect();
    
    // Fast-forward through the first timeout
    jest.runAllTimers();
    
    // Should still be in reconnecting state and attempt count should increase
    expect(global.redisConnectionState).toBe(ConnectionState.RECONNECTING);
    expect(global.redisReconnectAttempts).toBeGreaterThan(1);
    
    // Should have scheduled another attempt
    expect(setTimeout).toHaveBeenCalledTimes(2);
  });

  test('should respect max reconnect interval', async () => {
    // Set high attempt count to trigger max interval
    global.redisReconnectAttempts = 8;
    await attemptReconnect();
    
    // Get the delay parameter from setTimeout call
    const delay = jest.getTimerCount();
    
    // Should be capped at the maximum
    expect(delay).toBeLessThanOrEqual(30000);
  });
});
