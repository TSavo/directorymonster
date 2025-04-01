/**
 * @jest-environment node
 * 
 * Integration test for Redis middleware
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../src/middleware/withRedis';
import { redis } from '../../src/lib/redis-client';

// Mock the redis client properly as an ES module
jest.mock('../../src/lib/redis-client', () => ({
  __esModule: true,
  redis: {
    ping: jest.fn()
  }
}));

describe('withRedis Middleware Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow requests when Redis is connected', async () => {
    // Mock successful ping
    (redis.ping as jest.Mock).mockResolvedValue('PONG');
    
    // Create a simple handler that returns success
    const handler = async () => NextResponse.json({ success: true });
    
    // Create a request
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Apply the middleware
    const wrappedHandler = withRedis(handler);
    const response = await wrappedHandler(request);
    
    // Verify the response is successful
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
    
    // Should not have the Redis unavailable header
    expect(response.headers.get('x-redis-unavailable')).toBeNull();
  });

  it('should still proceed with the request when Redis is not connected but add a header', async () => {
    // Mock failed ping
    (redis.ping as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
    
    // Create a handler that returns success
    const handler = async () => NextResponse.json({ success: true });
    
    // Create a request
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Silence console warnings in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Apply the middleware
    const wrappedHandler = withRedis(handler);
    const response = await wrappedHandler(request);
    
    // Verify the response is still successful
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
    
    // But should have the Redis unavailable header
    expect(response.headers.get('x-redis-unavailable')).toBe('true');
  });

  it('should return a 503 error when an exception is thrown during execution', async () => {
    // Mock successful ping (connection works, but handler will throw)
    (redis.ping as jest.Mock).mockResolvedValue('PONG');
    
    // Create a handler that throws an error
    const handler = async () => { throw new Error('Unexpected handler error'); };
    
    // Create a request
    const request = new NextRequest('http://localhost:3000/api/test');
    
    // Silence console errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Apply the middleware
    const wrappedHandler = withRedis(handler);
    const response = await wrappedHandler(request);
    
    // Verify we get a 503 response for error cases
    expect(response.status).toBe(503);
    
    // Verify the headers for proper retry behavior
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate');
    
    // Verify the error response structure
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });
});
