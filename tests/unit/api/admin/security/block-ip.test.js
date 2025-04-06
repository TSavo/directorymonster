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
const { POST } = require('@/app/api/admin/security/block-ip/route');

describe('Security Block IP API', () => {
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

  describe('POST /api/admin/security/block-ip', () => {
    it('should block an IP address', async () => {
      // Create a mock request with IP data
      const ipData = { ip: '192.168.1.1' };
      const req = new NextRequest('http://localhost:3000/api/admin/security/block-ip', {
        method: 'POST',
        body: JSON.stringify(ipData)
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'IP address blocked successfully'
      });

      // Verify console.log was called with the IP
      expect(console.log).toHaveBeenCalledWith('IP address blocked:', ipData.ip);
    });

    it('should validate required fields', async () => {
      // Create a mock request with missing IP
      const ipData = { reason: 'Suspicious activity' }; // Missing ip
      const req = new NextRequest('http://localhost:3000/api/admin/security/block-ip', {
        method: 'POST',
        body: JSON.stringify(ipData)
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'IP address is required' });
    });

    it('should handle JSON parsing errors', async () => {
      // Create a mock request with invalid JSON
      const req = new NextRequest('http://localhost:3000/api/admin/security/block-ip', {
        method: 'POST',
        body: 'not-valid-json'
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to block IP address' });
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
});
