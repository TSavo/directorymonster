import { checkRedisConnection } from '@/lib/redis-health';

// Mock Redis with connection state tracking
jest.mock('../../src/lib/redis', () => {
  let mockConnected = true;
  let connectionState = 'connected';
  
  return {
    redis: {
      ping: jest.fn(async () => {
        if (!mockConnected) {
          throw new Error('Connection refused');
        }
        return 'PONG';
      })
    },
    isRedisConnected: jest.fn(async () => mockConnected),
    getRedisConnectionState: jest.fn(() => connectionState),
    __setMockConnected: (connected) => {
      mockConnected = connected;
    },
    __setConnectionState: (state) => {
      connectionState = state;
    }
  };
});

describe('Redis Health Check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state
    const redis = require('../../src/lib/redis');
    redis.__setMockConnected(true);
    redis.__setConnectionState('connected');
  });

  test('should report healthy status when Redis is connected', async () => {
    const status = await checkRedisConnection();
    
    expect(status).toEqual({
      status: 'ok',
      message: 'Redis connection is healthy',
      connectionState: 'connected',
      timestamp: expect.any(Number)
    });
  });

  test('should report error status when Redis is disconnected', async () => {
    const redis = require('../../src/lib/redis');
    redis.__setMockConnected(false);
    redis.__setConnectionState('disconnected');
    
    const status = await checkRedisConnection();
    
    expect(status).toEqual({
      status: 'error',
      message: 'Redis connection failed',
      connectionState: 'disconnected',
      timestamp: expect.any(Number)
    });
  });

  test('should handle exceptions during health check', async () => {
    const redis = require('../../src/lib/redis');
    
    // Make isRedisConnected throw an error
    redis.isRedisConnected.mockImplementationOnce(() => {
      throw new Error('Unexpected error');
    });
    redis.__setConnectionState('reconnecting');
    
    const status = await checkRedisConnection();
    
    expect(status).toEqual({
      status: 'error',
      message: 'Unexpected error',
      connectionState: 'reconnecting',
      timestamp: expect.any(Number)
    });
  });

  test('should include current connection state in response', async () => {
    const redis = require('../../src/lib/redis');
    redis.__setConnectionState('failed');
    
    const status = await checkRedisConnection();
    
    expect(status.connectionState).toBe('failed');
  });

  test('should have timestamp in response', async () => {
    const now = Date.now();
    const status = await checkRedisConnection();
    
    // Timestamp should be from around the current time
    expect(status.timestamp).toBeGreaterThanOrEqual(now - 1000);
    expect(status.timestamp).toBeLessThanOrEqual(now + 1000);
  });
});
