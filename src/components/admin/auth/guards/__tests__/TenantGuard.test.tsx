import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TenantGuard } from '../';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { 
  hasPermissionInTenant,
  hasAnyPermissionInTenant,
  hasAllPermissionsInTenant
} from '../../utils/tenantAccessControl';

// Mock the hooks
jest.mock('../../hooks/useAuth');
jest.mock('@/lib/tenant/use-tenant');
jest.mock('@/lib/tenant-membership-service');
jest.mock('../../utils/tenantAccessControl');

describe('TenantGuard', () => {
  const mockUser = { id: 'user-123', name: 'Test User' };
  const mockTenant = { id: 'tenant-123', name: 'Test Tenant' };
  
  // Helper to set up the most common mocks
  const setupMocks = (options: {
    isAuthenticated: boolean;
    isMember: boolean;
    hasPermission?: boolean;
    hasAnyPermission?: boolean;
    hasAllPermissions?: boolean;
  }) => {
    (useAuth as jest.Mock).mockReturnValue({
      user: options.isAuthenticated ? mockUser : null,
      isAuthenticated: options.isAuthenticated,
    });
    
    (useTenant as jest.Mock).mockReturnValue({
      tenant: mockTenant,
    });
    
    (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(options.isMember);
    
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(options.hasPermission ?? false);
    (hasAnyPermissionInTenant as jest.Mock).mockResolvedValue(options.hasAnyPermission ?? false);
    (hasAllPermissionsInTenant as jest.Mock).mockResolvedValue(options.hasAllPermissions ?? false);
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it.skip($2, () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    
    render(
      <TenantGuard>
        <div>Protected content</div>
      </TenantGuard>
    );
    
    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('should render children when user is a tenant member with no permission requirements', async () => {
    setupMocks({ isAuthenticated: true, isMember: true });
    
    render(
      <TenantGuard>
        <div data-testid="protected-content">Protected content</div>
      </TenantGuard>
    );
    
    // Wait for the async check to complete
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Verify that the tenant membership was checked
    expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id
    );
  });
  
  it('should render fallback when user is not a tenant member', async () => {
    setupMocks({ isAuthenticated: true, isMember: false });
    
    render(
      <TenantGuard fallback={<div data-testid="fallback">Access denied</div>}>
        <div data-testid="protected-content">Protected content</div>
      </TenantGuard>
    );
    
    // Wait for the async check to complete
    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
    
    // Verify that the protected content is not rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  it('should check for specific permission if resourceType and permission are provided', async () => {
    setupMocks({ 
      isAuthenticated: true, 
      isMember: true,
      hasPermission: true
    });
    
    render(
      <TenantGuard 
        resourceType="listing"
        permission="read"
      >
        <div data-testid="protected-content">Protected content</div>
      </TenantGuard>
    );
    
    // Wait for the async permission check to complete
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Verify that the permission was checked
    expect(hasPermissionInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'listing',
      'read',
      undefined
    );
  });
  
  it('should check for any permission if permissions array is provided with requireAll=false', async () => {
    setupMocks({ 
      isAuthenticated: true, 
      isMember: true,
      hasAnyPermission: true
    });
    
    render(
      <TenantGuard 
        resourceType="category"
        permissions={['create', 'update']}
        requireAll={false}
      >
        <div data-testid="protected-content">Protected content</div>
      </TenantGuard>
    );
    
    // Wait for the async permission check to complete
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Verify that the any permission check was used
    expect(hasAnyPermissionInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'category',
      ['create', 'update'],
      undefined
    );
  });
  
  it('should check for all permissions if permissions array is provided with requireAll=true', async () => {
    setupMocks({ 
      isAuthenticated: true, 
      isMember: true,
      hasAllPermissions: true
    });
    
    render(
      <TenantGuard 
        resourceType="user"
        permissions={['read', 'update']}
        requireAll={true}
      >
        <div data-testid="protected-content">Protected content</div>
      </TenantGuard>
    );
    
    // Wait for the async permission check to complete
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Verify that the all permissions check was used
    expect(hasAllPermissionsInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'user',
      ['read', 'update'],
      undefined
    );
  });
  
  it('should handle specific resourceId if provided', async () => {
    setupMocks({ 
      isAuthenticated: true, 
      isMember: true,
      hasPermission: true
    });
    
    render(
      <TenantGuard 
        resourceType="listing"
        permission="update"
        resourceId="listing-123"
      >
        <div data-testid="protected-content">Protected content</div>
      </TenantGuard>
    );
    
    // Wait for the async permission check to complete
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Verify that the permission check included the resource ID
    expect(hasPermissionInTenant).toHaveBeenCalledWith(
      mockUser.id,
      mockTenant.id,
      'listing',
      'update',
      'listing-123'
    );
  });
});