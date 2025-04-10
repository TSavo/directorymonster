/**
 * @jest-environment node
 */

// Mock the security middleware
jest.mock('@/app/api/middleware/secureTenantContext', () => ({
  withSecureTenantPermission: jest.fn((req, resourceType, permission, handler, resourceId) => {
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
    getGlobalRole: jest.fn(),
    removeGlobalRoleFromUser: jest.fn()
  }
}));

// Mock the audit service
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    log: jest.fn()
  }
}));

const { NextRequest } = require('next/server');
const { POST } = require('@/app/api/admin/roles/global/[id]/remove/route');
const { RoleService } = require('@/lib/role-service');
const { AuditService } = require('@/lib/audit/audit-service');

describe('Global Role Remove API', () => {
  const roleId = 'role-123';
  const params = { id: roleId };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/roles/global/[id]/remove', () => {
    it('should remove a global role from a user', async () => {
      // Mock the role service
      const mockRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(mockRole);
      RoleService.removeGlobalRoleFromUser.mockResolvedValue(true);

      // Create a mock request with removal data
      const removeData = { userId: 'user-123', tenantId: 'tenant-123' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/remove`, {
        method: 'POST',
        body: JSON.stringify(removeData)
      });

      // Call the handler
      const response = await POST(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });

      // Verify the services were called
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
      expect(RoleService.removeGlobalRoleFromUser).toHaveBeenCalledTimes(1);
      expect(RoleService.removeGlobalRoleFromUser).toHaveBeenCalledWith(
        roleId, 
        removeData.userId, 
        removeData.tenantId
      );

      // Verify the audit log was created
      expect(AuditService.log).toHaveBeenCalledTimes(1);
      expect(AuditService.log).toHaveBeenCalledWith({
        action: 'role.remove',
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        details: {
          roleId,
          roleName: mockRole.name,
          removedUserId: removeData.userId,
          removedTenantId: removeData.tenantId
        }
      });
    });

    it('should validate required fields', async () => {
      // Create a mock request with missing required fields
      const removeData = { userId: 'user-123' }; // Missing tenantId
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/remove`, {
        method: 'POST',
        body: JSON.stringify(removeData)
      });

      // Call the handler
      const response = await POST(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'userId and tenantId are required' });

      // Verify the services were not called
      expect(RoleService.getGlobalRole).not.toHaveBeenCalled();
      expect(RoleService.removeGlobalRoleFromUser).not.toHaveBeenCalled();
      expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should return 404 if role not found', async () => {
      // Mock the role service to return null (role not found)
      RoleService.getGlobalRole.mockResolvedValue(null);

      // Create a mock request with removal data
      const removeData = { userId: 'user-123', tenantId: 'tenant-123' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/remove`, {
        method: 'POST',
        body: JSON.stringify(removeData)
      });

      // Call the handler
      const response = await POST(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Global role not found' });

      // Verify the service was called with the correct ID
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
      expect(RoleService.removeGlobalRoleFromUser).not.toHaveBeenCalled();
      expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock the role service
      const mockRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(mockRole);
      RoleService.removeGlobalRoleFromUser.mockRejectedValue(new Error('Database error'));

      // Create a mock request with removal data
      const removeData = { userId: 'user-123', tenantId: 'tenant-123' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/remove`, {
        method: 'POST',
        body: JSON.stringify(removeData)
      });

      // Call the handler
      const response = await POST(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to remove global role' });

      // Verify the services were called
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.removeGlobalRoleFromUser).toHaveBeenCalledTimes(1);
      expect(AuditService.log).not.toHaveBeenCalled();
    });
  });
});
