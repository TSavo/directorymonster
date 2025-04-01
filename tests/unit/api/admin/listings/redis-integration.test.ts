import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/admin/listings/route';
import { redis, kv } from '@/lib/redis-client';
import { sign } from 'jsonwebtoken';

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn((data, options) => {
        const response = {
          status: options?.status || 200,
          json: async () => data,
          headers: new Map()
        };
        return response;
      })
    }
  };
});

// Mock the middleware modules
jest.mock('@/middleware/tenant-validation', () => ({
  withTenantAccess: jest.fn((req, handler) => handler(req))
}));

jest.mock('@/middleware/withPermission', () => ({
  withPermission: jest.fn((req, resourceType, permission, handler) => handler(req))
}));

// Mock Redis client
jest.mock('@/lib/redis-client', () => {
  const mockRedis = {
    keys: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  };

  return {
    redis: mockRedis,
    kv: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn()
    }
  };
});

// JWT secret for testing
const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

describe('Admin Listings API with Redis Integration', () => {
  // Test data
  const testTenantId = 'tenant-123';
  const testUserId = 'user-123';
  const testToken = sign({ userId: testUserId }, JWT_SECRET);

  // Mock listings data
  const mockListings = [
    {
      id: 'listing-1',
      title: 'Test Listing 1',
      tenantId: testTenantId,
      status: 'published'
    },
    {
      id: 'listing-2',
      title: 'Test Listing 2',
      tenantId: testTenantId,
      status: 'draft'
    }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // Helper to create mock requests
  const createMockRequest = (options: any = {}) => {
    const url = new URL(
      options.url || 'https://example.com/api/admin/listings',
      'https://example.com'
    );

    // Add query parameters
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.append(key, value as string);
      });
    }

    // Create headers
    const headers = new Headers();
    headers.set('x-tenant-id', options.tenantId || testTenantId);
    headers.set('authorization', `Bearer ${options.token || testToken}`);

    return new NextRequest(url, { headers });
  };

  describe('GET /api/admin/listings', () => {
    it('should retrieve listings from Redis for the tenant', async () => {
      // Setup Redis mock to return listing keys
      const listingKeys = ['listing:id:listing-1', 'listing:id:listing-2'];
      kv.keys.mockResolvedValue(listingKeys);

      // Setup Redis mock to return listing data
      kv.get.mockImplementation((key) => {
        if (key === 'listing:id:listing-1') {
          return Promise.resolve(mockListings[0]);
        } else if (key === 'listing:id:listing-2') {
          return Promise.resolve(mockListings[1]);
        }
        return Promise.resolve(null);
      });

      // Create a mock request
      const req = createMockRequest();

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Verify Redis was called correctly
      expect(kv.keys).toHaveBeenCalledWith(`listing:tenant:${testTenantId}:*`);

      // Verify the response contains the listings
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('listings');
      expect(data.listings).toHaveLength(2);
      expect(data.listings[0].id).toBe('listing-1');
      expect(data.listings[1].id).toBe('listing-2');
    });

    it('should filter listings by status if provided', async () => {
      // Setup Redis mock to return listing keys
      const listingKeys = ['listing:id:listing-1', 'listing:id:listing-2'];
      kv.keys.mockResolvedValue(listingKeys);

      // Setup Redis mock to return listing data
      kv.get.mockImplementation((key) => {
        if (key === 'listing:id:listing-1') {
          return Promise.resolve(mockListings[0]);
        } else if (key === 'listing:id:listing-2') {
          return Promise.resolve(mockListings[1]);
        }
        return Promise.resolve(null);
      });

      // Create a mock request with status filter
      const req = createMockRequest({
        query: { status: 'published' }
      });

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Verify Redis was called correctly
      expect(kv.keys).toHaveBeenCalledWith(`listing:tenant:${testTenantId}:*`);

      // Verify the response contains only published listings
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('listings');
      expect(data.listings).toHaveLength(1);
      expect(data.listings[0].id).toBe('listing-1');
      expect(data.listings[0].status).toBe('published');
    });

    it('should handle Redis errors gracefully', async () => {
      // Setup Redis mock to throw an error
      kv.keys.mockRejectedValue(new Error('Redis connection error'));

      // Create a mock request
      const req = createMockRequest();

      // Call the API
      const response = await GET(req);

      // Verify the response contains an error
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});
