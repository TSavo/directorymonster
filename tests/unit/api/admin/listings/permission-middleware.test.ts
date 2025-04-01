/**
 * Tests for admin listings routes permission middleware
 *
 * These tests verify that the admin listings routes are properly secured with the correct
 * permission middleware and that the middleware is called with the correct parameters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/role-service');
jest.mock('jsonwebtoken');

// Mock the middleware modules
jest.mock('@/middleware/tenant-validation');
jest.mock('@/middleware/withPermission');

// Import the mocked modules
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission, withResourcePermission } from '@/middleware/withPermission';

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((data, options) => ({ data, status: options?.status || 200 }))
    }
  };
});

describe('Admin Listings Routes Permission Middleware', () => {
  // Test data
  const TEST_USER_ID = 'permission-test-user';
  const TEST_TENANT_ID = 'permission-test-tenant';
  const TEST_SECRET = 'test-secret';
  const TEST_TOKEN = 'valid-token'; // We'll mock the jwt.verify to return our test user

  // Set up JWT_SECRET for testing
  process.env.JWT_SECRET = TEST_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock jwt.verify to return our test user
    (jwt.verify as jest.Mock).mockReturnValue({ userId: TEST_USER_ID });

    // Mock RoleService.hasPermission to return true by default
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
  });

  describe('GET /api/admin/listings', () => {
    it('should use the correct permission middleware', async () => {
      // Setup mocks
      (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
        return { mockMiddleware: 'withTenantAccess' };
      });

      (withPermission as jest.Mock).mockImplementation((req, resourceType, permission, handler) => {
        return {
          mockMiddleware: 'withPermission',
          resourceType,
          permission
        };
      });

      // Import the route handler
      const { GET } = require('@/app/api/admin/listings/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings', {
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      // Call the route handler
      await GET(req);

      // Verify the middleware was called with the correct parameters
      expect(withPermission).toHaveBeenCalled();
      const calls = (withPermission as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(req);
      expect(calls[0][1]).toBe('listing');
      expect(calls[0][2]).toBe('read');
      expect(calls[0][3]).toBeInstanceOf(Function);
    });
  });

  describe('POST /api/admin/listings', () => {
    it('should use the correct permission middleware', async () => {
      // Setup mocks
      (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
        return { mockMiddleware: 'withTenantAccess' };
      });

      (withPermission as jest.Mock).mockImplementation((req, resourceType, permission, handler) => {
        return {
          mockMiddleware: 'withPermission',
          resourceType,
          permission
        };
      });

      // Import the route handler
      const { POST } = require('@/app/api/admin/listings/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings', {
        method: 'POST',
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name: 'Test Listing' })
      });

      // Call the route handler
      await POST(req);

      // Verify the middleware was called with the correct parameters
      expect(withPermission).toHaveBeenCalled();
      const calls = (withPermission as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(req);
      expect(calls[0][1]).toBe('listing');
      expect(calls[0][2]).toBe('create');
      expect(calls[0][3]).toBeInstanceOf(Function);
    });
  });

  describe('GET /api/admin/listings/:id', () => {
    it('should use the correct resource permission middleware', async () => {
      // Setup mocks
      (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
        return { mockMiddleware: 'withTenantAccess' };
      });

      (withResourcePermission as jest.Mock).mockImplementation((req, resourceType, permission, handler, resourceId) => {
        return {
          mockMiddleware: 'withResourcePermission',
          resourceType,
          permission,
          resourceId
        };
      });

      // Import the route handler
      const { GET } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      // Call the route handler with params
      await GET(req, { params: { id: 'test-listing-id' } });

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermission).toHaveBeenCalled();
      const calls = (withResourcePermission as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(req);
      expect(calls[0][1]).toBe('listing');
      expect(calls[0][2]).toBe('read');
      expect(calls[0][3]).toBeInstanceOf(Function);
    });
  });

  describe('PUT /api/admin/listings/:id', () => {
    it('should use the correct resource permission middleware', async () => {
      // Setup mocks
      (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
        return { mockMiddleware: 'withTenantAccess' };
      });

      (withResourcePermission as jest.Mock).mockImplementation((req, resourceType, permission, handler, resourceId) => {
        return {
          mockMiddleware: 'withResourcePermission',
          resourceType,
          permission,
          resourceId
        };
      });

      // Import the route handler
      const { PUT } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        method: 'PUT',
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name: 'Updated Listing' })
      });

      // Call the route handler with params
      await PUT(req, { params: { id: 'test-listing-id' } });

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermission).toHaveBeenCalled();
      const calls = (withResourcePermission as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(req);
      expect(calls[0][1]).toBe('listing');
      expect(calls[0][2]).toBe('update');
      expect(calls[0][3]).toBeInstanceOf(Function);
    });
  });

  describe('DELETE /api/admin/listings/:id', () => {
    it('should use the correct resource permission middleware', async () => {
      // Setup mocks
      (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
        return { mockMiddleware: 'withTenantAccess' };
      });

      (withResourcePermission as jest.Mock).mockImplementation((req, resourceType, permission, handler, resourceId) => {
        return {
          mockMiddleware: 'withResourcePermission',
          resourceType,
          permission,
          resourceId
        };
      });

      // Import the route handler
      const { DELETE } = require('@/app/api/admin/listings/[id]/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id', {
        method: 'DELETE',
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      // Call the route handler with params
      await DELETE(req, { params: { id: 'test-listing-id' } });

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermission).toHaveBeenCalled();
      const calls = (withResourcePermission as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(req);
      expect(calls[0][1]).toBe('listing');
      expect(calls[0][2]).toBe('delete');
      expect(calls[0][3]).toBeInstanceOf(Function);
    });
  });

  describe('POST /api/admin/listings/:id/feature', () => {
    it('should use the correct resource permission middleware', async () => {
      // Setup mocks
      (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
        return { mockMiddleware: 'withTenantAccess' };
      });

      (withResourcePermission as jest.Mock).mockImplementation((req, resourceType, permission, handler, resourceId) => {
        return {
          mockMiddleware: 'withResourcePermission',
          resourceType,
          permission,
          resourceId
        };
      });

      // Import the route handler
      const { POST } = require('@/app/api/admin/listings/[id]/feature/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id/feature', {
        method: 'POST',
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ featured: true })
      });

      // Call the route handler with params
      await POST(req, { params: { id: 'test-listing-id' } });

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermission).toHaveBeenCalled();
      const calls = (withResourcePermission as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(req);
      expect(calls[0][1]).toBe('listing');
      expect(calls[0][2]).toBe('manage');
      expect(calls[0][3]).toBeInstanceOf(Function);
    });
  });

  describe('POST /api/admin/listings/:id/images', () => {
    it('should use the correct resource permission middleware', async () => {
      // Setup mocks
      (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
        return { mockMiddleware: 'withTenantAccess' };
      });

      (withResourcePermission as jest.Mock).mockImplementation((req, resourceType, permission, handler, resourceId) => {
        return {
          mockMiddleware: 'withResourcePermission',
          resourceType,
          permission,
          resourceId
        };
      });

      // Import the route handler
      const { POST } = require('@/app/api/admin/listings/[id]/images/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id/images', {
        method: 'POST',
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: 'https://example.com/image.jpg' })
      });

      // Call the route handler with params
      await POST(req, { params: { id: 'test-listing-id' } });

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermission).toHaveBeenCalled();
      const calls = (withResourcePermission as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(req);
      expect(calls[0][1]).toBe('listing');
      expect(calls[0][2]).toBe('update');
      expect(calls[0][3]).toBeInstanceOf(Function);
    });
  });

  describe('POST /api/admin/listings/:id/verify', () => {
    it('should use the correct resource permission middleware', async () => {
      // Setup mocks
      (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
        return { mockMiddleware: 'withTenantAccess' };
      });

      (withResourcePermission as jest.Mock).mockImplementation((req, resourceType, permission, handler, resourceId) => {
        return {
          mockMiddleware: 'withResourcePermission',
          resourceType,
          permission,
          resourceId
        };
      });

      // Import the route handler
      const { POST } = require('@/app/api/admin/listings/[id]/verify/route');

      // Create a test request
      const req = new NextRequest('https://example.com/api/admin/listings/test-listing-id/verify', {
        method: 'POST',
        headers: {
          'x-tenant-id': TEST_TENANT_ID,
          'authorization': `Bearer ${TEST_TOKEN}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ verified: true })
      });

      // Call the route handler with params
      await POST(req, { params: { id: 'test-listing-id' } });

      // Verify the middleware was called with the correct parameters
      expect(withResourcePermission).toHaveBeenCalled();
      const calls = (withResourcePermission as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe(req);
      expect(calls[0][1]).toBe('listing');
      expect(calls[0][2]).toBe('manage');
      expect(calls[0][3]).toBeInstanceOf(Function);
    });
  });
});
