/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { mockNextResponseJson } from '@/tests/mocks/next/response';
import { withRedis } from '../../src/middleware/withRedis';
import { redis } from '@/tests/mocks/lib/redis-client';

// Use standardized Redis mock
jest.mock('../../src/lib/redis-client', () => {
  return require('@/tests/mocks/lib/redis-client');
});

describe('withRedis Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call the handler when Redis is connected', async () => {
    // Mock successful ping
    (redis.ping as jest.Mock).mockResolvedValue('PONG');
    
    // Create a mock handler
    const mockHandler = jest.fn().mockResolvedValue(
      mockNextResponseJson({ success: true })
    );
    
    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Apply the middleware
    const wrappedHandler = withRedis(mockHandler);
    const response = await wrappedHandler(request, { params: { test: 'value' } });
    
    // Verify that Redis was pinged
    expect(redis.ping).toHaveBeenCalledTimes(1);
    
    // Verify that the handler was called with the correct arguments
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(request, { params: { test: 'value' } });
    
    // Verify the response
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });

  it('should return a 503 error when Redis is not connected', async () => {
    // Mock failed ping
    (redis.ping as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
    
    // Create a mock handler that should not be called
    const mockHandler = jest.fn().mockResolvedValue(
      mockNextResponseJson({ success: true })
    );
    
    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Apply the middleware
    const wrappedHandler = withRedis(mockHandler);
    const response = await wrappedHandler(request, { params: { test: 'value' } });
    
    // Verify that Redis was pinged
    expect(redis.ping).toHaveBeenCalledTimes(1);
    
    // Verify that the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Verify the response
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Database connection error',
      message: 'The service is temporarily unavailable. Please try again later.',
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Redis connection error:',
      expect.any(Error)
    );
  });

  it('should include appropriate headers for service unavailable response', async () => {
    // Mock failed ping
    (redis.ping as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
    
    // Create a mock handler
    const mockHandler = jest.fn();
    
    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Apply the middleware
    const wrappedHandler = withRedis(mockHandler);
    const response = await wrappedHandler(request);
    
    // Verify the headers
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(response.headers.get('Cache-Control')).toBe(
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
  });

  it('should propagate errors from the handler', async () => {
    // Mock successful ping
    (redis.ping as jest.Mock).mockResolvedValue('PONG');
    
    // Create a mock handler that throws an error
    const handlerError = new Error('Handler error');
    const mockHandler = jest.fn().mockRejectedValue(handlerError);
    
    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Apply the middleware
    const wrappedHandler = withRedis(mockHandler);
    
    // Expect the handler error to be propagated
    await expect(wrappedHandler(request)).rejects.toThrow(handlerError);
    
    // Verify that Redis was pinged
    expect(redis.ping).toHaveBeenCalledTimes(1);
    
    // Verify that the handler was called
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle different types of handlers and arguments', async () => {
    // Mock successful ping
    (redis.ping as jest.Mock).mockResolvedValue('PONG');
    
    // Create a mock handler that uses multiple arguments
    const mockHandler = jest.fn((...args) => {
      // Return the number of arguments
      return mockNextResponseJson({ argCount: args.length });
    });
    
    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Apply the middleware
    const wrappedHandler = withRedis(mockHandler);
    
    // Call with multiple arguments
    const response = await wrappedHandler(
      request,
      { params: { id: '123' } },
      'extra1',
      'extra2'
    );
    
    // Verify the response
    const data = await response.json();
    expect(data).toEqual({ argCount: 4 }); // request, params, and 2 extra args
    
    // Verify that Redis was pinged
    expect(redis.ping).toHaveBeenCalledTimes(1);
    
    // Verify that the handler was called with all arguments
    expect(mockHandler).toHaveBeenCalledWith(
      request,
      { params: { id: '123' } },
      'extra1',
      'extra2'
    );
  });
});
