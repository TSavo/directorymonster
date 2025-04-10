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
const { POST } = require('@/app/api/admin/security/report/route');

describe('Security Report API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log and console.error to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('POST /api/admin/security/report', () => {
    it('should submit a security report', async () => {
      // Create a mock request with report data
      const reportData = { 
        activityType: 'suspicious_login', 
        description: 'Multiple failed login attempts' 
      };
      const req = new NextRequest('http://localhost:3000/api/admin/security/report', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Report submitted successfully'
      });

      // Verify console.log was called with the report data
      expect(console.log).toHaveBeenCalledWith('Suspicious activity report received:', reportData);
    });

    it('should validate activityType field', async () => {
      // Create a mock request with missing activityType
      const reportData = { description: 'Multiple failed login attempts' }; // Missing activityType
      const req = new NextRequest('http://localhost:3000/api/admin/security/report', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Activity type is required' });
    });

    it('should validate description field', async () => {
      // Create a mock request with missing description
      const reportData = { activityType: 'suspicious_login' }; // Missing description
      const req = new NextRequest('http://localhost:3000/api/admin/security/report', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Description is required' });
    });

    it('should handle JSON parsing errors', async () => {
      // Create a mock request with invalid JSON
      const req = new NextRequest('http://localhost:3000/api/admin/security/report', {
        method: 'POST',
        body: 'not-valid-json'
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to submit report' });
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
});
