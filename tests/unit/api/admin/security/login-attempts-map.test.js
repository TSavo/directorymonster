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
const { GET } = require('@/app/api/admin/security/login-attempts-map/route');

describe('Security Login Attempts Map API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    console.error.mockRestore();
  });

  describe('GET /api/admin/security/login-attempts-map', () => {
    it('should return login attempts map data', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts-map');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('mapData');
      expect(Array.isArray(data.mapData)).toBe(true);

      // Verify each map point has the required properties
      data.mapData.forEach(point => {
        expect(point).toHaveProperty('id');
        expect(point).toHaveProperty('latitude');
        expect(point).toHaveProperty('longitude');
        expect(point).toHaveProperty('count');
      });
    });

    it('should apply IP risk level filters', async () => {
      // Create a mock request with IP risk level filter
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts-map?ipRiskLevel=high');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('mapData');

      // All returned points should have ipRiskLevel=high
      data.mapData.forEach(point => {
        expect(point.ipRiskLevel).toBe('high');
      });
    });

    it('should handle errors', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts-map');

      // Mock the validatedReq.url to cause an error when accessed
      const mockValidatedReq = {
        get url() {
          throw new Error('URL parsing error');
        }
      };

      // Mock the middleware to pass our custom request
      const { withSecureTenantPermission } = require('@/app/api/middleware/secureTenantContext');
      withSecureTenantPermission.mockImplementationOnce((req, resourceType, permission, handler) => {
        return handler(mockValidatedReq, {
          tenantId: 'test-tenant-id',
          siteId: 'test-site-id',
          userId: 'test-user-id'
        });
      });

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch map data' });

      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
});
