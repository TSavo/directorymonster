import { NextRequest, NextResponse } from 'next/server';

describe('Admin Categories Route Implementation', () => {
  // Create spies to track middleware calls
  const withTenantAccessSpy = jest.fn();
  const withPermissionSpy = jest.fn();

  // Create a mock response for the handler
  const mockResponse = { data: 'test-response' };

  // Mock the middleware modules
  jest.mock('@/app/api/middleware/index', () => ({
    withTenantAccess: (req, handler) => {
      withTenantAccessSpy(req);
      // Call the handler with the request
      return handler(req);
    },
    withPermission: (req, resourceType, permission, handler) => {
      withPermissionSpy(req, resourceType, permission);
      // Return the mock response instead of calling the handler
      return mockResponse;
    },
    withSitePermission: jest.fn()
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/categories', () => {
    it('should use the withTenantAccess middleware with correct parameters', async () => {
      // Import the route handler after mocking
      const { GET } = require('@/app/api/admin/categories/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/categories', {
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler
      const response = await GET(req);

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withTenantAccessSpy).toHaveBeenCalledWith(req);
    });

    it('should use the withPermission middleware with correct resource type and permission', async () => {
      // Import the route handler after mocking
      const { GET } = require('@/app/api/admin/categories/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/categories', {
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler
      const response = await GET(req);

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withPermissionSpy).toHaveBeenCalledWith(req, 'category', 'read');
    });
  });

  describe('POST /api/admin/categories', () => {
    it('should use the withTenantAccess middleware with correct parameters', async () => {
      // Import the route handler after mocking
      const { POST } = require('@/app/api/admin/categories/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/categories', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name: 'Test Category' })
      });

      // Call the route handler
      const response = await POST(req);

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withTenantAccessSpy).toHaveBeenCalledWith(req);
    });

    it('should use the withPermission middleware with correct resource type and permission', async () => {
      // Import the route handler after mocking
      const { POST } = require('@/app/api/admin/categories/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/categories', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name: 'Test Category' })
      });

      // Call the route handler
      const response = await POST(req);

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withPermissionSpy).toHaveBeenCalledWith(req, 'category', 'create');
    });
  });
});
