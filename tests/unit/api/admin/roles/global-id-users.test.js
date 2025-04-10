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
    getUsersWithGlobalRole: jest.fn()
  }
}));

const { NextRequest } = require('next/server');
const { GET } = require('@/app/api/admin/roles/global/[id]/users/route');
const { RoleService } = require('@/lib/role-service');

describe('Global Role Users API', () => {
  const roleId = 'role-123';
  const params = { id: roleId };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/roles/global/[id]/users', () => {
    it('should return users with a specific global role', async () => {
      // Mock the role service
      const mockRole = { id: roleId, name: 'Admin', aclEntries: [] };
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' }
      ];
      RoleService.getGlobalRole.mockResolvedValue(mockRole);
      RoleService.getUsersWithGlobalRole.mockResolvedValue(mockUsers);

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/users`);

      // Call the handler
      const response = await GET(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ users: mockUsers });

      // Verify the services were called
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
      expect(RoleService.getUsersWithGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getUsersWithGlobalRole).toHaveBeenCalledWith(roleId, undefined, undefined);
    });

    it('should return 404 if role not found', async () => {
      // Mock the role service to return null (role not found)
      RoleService.getGlobalRole.mockResolvedValue(null);

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/users`);

      // Call the handler
      const response = await GET(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Global role not found' });

      // Verify the service was called with the correct ID
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getGlobalRole).toHaveBeenCalledWith(roleId);
      expect(RoleService.getUsersWithGlobalRole).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock the role service
      const mockRole = { id: roleId, name: 'Admin', aclEntries: [] };
      RoleService.getGlobalRole.mockResolvedValue(mockRole);
      RoleService.getUsersWithGlobalRole.mockRejectedValue(new Error('Database error'));

      // Create a mock request
      const req = new NextRequest(`http://localhost:3000/api/admin/roles/global/${roleId}/users`);

      // Call the handler
      const response = await GET(req, { params });
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to get users with global role' });

      // Verify the services were called
      expect(RoleService.getGlobalRole).toHaveBeenCalledTimes(1);
      expect(RoleService.getUsersWithGlobalRole).toHaveBeenCalledTimes(1);
    });
  });
});
