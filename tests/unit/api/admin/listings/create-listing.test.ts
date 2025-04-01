import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/listings/route';
import { kv } from '@/lib/redis-client';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
  }
}));

// Mock the middleware modules
jest.mock('@/middleware/tenant-validation', () => ({
  withTenantAccess: jest.fn().mockImplementation((req, handler) => {
    if (typeof handler === 'function') {
      return handler(req);
    }
    return { status: 500, body: 'Mock error: handler is not a function' };
  })
}));

jest.mock('@/middleware/withPermission', () => ({
  withPermission: jest.fn().mockImplementation((req, resourceType, permission, handler) => {
    if (typeof handler === 'function') {
      return handler(req);
    }
    return { status: 500, body: 'Mock error: handler is not a function' };
  })
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn((data, options) => {
        return {
          status: options?.status || 200,
          json: async () => data,
          headers: new Map()
        };
      })
    }
  };
});

describe('Create Listing API', () => {
  const testTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a new listing to Redis', async () => {
    // Create a mock request with listing data
    const req = new NextRequest('https://example.com/api/admin/listings', {
      method: 'POST',
      headers: {
        'x-tenant-id': testTenantId,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Listing',
        description: 'This is a test listing',
        status: 'draft',
        categoryIds: ['category-1']
      })
    });

    // Call the API
    const response = await POST(req);

    // Verify the response
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('listing');
    expect(data.listing.title).toBe('Test Listing');

    // Verify Redis was called to save the listing
    expect(kv.set).toHaveBeenCalled();

    // Get the arguments passed to kv.set
    const setArgs = kv.set.mock.calls[0];

    // Verify the key follows the expected pattern
    expect(setArgs[0]).toMatch(/^listing:tenant:tenant-123:/);

    // Verify the listing data was saved
    const savedListing = setArgs[1];
    expect(savedListing).toHaveProperty('title', 'Test Listing');
    expect(savedListing).toHaveProperty('tenantId', testTenantId);
    expect(savedListing).toHaveProperty('status', 'draft');
  });

  it('should return 400 if title is missing', async () => {
    // Create a mock request with missing title
    const req = new NextRequest('https://example.com/api/admin/listings', {
      method: 'POST',
      headers: {
        'x-tenant-id': testTenantId,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        description: 'This is a test listing',
        status: 'draft',
        categoryIds: ['category-1']
      })
    });

    // Call the API
    const response = await POST(req);

    // Verify the response
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Title is required');

    // Verify Redis was not called
    expect(kv.set).not.toHaveBeenCalled();
  });

  it('should handle Redis errors gracefully', async () => {
    // Setup Redis mock to throw an error
    kv.set.mockRejectedValue(new Error('Redis connection error'));

    // Create a mock request with listing data
    const req = new NextRequest('https://example.com/api/admin/listings', {
      method: 'POST',
      headers: {
        'x-tenant-id': testTenantId,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Listing',
        description: 'This is a test listing',
        status: 'draft',
        categoryIds: ['category-1']
      })
    });

    // Call the API
    const response = await POST(req);

    // Verify the response
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
