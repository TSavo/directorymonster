/**
 * Mock for RoleService
 */

export const mockCreateRole = jest.fn().mockResolvedValue({
  id: 'test-role-id',
  name: 'Test Role',
  description: 'Test role description',
  tenantId: 'test-tenant',
  isGlobal: false,
  permissions: ['read:test']
});

export const mockUpdateRole = jest.fn().mockResolvedValue({
  id: 'test-role-id',
  name: 'Updated Role',
  description: 'Updated description',
  tenantId: 'test-tenant',
  isGlobal: false,
  permissions: ['read:test', 'write:test']
});

export const mockDeleteRole = jest.fn().mockResolvedValue(true);

export const mockCreateGlobalRole = jest.fn().mockResolvedValue({
  id: 'global-role-id',
  name: 'Global Role',
  description: 'Global role description',
  tenantId: 'system',
  isGlobal: true,
  permissions: ['read:global']
});

export const mockUpdateGlobalRole = jest.fn().mockResolvedValue({
  id: 'global-role-id',
  name: 'Updated Global Role',
  description: 'Updated global description',
  tenantId: 'system',
  isGlobal: true,
  permissions: ['read:global', 'write:global']
});

export const mockDeleteGlobalRole = jest.fn().mockResolvedValue(true);
export const mockAssignRoleToUser = jest.fn().mockResolvedValue(true);
export const mockRemoveRoleFromUser = jest.fn().mockResolvedValue(true);
export const mockGetRole = jest.fn();

// Mock the RoleService
jest.mock('@/lib/role-service', () => ({
  RoleService: {
    createRole: mockCreateRole,
    updateRole: mockUpdateRole,
    deleteRole: mockDeleteRole,
    createGlobalRole: mockCreateGlobalRole,
    updateGlobalRole: mockUpdateGlobalRole,
    deleteGlobalRole: mockDeleteGlobalRole,
    assignRoleToUser: mockAssignRoleToUser,
    removeRoleFromUser: mockRemoveRoleFromUser,
    getRole: mockGetRole
  }
}));
