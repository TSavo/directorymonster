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

// Mock the role service
jest.mock('@/lib/role-service', () => ({
  RoleService: {
    getGlobalRoles: jest.fn(),
    createGlobalRole: jest.fn()
  }
}));

// Mock the audit service
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    log: jest.fn()
  }
}));

const { NextRequest } = require('next/server');
const { GET, POST } = require('@/app/api/admin/roles/global/route');
const { RoleService } = require('@/lib/role-service');
const { AuditService } = require('@/lib/audit/audit-service');

describe('Global Roles API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/roles/global', () => {
    it('should return global roles', async () => {
      // Mock the role service to return roles
      const mockRoles = [
        { id: 'role-1', name: 'Admin', aclEntries: [] },
        { id: 'role-2', name: 'Editor', aclEntries: [] }
      ];
      RoleService.getGlobalRoles.mockResolvedValue(mockRoles);

      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/roles/global');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ roles: mockRoles });

      // Verify the service was called
      expect(RoleService.getGlobalRoles).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      // Mock the role service to throw an error
      RoleService.getGlobalRoles.mockRejectedValue(new Error('Database error'));

      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/admin/roles/global');

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to get global roles' });

      // Verify the service was called
      expect(RoleService.getGlobalRoles).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/admin/roles/global', () => {
    it('should create a new global role', async () => {
      // Mock the role service to return a created role
      const mockRole = { id: 'role-1', name: 'Admin', aclEntries: [] };
      RoleService.createGlobalRole.mockResolvedValue(mockRole);

      // Create a mock request with role data
      const roleData = { name: 'Admin', aclEntries: [] };
      const req = new NextRequest('http://localhost:3000/api/admin/roles/global', {
        method: 'POST',
        body: JSON.stringify(roleData)
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ role: mockRole });

      // Verify the service was called with the correct data
      expect(RoleService.createGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.createGlobalRole).toHaveBeenCalledWith(roleData);

      // Verify the audit log was created
      expect(AuditService.log).toHaveBeenCalledTimes(1);
      expect(AuditService.log).toHaveBeenCalledWith({
        action: 'role.create',
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        details: {
          roleName: mockRole.name
        }
      });
    });

    it('should validate required fields', async () => {
      // Create a mock request with missing required fields
      const roleData = { description: 'Admin role' }; // Missing name and aclEntries
      const req = new NextRequest('http://localhost:3000/api/admin/roles/global', {
        method: 'POST',
        body: JSON.stringify(roleData)
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Name and aclEntries are required' });

      // Verify the service was not called
      expect(RoleService.createGlobalRole).not.toHaveBeenCalled();
      expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock the role service to throw an error
      RoleService.createGlobalRole.mockRejectedValue(new Error('Database error'));

      // Create a mock request with role data
      const roleData = { name: 'Admin', aclEntries: [] };
      const req = new NextRequest('http://localhost:3000/api/admin/roles/global', {
        method: 'POST',
        body: JSON.stringify(roleData)
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create global role' });

      // Verify the service was called
      expect(RoleService.createGlobalRole).toHaveBeenCalledTimes(1);
      expect(AuditService.log).not.toHaveBeenCalled();
    });
  });
});
