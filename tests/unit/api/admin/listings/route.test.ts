import { NextRequest, NextResponse } from 'next/server';

describe('Admin Listings Route Implementation', () => {
  // Create spies to track middleware calls
  const withTenantAccessSpy = jest.fn();
  const withPermissionSpy = jest.fn();

  // Create a mock response for the handler
  const mockResponse = { data: 'test-response' };

  // Mock the middleware modules
  jest.mock('@/middleware/tenant-validation', () => ({
    withTenantAccess: (req, handler) => {
      withTenantAccessSpy(req);
      // Just return a mock response instead of calling the handler
      return mockResponse;
    }
  }));

  jest.mock('@/middleware/withPermission', () => ({
    withPermission: (req, resourceType, permission, handler) => {
      withPermissionSpy(req, resourceType, permission);
      // Just return a mock response instead of calling the handler
      return mockResponse;
    }
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/listings', () => {
    it('should use the withTenantAccess middleware with correct parameters', async () => {
      // Import the route handler after mocking
      const { GET } = require('@/app/api/admin/listings/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings', {
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
      const { GET } = require('@/app/api/admin/listings/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings', {
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
      expect(withPermissionSpy).toHaveBeenCalledWith(req, 'listing', 'read');
    });
  });

  describe('POST /api/admin/listings', () => {
    it('should use the withTenantAccess middleware with correct parameters', async () => {
      // Import the route handler after mocking
      const { POST } = require('@/app/api/admin/listings/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ title: 'Test Listing' })
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
      const { POST } = require('@/app/api/admin/listings/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ title: 'Test Listing' })
      });

      // Call the route handler
      const response = await POST(req);

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withPermissionSpy).toHaveBeenCalledWith(req, 'listing', 'create');
    });
  });
});
