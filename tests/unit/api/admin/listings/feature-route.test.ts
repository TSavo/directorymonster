import { NextRequest, NextResponse } from 'next/server';

describe('Admin Listing Feature Route Implementation', () => {
  // Create spies to track middleware calls
  const withTenantAccessSpy = jest.fn();
  const withResourcePermissionSpy = jest.fn();

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
    withResourcePermission: (req, resourceType, permission, handler) => {
      withResourcePermissionSpy(req, resourceType, permission);
      // Just return a mock response instead of calling the handler
      return mockResponse;
    }
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/listings/:id/feature', () => {
    it('should use the withTenantAccess middleware with correct parameters', async () => {
      // Import the route handler after mocking
      const { POST } = require('@/app/api/admin/listings/[id]/feature/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id/feature', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ featured: true })
      });

      // Call the route handler with params
      const response = await POST(req, { params: { id: 'test-listing-id' } });

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withTenantAccessSpy).toHaveBeenCalledWith(req);
    });

    it('should use the withResourcePermission middleware with correct resource type and permission', async () => {
      // Import the route handler after mocking
      const { POST } = require('@/app/api/admin/listings/[id]/feature/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id/feature', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ featured: true })
      });

      // Call the route handler with params
      const response = await POST(req, { params: { id: 'test-listing-id' } });

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermissionSpy).toHaveBeenCalledWith(req, 'listing', 'manage');
    });
  });
});
