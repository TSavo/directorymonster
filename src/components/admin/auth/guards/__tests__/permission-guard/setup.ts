import { useAuth } from '../../../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import * as tenantAccessControl from '../../../utils/tenantAccessControl';

// Mock the hooks and utility functions
jest.mock('../../../hooks/useAuth');
jest.mock('@/lib/tenant/use-tenant');
jest.mock('../../../utils/tenantAccessControl');

// Setup mocks
export const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
export const mockUseTenant = useTenant as jest.MockedFunction<typeof useTenant>;
export const mockHasPermissionInTenant = jest.spyOn(tenantAccessControl, 'hasPermissionInTenant');
export const mockHasAnyPermissionInTenant = jest.spyOn(tenantAccessControl, 'hasAnyPermissionInTenant');
export const mockHasAllPermissionsInTenant = jest.spyOn(tenantAccessControl, 'hasAllPermissionsInTenant');

export const setupMocks = () => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Default mock values
  mockUseAuth.mockReturnValue({
    user: { id: 'user-123', name: 'Test User' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null
  });
  
  mockUseTenant.mockReturnValue({
    tenant: { id: 'tenant-456', name: 'Test Tenant' },
    loading: false,
    error: null
  });
  
  mockHasPermissionInTenant.mockResolvedValue(true);
  mockHasAnyPermissionInTenant.mockResolvedValue(true);
  mockHasAllPermissionsInTenant.mockResolvedValue(true);
};