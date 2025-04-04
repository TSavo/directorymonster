/**
 * Direct mock for RoleService
 */

export const mockGetRole = jest.fn();

// Mock the RoleService
jest.mock('@/lib/role-service', () => {
  const originalModule = jest.requireActual('@/lib/role-service');
  return {
    ...originalModule,
    RoleService: {
      ...originalModule.RoleService,
      getRole: mockGetRole,
      getUserRoles: originalModule.RoleService.getUserRoles
    }
  };
});
