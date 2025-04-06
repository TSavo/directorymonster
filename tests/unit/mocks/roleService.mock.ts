// Mock for RoleService
import { ResourceType, Permission } from '../../../src/lib/role/types';

// Create mock functions
export const mockHasPermission = jest.fn().mockResolvedValue(true);
export const mockRoleHasSitePermission = jest.fn().mockResolvedValue(true);
export const mockGetAccessibleResources = jest.fn().mockResolvedValue([]);
export const mockDetectCrossTenantOrSiteAccess = jest.fn().mockResolvedValue(false);

// Create the mock RoleService object that matches the real one's structure
const mockRoleService = {
  hasPermission: mockHasPermission,
  roleHasSitePermission: mockRoleHasSitePermission,
  getAccessibleResources: mockGetAccessibleResources,
  detectCrossTenantOrSiteAccess: mockDetectCrossTenantOrSiteAccess,
  
  // Add any other methods that might be used
  getRolesForUser: jest.fn().mockResolvedValue([]),
  getUsersWithRole: jest.fn().mockResolvedValue([]),
  assignRoleToUser: jest.fn().mockResolvedValue(true),
  removeRoleFromUser: jest.fn().mockResolvedValue(true),
  createRole: jest.fn().mockResolvedValue({ id: 'mock-role-id' }),
  updateRole: jest.fn().mockResolvedValue(true),
  deleteRole: jest.fn().mockResolvedValue(true),
  getRoleById: jest.fn().mockResolvedValue({ id: 'mock-role-id', name: 'Mock Role' }),
  getAllRoles: jest.fn().mockResolvedValue([])
};

export default mockRoleService;
