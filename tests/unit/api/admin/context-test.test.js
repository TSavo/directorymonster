/**
 * @jest-environment node
 */

// Mock the security middleware
jest.mock('@/app/api/middleware/secureTenantContext', () => ({
  withSecureTenantPermission: jest.fn((req, resourceType, permission, handler) => {
    return handler(req, { 
      tenantId: 'test-tenant-id',
      siteId: 'test-site-id',
      userId: 'test-user-id'
    });
  })
}));

const { NextRequest } = require('next/server');
const { GET, POST } = require('@/app/api/admin/context-test/route');

describe('Context Test API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/context-test', () => {
    it('should return the context information', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/context-test');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        tenantId: 'test-tenant-id',
        siteId: 'test-site-id',
        userId: 'test-user-id',
        message: 'Context successfully extracted'
      });
    });
  });

  describe('POST /api/admin/context-test', () => {
    it('should return the context information when site ID is provided', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/context-test', {
        method: 'POST'
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        tenantId: 'test-tenant-id',
        siteId: 'test-site-id',
        userId: 'test-user-id',
        message: 'Context successfully extracted with site required'
      });
    });

    it('should return 400 when site ID is not provided', async () => {
      // Mock the security middleware for this specific test
      const { withSecureTenantPermission } = require('@/app/api/middleware/secureTenantContext');
      withSecureTenantPermission.mockImplementationOnce((req, resourceType, permission, handler) => {
        return handler(req, { 
          tenantId: 'test-tenant-id',
          siteId: null, // No site ID
          userId: 'test-user-id'
        });
      });

      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/context-test', {
        method: 'POST'
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Site ID is required' });
    });
  });
});
