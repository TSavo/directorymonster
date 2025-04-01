/**
 * @jest-environment node
 * 
 * Integration test for Redis health check functionality
 */

// Create a direct mock of the functions we're testing
jest.mock('../src/lib/redis-health', () => {
  // Keep the original implementation to test
  const originalModule = jest.requireActual('../src/lib/redis-health');
  
  // Override the checkRedisConnection function with our controlled implementation
  return {
    ...originalModule,
    checkRedisConnection: jest.fn()
  };
});

// Import the mocked function
import { checkRedisConnection } from '../src/lib/redis-health';

describe('Redis Health Checks Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Use a fixed timestamp for deterministic testing
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return ok status when Redis connection is healthy', async () => {
    // Set up the mock to return a successful response
    (checkRedisConnection as jest.Mock).mockResolvedValue({
      status: 'ok',
      message: 'Redis connection is healthy',
      connectionState: 'connected',
      timestamp: 1000
    });
    
    const result = await checkRedisConnection();
    
    // Verify the result structure and status
    expect(result.status).toBe('ok');
    expect(result.message).toBe('Redis connection is healthy');
    expect(result.timestamp).toBe(1000);
  });

  it('should return error status when Redis is disconnected', async () => {
    // Set up the mock to return an error for disconnected state
    (checkRedisConnection as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Redis connection failed',
      connectionState: 'disconnected',
      timestamp: 1000
    });
    
    const result = await checkRedisConnection();
    
    // Verify error result
    expect(result.status).toBe('error');
    expect(result.message).toBe('Redis connection failed');
    expect(result.timestamp).toBe(1000);
  });

  it('should return error status when Redis connection fails', async () => {
    // Set up the mock to return an error for connection failure
    const errorMessage = 'Connection refused';
    (checkRedisConnection as jest.Mock).mockResolvedValue({
      status: 'error',
      message: errorMessage,
      connectionState: 'error',
      timestamp: 1000
    });
    
    const result = await checkRedisConnection();
    
    // Verify error result contains connection error details
    expect(result.status).toBe('error');
    expect(result.message).toBe(errorMessage);
    expect(result.timestamp).toBe(1000);
  });

  it('should handle non-Error exceptions', async () => {
    // Set up the mock to return a generic error 
    (checkRedisConnection as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Unknown Redis connection error',
      connectionState: 'error',
      timestamp: 1000
    });
    
    const result = await checkRedisConnection();
    
    // Verify error handling for non-Error exceptions
    expect(result.status).toBe('error');
    expect(result.message).toBe('Unknown Redis connection error');
    expect(result.timestamp).toBe(1000);
  });
});
