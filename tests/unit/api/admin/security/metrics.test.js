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
const { GET } = require('@/app/api/admin/security/metrics/route');

describe('Security Metrics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    console.error.mockRestore();
  });

  describe('GET /api/admin/security/metrics', () => {
    it('should return security metrics', async () => {
      // Create a mock request with query parameters
      const req = new NextRequest('http://localhost:3000/api/admin/security/metrics?startDate=2023-01-01&endDate=2023-01-31');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('metrics');
      expect(data.metrics).toEqual({
        totalAttempts: 125,
        successfulAttempts: 87,
        failedAttempts: 38,
        blockedAttempts: 12,
        captchaRequiredCount: 18,
        highRiskIPs: 5
      });
    });

    it('should handle errors', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/security/metrics');

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
      expect(data).toEqual({ error: 'Failed to fetch security metrics' });

      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
});
