import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { 
  hasPermissionInTenant,
  hasAnyPermissionInTenant,
  hasAllPermissionsInTenant,
  hasGlobalPermissionInTenant,
  getAccessibleResourcesInTenant
} from '@/components/admin/auth/utils/tenantAccessControl';
import { useTenantPermission } from '@/components/admin/auth/hooks/useTenantPermission';

// Mock the hooks and services
jest.mock('@/components/admin/auth/hooks/useAuth');
jest.mock('@/lib/tenant/use-tenant');
jest.mock('@/lib/tenant-membership-service');
jest.mock('@/components/admin/auth/utils/tenantAccessControl');

describe('useTenantPermission', () => {
  const mockUser = { id: 'user-123', name: 'Test User' };
  const mockTenant = { id: 'tenant-123', name: 'Test Tenant' };
  
  // Helper to set up the most common mocks
  const setupMocks = (options: {
    isAuthenticated: boolean;
    isMember: boolean;
  }) => {
    (useAuth as jest.Mock).mockReturnValue({
      user: options.isAuthenticated ? mockUser : null,
      isAuthenticated: options.isAuthenticated,
    });
    
    (useTenant as jest.Mock).mockReturnValue({
      tenant: mockTenant,
    });
    
    (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(options.isMember);
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return isLoading=true initially', () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    
    const { result } = renderHook(() => useTenantPermission());
    
    expect(result.current.isLoading).toBe(true);
  });
  
  it('should check tenant membership on mount', async () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id
    );
    
    expect(result.current.isMember).toBe(true);
  });
  
  it('should set isMember=false when user is not authenticated', async () => {
    setupMocks({ isAuthenticated: false, isMember: false });
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.isMember).toBe(false);
    expect(TenantMembershipService.isTenantMember).not.toHaveBeenCalled();
  });
  
  it('should set isMember=false when membership check fails', async () => {
    setupMocks({ isAuthenticated: true, isMember: false });
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.isMember).toBe(false);
  });
  
  it('should check permission correctly', async () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    let permissionResult;
    await act(async () => {
      permissionResult = await result.current.checkPermission('listing', 'read', 'listing-123');
    });
    
    expect(permissionResult).toBe(true);
    expect(hasPermissionInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'listing',
      'read',
      'listing-123'
    );
  });
  
  it('should not check permission when user is not a member', async () => {
    setupMocks({ isAuthenticated: true, isMember: false });
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    let permissionResult;
    await act(async () => {
      permissionResult = await result.current.checkPermission('listing', 'read');
    });
    
    expect(permissionResult).toBe(false);
    expect(hasPermissionInTenant).not.toHaveBeenCalled();
  });
  
  it('should check any permission correctly', async () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    (hasAnyPermissionInTenant as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    let permissionResult;
    await act(async () => {
      permissionResult = await result.current.checkAnyPermission('category', ['create', 'update']);
    });
    
    expect(permissionResult).toBe(true);
    expect(hasAnyPermissionInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'category',
      ['create', 'update'],
      undefined
    );
  });
  
  it('should check all permissions correctly', async () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    (hasAllPermissionsInTenant as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    let permissionResult;
    await act(async () => {
      permissionResult = await result.current.checkAllPermissions('user', ['read', 'update']);
    });
    
    expect(permissionResult).toBe(true);
    expect(hasAllPermissionsInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'user',
      ['read', 'update'],
      undefined
    );
  });
  
  it('should check global permission correctly', async () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    (hasGlobalPermissionInTenant as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    let permissionResult;
    await act(async () => {
      permissionResult = await result.current.checkGlobalPermission('listing', 'manage');
    });
    
    expect(permissionResult).toBe(true);
    expect(hasGlobalPermissionInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'listing',
      'manage'
    );
  });
  
  it('should get accessible resources correctly', async () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    const mockResourceIds = ['category-1', 'category-2'];
    (getAccessibleResourcesInTenant as jest.Mock).mockResolvedValue(mockResourceIds);
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    let resources;
    await act(async () => {
      resources = await result.current.getAccessibleResources('category', 'update');
    });
    
    expect(resources).toEqual(mockResourceIds);
    expect(getAccessibleResourcesInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'category',
      'update'
    );
  });
  
  it('should return empty array for getAccessibleResources when not a member', async () => {
    setupMocks({ isAuthenticated: true, isMember: false });
    
    const { result } = renderHook(() => useTenantPermission());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    let resources;
    await act(async () => {
      resources = await result.current.getAccessibleResources('category', 'update');
    });
    
    expect(resources).toEqual([]);
    expect(getAccessibleResourcesInTenant).not.toHaveBeenCalled();
  });
});