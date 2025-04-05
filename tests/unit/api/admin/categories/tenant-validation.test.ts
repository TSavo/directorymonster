import { NextRequest, NextResponse } from 'next/server';
import { redis, kv } from '@/lib/redis-client';
import { Category } from '@/types';
import { categoryKeys } from '@/lib/tenant/redis-keys';

// Mock Redis client
jest.mock('@/lib/redis-client', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  }
}));

// Mock the middleware to pass through to the handler
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
  withPermission: jest.fn().mockImplementation((req, resourceType, permission, handler) => {
    // Return a function that will be called by withTenantAccess
    return (validatedReq) => handler(validatedReq);
  }),
  withResourcePermission: jest.fn().mockImplementation((req, resourceType, permission, handler) => {
    // Return a function that will be called by withTenantAccess
    return (validatedReq) => handler(validatedReq);
  }),
}));

describe('Category API Tenant Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/categories/:id', () => {
    it('should return 404 when category does not exist', async () => {
      // Mock implementation to simulate category not found
      (kv.get as jest.Mock).mockResolvedValue(null);

      // Import the route handler
      const { GET } = require('@/app/api/admin/categories/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/categories/non-existent-id', {
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await GET(req, { params: { id: 'non-existent-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and message
      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Category not found or does not belong to this tenant');
    });

    it('should return 404 when category belongs to a different tenant', async () => {
      // Mock implementation to simulate category from different tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'different-tenant', // Different from the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      (kv.get as jest.Mock).mockResolvedValue(mockCategory);

      // Import the route handler
      const { GET } = require('@/app/api/admin/categories/[id]/route');

      // Create a test request with a different tenant
      const req = new NextRequest('https://example.com/api/admin/categories/test-category-id', {
        headers: {
          'x-tenant-id': 'test-tenant', // Different from the category's tenant
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await GET(req, { params: { id: 'test-category-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and message
      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Category not found or does not belong to this tenant');
    });

    it('should return the category when it belongs to the correct tenant', async () => {
      // Mock implementation to simulate category from the correct tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant', // Same as the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      (kv.get as jest.Mock).mockResolvedValue(mockCategory);

      // Import the route handler
      const { GET } = require('@/app/api/admin/categories/[id]/route');

      // Create a test request with the matching tenant
      const req = new NextRequest('https://example.com/api/admin/categories/test-category-id', {
        headers: {
          'x-tenant-id': 'test-tenant', // Same as the category's tenant
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await GET(req, { params: { id: 'test-category-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and data
      expect(response.status).toBe(200);
      expect(responseData.category).toEqual(mockCategory);
    });
  });

  describe('PUT /api/admin/categories/:id', () => {
    it('should return 404 when category does not exist', async () => {
      // Mock implementation to simulate category not found
      (kv.get as jest.Mock).mockResolvedValue(null);

      // Import the route handler
      const { PUT } = require('@/app/api/admin/categories/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/categories/non-existent-id', {
        method: 'PUT',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name: 'Updated Category' })
      });

      // Call the route handler with params
      const response = await PUT(req, { params: { id: 'non-existent-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and message
      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Category not found or does not belong to this tenant');
    });

    it('should return 404 when category belongs to a different tenant', async () => {
      // Mock implementation to simulate category from different tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'different-tenant', // Different from the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      (kv.get as jest.Mock).mockResolvedValue(mockCategory);

      // Import the route handler
      const { PUT } = require('@/app/api/admin/categories/[id]/route');

      // Create a test request with a different tenant
      const req = new NextRequest('https://example.com/api/admin/categories/test-category-id', {
        method: 'PUT',
        headers: {
          'x-tenant-id': 'test-tenant', // Different from the category's tenant
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name: 'Updated Category' })
      });

      // Call the route handler with params
      const response = await PUT(req, { params: { id: 'test-category-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and message
      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Category not found or does not belong to this tenant');
    });

    it('should update the category when it belongs to the correct tenant', async () => {
      // Mock implementation to simulate category from the correct tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant', // Same as the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      (kv.get as jest.Mock).mockResolvedValue(mockCategory);
      (kv.set as jest.Mock).mockResolvedValue(undefined);

      // Import the route handler
      const { PUT } = require('@/app/api/admin/categories/[id]/route');

      const updateData = { name: 'Updated Category', order: 1 };

      // Create a test request with the matching tenant
      const req = new NextRequest('https://example.com/api/admin/categories/test-category-id', {
        method: 'PUT',
        headers: {
          'x-tenant-id': 'test-tenant', // Same as the category's tenant
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      // Call the route handler with params
      const response = await PUT(req, { params: { id: 'test-category-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and data
      expect(response.status).toBe(200);

      // Check each property individually, ignoring the updatedAt timestamp
      const category = responseData.category;
      expect(category.id).toBe(mockCategory.id);
      expect(category.name).toBe(updateData.name);
      expect(category.slug).toBe(mockCategory.slug);
      expect(category.order).toBe(updateData.order);
      expect(category.siteId).toBe(mockCategory.siteId);
      expect(category.tenantId).toBe('test-tenant'); // Ensure tenant ID remains unchanged
      expect(category.updatedAt).toBeDefined(); // Just check that updatedAt exists
    });
  });

  describe('DELETE /api/admin/categories/:id', () => {
    it('should return 404 when category does not exist', async () => {
      // Mock implementation to simulate category not found
      (kv.get as jest.Mock).mockResolvedValue(null);

      // Import the route handler
      const { DELETE } = require('@/app/api/admin/categories/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/categories/non-existent-id', {
        method: 'DELETE',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await DELETE(req, { params: { id: 'non-existent-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and message
      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Category not found or does not belong to this tenant');
    });

    it('should return 404 when category belongs to a different tenant', async () => {
      // Mock implementation to simulate category from different tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'different-tenant', // Different from the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      (kv.get as jest.Mock).mockResolvedValue(mockCategory);

      // Import the route handler
      const { DELETE } = require('@/app/api/admin/categories/[id]/route');

      // Create a test request with a different tenant
      const req = new NextRequest('https://example.com/api/admin/categories/test-category-id', {
        method: 'DELETE',
        headers: {
          'x-tenant-id': 'test-tenant', // Different from the category's tenant
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await DELETE(req, { params: { id: 'test-category-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and message
      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Category not found or does not belong to this tenant');
    });

    it('should delete the category when it belongs to the correct tenant', async () => {
      // Mock implementation to simulate category from the correct tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant', // Same as the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      (kv.get as jest.Mock).mockResolvedValue(mockCategory);
      (kv.del as jest.Mock).mockResolvedValue(undefined);

      // Import the route handler
      const { DELETE } = require('@/app/api/admin/categories/[id]/route');

      // Create a test request with the matching tenant
      const req = new NextRequest('https://example.com/api/admin/categories/test-category-id', {
        method: 'DELETE',
        headers: {
          'x-tenant-id': 'test-tenant', // Same as the category's tenant
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await DELETE(req, { params: { id: 'test-category-id' } });

      // Parse the response
      const responseData = await response.json();

      // Verify the response status and message
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('deleted successfully');
    });
  });
});
