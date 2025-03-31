import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionGuard } from '../../PermissionGuard';
import { useAuth } from '../../../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import { hasPermissionInTenant } from '../../../utils/tenantAccessControl';
import { TestWrapper } from './test-wrapper';

// Mock the hooks directly as in TenantGuard tests
jest.mock('../../../hooks/useAuth');
jest.mock('@/lib/tenant/use-tenant');
jest.mock('../../../utils/tenantAccessControl');

// Mock data for consistent testing
const mockUser = { id: 'user-123', name: 'Test User' };
const mockTenant = { id: 'tenant-456', name: 'Test Tenant' };

describe('PermissionGuard - Basic Permission Checks', () => {
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
  });

  it('should render children when user has the required permission', async () => {
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(true);
    
    render(
      <TestWrapper>
        <PermissionGuard resourceType="category" permission="read">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should check permission with correct parameters
    await waitFor(() => {
      expect(hasPermissionInTenant).toHaveBeenCalledWith(
        mockUser.id,
        mockTenant.id,
        'category',
        'read',
        undefined
      );
    });
    
    // Should render children when permission check passes
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should not render children when user lacks permission', async () => {
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(false);
    
    render(
      <TestWrapper>
        <PermissionGuard resourceType="category" permission="update">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should check permission
    await waitFor(() => {
      expect(hasPermissionInTenant).toHaveBeenCalledWith(
        mockUser.id,
        mockTenant.id,
        'category',
        'update',
        undefined
      );
    });
    
    // Should not render children when permission check fails
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should default to "read" permission if none specified', async () => {
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(true);
    
    render(
      <TestWrapper>
        <PermissionGuard resourceType="category">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should check with read permission by default
    await waitFor(() => {
      expect(hasPermissionInTenant).toHaveBeenCalledWith(
        mockUser.id,
        mockTenant.id,
        'category',
        'read',
        undefined
      );
    });
    
    // Should render children when permission check passes
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should check resource-specific permissions', async () => {
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(true);
    
    render(
      <TestWrapper>
        <PermissionGuard resourceType="listing" permission="update" resourceId="listing-789">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should check permission with specific resource ID
    await waitFor(() => {
      expect(hasPermissionInTenant).toHaveBeenCalledWith(
        mockUser.id,
        mockTenant.id,
        'listing',
        'update',
        'listing-789'
      );
    });
    
    // Should render children when permission check passes
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
