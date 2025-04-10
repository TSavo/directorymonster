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
    updateGlobalRole: jest.fn(),
    deleteGlobalRole: jest.fn()
  }
}));

// Mock the audit service
jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    log: jest.fn()
  }
}));

const { NextRequest } = require('next/server');
const { GET, PATCH, DELETE } = require('@/app/api/admin/roles/global/[id]/route');
const { RoleService } = require('@/lib/role-service');
const { AuditService } = require('@/lib/audit/audit-service');

describe('Global Role by ID API', () => {
  const roleId = 'role-123';
  const params = { id: roleId };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/roles/global/[id]', () => {
    it('should return a global role by ID', async () => {
      // Mock the role service to return a role
      const mockRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(mockRole);

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`);

      // Call the handler
      const response = await GET(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ role: mockRole });

      // Verify the service was called with the correct ID
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
    });

    it('should return 404 if role not found', async () => {
      // Mock the role service to return null (role not found)
      RoleService.getGlobalRole.mockResolvedValue(null);

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`);

      // Call the handler
      const response = await GET(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Global role not found' });

      // Verify the service was called with the correct ID
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
    });

    it('should handle errors', async () => {
      // Mock the role service to throw an error
      RoleService.getGlobalRole.mockRejectedValue(new Error('Database error'));

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`);

      // Call the handler
      const response = await GET(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to retrieve global role' });

      // Verify the service was called with the correct ID
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
    });
  });

  describe('PATCH /api/admin/roles/global/[id]', () => {
    it('should update a global role', async () => {
      // Mock the role service to return roles
      const existingRole = { id: roleId, name: 'Admin', aclEntries: [] };
      const updatedRole = { id: roleId, name: 'Super Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(existingRole);
      RoleService.updateGlobalRole.mockResolvedValue(updatedRole);

      // Create a mock request with update data
      const updateData = { name: 'Super Admin' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      // Call the handler
      const response = await PATCH(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ role: updatedRole });

      // Verify the services were called with the correct data
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
      expect(RoleService.updateGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.updateGlobalRole).toHaveBeenCalledWith(roleId, updateData);

      // Verify the audit log was created
      expect(AuditService.log).toHaveBeenCalledTimes(1);
      expect(AuditService.log).toHaveBeenCalledWith({
        action: 'role.update',
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        details: {
          roleId,
          roleName: existingRole.name,
          updates: updateData
        }
      });
    });

    it('should return 404 if role not found', async () => {
      // Mock the role service to return null (role not found)
      RoleService.getGlobalRole.mockResolvedValue(null);

      // Create a mock request with update data
      const updateData = { name: 'Super Admin' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      // Call the handler
      const response = await PATCH(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Global role not found' });

      // Verify the service was called with the correct ID
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
      expect(RoleService.updateGlobalRole).not.toHaveBeenCalled();
      expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock the role service
      const existingRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(existingRole);
      RoleService.updateGlobalRole.mockRejectedValue(new Error('Database error'));

      // Create a mock request with update data
      const updateData = { name: 'Super Admin' };
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      // Call the handler
      const response = await PATCH(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update global role' });

      // Verify the services were called
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.updateGlobalRole).toHaveBeenCalledTimes(1);
      expect(AuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/roles/global/[id]', () => {
    it('should delete a global role', async () => {
      // Mock the role service
      const existingRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(existingRole);
      RoleService.deleteGlobalRole.mockResolvedValue(true);

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`, {
        method: 'DELETE'
      });

      // Call the handler
      const response = await DELETE(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });

      // Verify the services were called
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
      expect(RoleService.deleteGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.deleteGlobalRole).toHaveBeenCalledWith(roleId);

      // Verify the audit log was created
      expect(AuditService.log).toHaveBeenCalledTimes(1);
      expect(AuditService.log).toHaveBeenCalledWith({
        action: 'role.delete',
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        details: {
          roleId,
          roleName: existingRole.name
        }
      });
    });

    it('should return 404 if role not found', async () => {
      // Mock the role service to return null (role not found)
      RoleService.getGlobalRole.mockResolvedValue(null);

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`, {
        method: 'DELETE'
      });

      // Call the handler
      const response = await DELETE(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Global role not found' });

      // Verify the service was called with the correct ID
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
      expect(RoleService.deleteGlobalRole).not.toHaveBeenCalled();
      expect(AuditService.log).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock the role service
      const existingRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(existingRole);
      RoleService.deleteGlobalRole.mockRejectedValue(new Error('Database error'));

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}`, {
        method: 'DELETE'
      });

      // Call the handler
      const response = await DELETE(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete global role' });

      // Verify the services were called
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.deleteGlobalRole).toHaveBeenCalledTimes(1);
      expect(AuditService.log).not.toHaveBeenCalled();
    });
  });
});
