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
    assignGlobalRoleToUser: jest.fn()
  }
}));

// Mock the audit service
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    log: jest.fn()
  }
}));

const { NextRequest } = require('next/server');
const { POST } = require('@/app/api/admin/roles/global/[id]/assign/route');
const { RoleService } = require('@/lib/role-service');
const { AuditService } = require('@/lib/audit/audit-service');

describe('Global Role Assign API', () => {
  const roleId = 'role-123';
  const params = { id: roleId };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/roles/global/[id]/assign', () => {
    it('should assign a global role to a user', async () => {
      // Mock the role service
      const mockRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(mockRole);
      RoleService.assignGlobalRoleToUser.mockResolvedValue(true);

      // Create a mock request with assignment data
      const assignData = { userId: 'user-123', tenantId: 'tenant-123' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignData)
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
      expect(RoleService.assignGlobalRoleToUser).toHaveBeenCalledTimes(1);
      expect(RoleService.assignGlobalRoleToUser).toHaveBeenCalledWith(
        roleId, 
        assignData.userId, 
        assignData.tenantId
      );

      // Verify the audit log was created
      expect(AuditService.log).toHaveBeenCalledTimes(1);
      expect(AuditService.log).toHaveBeenCalledWith({
        action: 'role.assign',
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        details: {
          roleId,
          roleName: mockRole.name,
          assignedUserId: assignData.userId,
          assignedTenantId: assignData.tenantId
        }
      });
    });

    it('should validate required fields', async () => {
      // Create a mock request with missing required fields
      const assignData = { userId: 'user-123' }; // Missing tenantId
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignData)
      });

      // Call the handler
      const response = await POST(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'userId and tenantId are required' });

      // Verify the services were not called
      expect(RoleService.getGlobalRole).not.toHaveBeenCalled();
      expect(RoleService.assignGlobalRoleToUser).not.toHaveBeenCalled();
      expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should return 404 if role not found', async () => {
      // Mock the role service to return null (role not found)
      RoleService.getGlobalRole.mockResolvedValue(null);

      // Create a mock request with assignment data
      const assignData = { userId: 'user-123', tenantId: 'tenant-123' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignData)
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
      expect(RoleService.assignGlobalRoleToUser).not.toHaveBeenCalled();
      expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock the role service
      const mockRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(mockRole);
      RoleService.assignGlobalRoleToUser.mockRejectedValue(new Error('Database error'));

      // Create a mock request with assignment data
      const assignData = { userId: 'user-123', tenantId: 'tenant-123' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignData)
      });

      // Call the handler
      const response = await POST(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to assign global role' });

      // Verify the services were called
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.assignGlobalRoleToUser).toHaveBeenCalledTimes(1);
      expect(AuditService.log).not.toHaveBeenCalled();
    });
  });
});
