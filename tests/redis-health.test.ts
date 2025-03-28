/**
 * @jest-environment node
 */
import { checkRedisConnection } from '../src/lib/redis-health';
import { redis } from '../src/lib/redis-client';

// Mock the redis client
jest.mock('../src/lib/redis-client', () => ({
  redis: {
    ping: jest.fn()
  }
}));

describe('Redis Health Checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the Date.now implementation
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  it('should return ok status when Redis connection is healthy', async () => {
    // Mock successful ping
    (redis.ping as jest.Mock).mockResolvedValue('PONG');
    
    const result = await checkRedisConnection();
    
    expect(result).toEqual({
      status: 'ok',
      message: 'Redis connection is healthy',
      timestamp: 1000
    });
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('should return error status when Redis returns unexpected response', async () => {
    // Mock unexpected ping response
    (redis.ping as jest.Mock).mockResolvedValue('UNEXPECTED');
    
    const result = await checkRedisConnection();
    
    expect(result).toEqual({
      status: 'error',
      message: 'Redis returned unexpected response',
      timestamp: 1000
    });
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('should return error status when Redis connection fails', async () => {
    // Mock ping failure
    (redis.ping as jest.Mock).mockRejectedValue(new Error('Connection refused'));
    
    const result = await checkRedisConnection();
    
    expect(result).toEqual({
      status: 'error',
      message: 'Connection refused',
      timestamp: 1000
    });
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error exceptions', async () => {
    // Mock ping throwing a string instead of an Error
    (redis.ping as jest.Mock).mockRejectedValue('String error');
    
    const result = await checkRedisConnection();
    
    expect(result).toEqual({
      status: 'error',
      message: 'Unknown Redis connection error',
      timestamp: 1000
    });
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });
});
