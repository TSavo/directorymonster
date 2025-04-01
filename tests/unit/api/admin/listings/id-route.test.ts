import { NextRequest, NextResponse } from 'next/server';

describe('Admin Listing by ID Route Implementation', () => {
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

  describe('GET /api/admin/listings/:id', () => {
    it('should use the withTenantAccess middleware with correct parameters', async () => {
      // Import the route handler after mocking
      const { GET } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await GET(req, { params: { id: 'test-listing-id' } });

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withTenantAccessSpy).toHaveBeenCalledWith(req);
    });

    it('should use the withResourcePermission middleware with correct resource type and permission', async () => {
      // Import the route handler after mocking
      const { GET } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await GET(req, { params: { id: 'test-listing-id' } });

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermissionSpy).toHaveBeenCalledWith(req, 'listing', 'read');
    });
  });

  describe('PUT /api/admin/listings/:id', () => {
    it('should use the withTenantAccess middleware with correct parameters', async () => {
      // Import the route handler after mocking
      const { PUT } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        method: 'PUT',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Listing' })
      });

      // Call the route handler with params
      const response = await PUT(req, { params: { id: 'test-listing-id' } });

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withTenantAccessSpy).toHaveBeenCalledWith(req);
    });

    it('should use the withResourcePermission middleware with correct resource type and permission', async () => {
      // Import the route handler after mocking
      const { PUT } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        method: 'PUT',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Listing' })
      });

      // Call the route handler with params
      const response = await PUT(req, { params: { id: 'test-listing-id' } });

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermissionSpy).toHaveBeenCalledWith(req, 'listing', 'update');
    });
  });

  describe('DELETE /api/admin/listings/:id', () => {
    it('should use the withTenantAccess middleware with correct parameters', async () => {
      // Import the route handler after mocking
      const { DELETE } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        method: 'DELETE',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await DELETE(req, { params: { id: 'test-listing-id' } });

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withTenantAccessSpy).toHaveBeenCalledWith(req);
    });

    it('should use the withResourcePermission middleware with correct resource type and permission', async () => {
      // Import the route handler after mocking
      const { DELETE } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        method: 'DELETE',
        headers: {
          'x-tenant-id': 'test-tenant',
          'authorization': 'Bearer test-token'
        }
      });

      // Call the route handler with params
      const response = await DELETE(req, { params: { id: 'test-listing-id' } });

      // Verify the response is our mock response
      expect(response).toBe(mockResponse);

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermissionSpy).toHaveBeenCalledWith(req, 'listing', 'delete');
    });
  });
});
