// Import the mocked modules directly to mock their exports
import * as tenantAccessControl from '../../../utils/tenantAccessControl';

// Mock tenantAccessControl directly
jest.mock('../../../utils/tenantAccessControl');

// Define mock data
export const mockUser = { id: 'user-123', name: 'Test User' };
export const mockTenant = { id: 'tenant-456', name: 'Test Tenant' };

// Export mocked functions for test manipulation
export const mockHasPermissionInTenant = jest.spyOn(tenantAccessControl, 'hasPermissionInTenant');
export const mockHasAnyPermissionInTenant = jest.spyOn(tenantAccessControl, 'hasAnyPermissionInTenant');
export const mockHasAllPermissionsInTenant = jest.spyOn(tenantAccessControl, 'hasAllPermissionsInTenant');

export const setupMocks = () => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Import the useAuth mock and configure it
  const useAuthMock = require('../../../hooks/__mocks__/useAuth').useAuth;
  useAuthMock.mockReturnValue({
    user: mockUser,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null,
    hasPermission: jest.fn().mockReturnValue(true)
  });
  
  // Import the useTenant mock and configure it
  const useTenantMock = require('@/lib/tenant/__mocks__/use-tenant').useTenant;
  useTenantMock.mockReturnValue({
    tenant: mockTenant,
    loading: false,
    error: null,
    setTenant: jest.fn()
  });
  
  // Default to successful permission checks
  mockHasPermissionInTenant.mockResolvedValue(true);
  mockHasAnyPermissionInTenant.mockResolvedValue(true);
  mockHasAllPermissionsInTenant.mockResolvedValue(true);
};