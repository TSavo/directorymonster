import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { kv } from '@/lib/redis-client';

// Mock Next.js modules
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');

  // Create a mock response with headers
  const mockResponse = {
    status: 200,
    headers: new Headers(),
    json: jest.fn()
  };

  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => {
        return {
          ...mockResponse,
          status: init?.status || 200,
          headers: new Headers(init?.headers),
          body: JSON.stringify(body)
        };
      })
    },
    NextRequest: jest.fn().mockImplementation(() => ({
      headers: new Headers(),
      url: 'http://localhost:3000/api/test'
    }))
  };
});

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    expire: jest.fn()
  }
}));

describe('Rate Limit Middleware', () => {
  let req: NextRequest;
  let mockResponse: NextResponse;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock request
    req = new NextRequest();

    // Create a mock response
    mockResponse = NextResponse.json({ success: true });
  });

  it('should return rate limit headers to be added to the response', async () => {
    // Mock Redis to return a count below the limit
    (kv.get as jest.Mock).mockResolvedValue(5);

    // Call the rate limit function
    const result = await rateLimit(req, 'test-user');

    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith('rate-limit:test-user');
    expect(kv.set).toHaveBeenCalledWith('rate-limit:test-user', 6);

    // Verify the result contains headers
    expect(result).toHaveProperty('headers');

    // Check if it's a NextResponse (rate limit exceeded) or headers object
    if ('headers' in result && !(result as any).status) {
      // Verify headers contain rate limit information
      expect(result.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('4');
      expect(result.headers.get('X-RateLimit-Reset')).toBeDefined();
    } else {
      fail('Expected headers object but got NextResponse');
    }

    // Verify headers were NOT set on the request
    expect(req.headers.get('X-RateLimit-Limit')).toBeNull();
    expect(req.headers.get('X-RateLimit-Remaining')).toBeNull();
  });

  it('should return a 429 response when rate limit is exceeded', async () => {
    // Mock Redis to return a count at the limit
    (kv.get as jest.Mock).mockResolvedValue(10);

    // Call the rate limit function directly
    const result = await rateLimit(req, 'test-user');

    // Check if it's a NextResponse (rate limit exceeded)
    if ('status' in result) {
      // Verify the response is a 429
      expect(result.status).toBe(429);

      // Verify headers were set on the response
      expect(result.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(result.headers.get('Retry-After')).toBe('60');
    } else {
      fail('Expected NextResponse but got headers object');
    }

    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith('rate-limit:test-user');
    expect(kv.set).not.toHaveBeenCalled();
  });

  it('should set expiration on new keys', async () => {
    // Mock Redis to return no count (new key)
    (kv.get as jest.Mock).mockResolvedValue(null);

    // Call the rate limit function
    const result = await rateLimit(req, 'new-user');

    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith('rate-limit:new-user');
    expect(kv.set).toHaveBeenCalledWith('rate-limit:new-user', 1);
    expect(kv.expire).toHaveBeenCalledWith('rate-limit:new-user', 60);

    // Check if it's a headers object
    if ('headers' in result && !(result as any).status) {
      // Verify headers contain rate limit information
      expect(result.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('9');
    } else {
      fail('Expected headers object but got NextResponse');
    }
  });

  it('should handle Redis errors gracefully', async () => {
    // Mock Redis to throw an error
    (kv.get as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Call the rate limit function
    const result = await rateLimit(req, 'test-user');

    // Verify empty headers are returned
    if ('headers' in result && !(result as any).status) {
      // Headers should be empty
      expect(Array.from(result.headers.entries()).length).toBe(0);
    } else {
      fail('Expected headers object but got NextResponse');
    }

    // Verify the error was logged
    expect(console.error).toHaveBeenCalled();
  });
});
