import { NextRequest, NextResponse } from 'next/server';
import { Category } from '@/types';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  }
}));

// Mock the middleware
jest.mock('@/middleware/tenant-validation', () => ({
  withTenantAccess: jest.fn().mockImplementation((req, handlerOrMiddleware) => {
    // If handlerOrMiddleware is a function, call it directly
    if (typeof handlerOrMiddleware === 'function') {
      return handlerOrMiddleware(req);
    }
    // Otherwise, it's the result of another middleware, so call it with the request
    return handlerOrMiddleware(req);
  }),
}));

jest.mock('@/middleware/withPermission', () => ({
  withResourcePermission: jest.fn().mockImplementation((req, resourceType, permission, handler) => {
    // Return a function that will be called by withTenantAccess
    return (validatedReq) => handler(validatedReq);
  }),
}));

describe('Category API Tenant Validation', () => {
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;
  let mockDel: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    // Get fresh mocks for each test
    const { kv } = require('@/lib/redis-client');
    mockGet = kv.get as jest.Mock;
    mockSet = kv.set as jest.Mock;
    mockDel = kv.del as jest.Mock;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/admin/categories/:id', () => {
    it('should validate tenant ownership', async () => {
      // Create a test category
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Mock the Redis get function to return our test category
      mockGet.mockResolvedValue(mockCategory);

      // Import the route handler
      const { GET } = require('@/app/api/admin/categories/[id]/route');

      // Test with matching tenant
      const reqWithMatchingTenant = new NextRequest('https://example.com/api/admin/categories/test-category-id', {
        headers: {
          'x-tenant-id': 'test-tenant', // Same as category.tenantId
          'authorization': 'Bearer test-token'
        }
      });

      const responseWithMatchingTenant = await GET(reqWithMatchingTenant, { params: { id: 'test-category-id' } });
      const responseDataWithMatchingTenant = await responseWithMatchingTenant.json();

      // Should return the category when tenant matches
      expect(responseWithMatchingTenant.status).toBe(200);
      expect(responseDataWithMatchingTenant.category).toEqual(mockCategory);

      // Test with different tenant
      const reqWithDifferentTenant = new NextRequest('https://example.com/api/admin/categories/test-category-id', {
        headers: {
          'x-tenant-id': 'different-tenant', // Different from category.tenantId
          'authorization': 'Bearer test-token'
        }
      });

      const responseWithDifferentTenant = await GET(reqWithDifferentTenant, { params: { id: 'test-category-id' } });
      const responseDataWithDifferentTenant = await responseWithDifferentTenant.json();

      // Should return 404 when tenant doesn't match
      expect(responseWithDifferentTenant.status).toBe(404);
      expect(responseDataWithDifferentTenant.error).toBe('Category not found or does not belong to this tenant');
    });
  });
});
