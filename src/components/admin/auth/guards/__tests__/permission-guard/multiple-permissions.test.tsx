import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionGuard } from '../../PermissionGuard';
import { useAuth } from '../../../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import { 
  hasPermissionInTenant,
  hasAnyPermissionInTenant,
  hasAllPermissionsInTenant 
} from '../../../utils/tenantAccessControl';
import { TestWrapper } from './test-wrapper';

// Mock the hooks directly as in TenantGuard tests
jest.mock('../../../hooks/useAuth');
jest.mock('@/lib/tenant/use-tenant');
jest.mock('../../../utils/tenantAccessControl');

// Mock data for consistent testing
const mockUser = { id: 'user-123', name: 'Test User' };
const mockTenant = { id: 'tenant-456', name: 'Test Tenant' };

describe('PermissionGuard - Multiple Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mocks for each test
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null
    });
    
    (useTenant as jest.Mock).mockReturnValue({
      tenant: mockTenant,
      loading: false,
      error: null
    });
    
    // Default behavior for permission checks
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(true);
    (hasAnyPermissionInTenant as jest.Mock).mockResolvedValue(true);
    (hasAllPermissionsInTenant as jest.Mock).mockResolvedValue(true);
  });

  it('should check for any of multiple permissions when requireAll is false', async () => {
    (hasAnyPermissionInTenant as jest.Mock).mockResolvedValue(true);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permissions={['read', 'update']}
          requireAll={false}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should check any permission
    await waitFor(() => {
      expect(hasAnyPermissionInTenant).toHaveBeenCalledWith(
        mockUser.id,
        mockTenant.id,
        'category',
        ['read', 'update'],
        undefined
      );
    });
    
    // Should render children when any permission check passes
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should check for all permissions when requireAll is true', async () => {
    (hasAllPermissionsInTenant as jest.Mock).mockResolvedValue(true);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permissions={['read', 'update']}
          requireAll={true}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should check all permissions
    await waitFor(() => {
      expect(hasAllPermissionsInTenant).toHaveBeenCalledWith(
        mockUser.id,
        mockTenant.id,
        'category',
        ['read', 'update'],
        undefined
      );
    });
    
    // Should render children when all permission checks pass
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should not render children when any permission check fails with requireAll=true', async () => {
    (hasAllPermissionsInTenant as jest.Mock).mockResolvedValue(false);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permissions={['read', 'update', 'delete']}
          requireAll={true}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should check all permissions
    await waitFor(() => {
      expect(hasAllPermissionsInTenant).toHaveBeenCalledWith(
        mockUser.id,
        mockTenant.id,
        'category',
        ['read', 'update', 'delete'],
        undefined
      );
    });
    
    // Should not render children when any permission check fails
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should not render children when all permission checks fail with requireAll=false', async () => {
    (hasAnyPermissionInTenant as jest.Mock).mockResolvedValue(false);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permissions={['update', 'delete']}
          requireAll={false}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should check any permission
    await waitFor(() => {
      expect(hasAnyPermissionInTenant).toHaveBeenCalledWith(
        mockUser.id,
        mockTenant.id,
        'category',
        ['update', 'delete'],
        undefined
      );
    });
    
    // Should not render children when all permission checks fail
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
