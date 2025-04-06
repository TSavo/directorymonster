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
const { GET } = require('@/app/api/admin/security/login-attempts/route');

describe('Security Login Attempts API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    console.error.mockRestore();
  });

  describe('GET /api/admin/security/login-attempts', () => {
    it('should return login attempts with default pagination', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('loginAttempts');
      expect(data).toHaveProperty('hasMore');
      expect(data.loginAttempts.length).toBeLessThanOrEqual(10); // Default limit is 10
    });

    it('should apply pagination parameters', async () => {
      // Create a mock request with pagination parameters
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts?limit=2&offset=1');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('loginAttempts');
      expect(data.loginAttempts.length).toBeLessThanOrEqual(2); // Limit is 2
    });

    it('should apply status filters', async () => {
      // Create a mock request with status filter
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts?status=success');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('loginAttempts');

      // All returned attempts should have success=true
      data.loginAttempts.forEach(attempt => {
        expect(attempt.success).toBe(true);
      });
    });

    it('should apply IP risk level filters', async () => {
      // Create a mock request with IP risk level filter
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts?ipRiskLevel=high');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('loginAttempts');

      // All returned attempts should have ipRiskLevel=high
      data.loginAttempts.forEach(attempt => {
        expect(attempt.ipRiskLevel).toBe('high');
      });
    });

    it('should apply user ID filter', async () => {
      // Create a mock request with user ID filter
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts?userId=user1');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('loginAttempts');

      // All returned attempts should have username=user1
      data.loginAttempts.forEach(attempt => {
        expect(attempt.username).toBe('user1');
      });
    });

    it('should handle errors', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/security/login-attempts');

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
      expect(data).toEqual({ error: 'Failed to fetch login attempts' });

      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
});
