import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionGuard } from '../../PermissionGuard';
import { useAuth } from '../../../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import { hasPermissionInTenant } from '../../../utils/tenantAccessControl';
import { TestWrapper } from './test-wrapper';

// Mock the hooks directly
jest.mock('../../../hooks/useAuth');
jest.mock('@/lib/tenant/use-tenant');
jest.mock('../../../utils/tenantAccessControl');

// Mock data for consistent testing
const mockUser = { id: 'user-123', name: 'Test User' };
const mockTenant = { id: 'tenant-456', name: 'Test Tenant' };

describe('PermissionGuard - UI Behavior', () => {
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

  it('should render fallback content when user lacks permission', async () => {
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(false);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permission="update"
          fallback={<div data-testid="fallback-content">Access Denied</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should render fallback content
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });
  });

  it('should show loading indicator when loading and showLoading is true', async () => {
    // Don't resolve the permission check yet
    const permissionPromise = new Promise<boolean>(resolve => {
      // Resolve after some time to keep the component in loading state
      setTimeout(() => resolve(true), 100);
    });
    (hasPermissionInTenant as jest.Mock).mockReturnValue(permissionPromise);
    
    const { container } = render(
      <TestWrapper>
        <PermissionGuard resourceType="category" permission="read" showLoading={true}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should show loading indicator - the spinner doesn't have a role
    // Use container query to find the spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
    
    // Wait for permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should render nothing when silent is true and permission is denied', async () => {
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(false);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permission="update"
          fallback={<div data-testid="fallback-content">Access Denied</div>}
          silent={true}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should render neither children nor fallback
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
    });
  });

  it('should not show loading indicator when showLoading is false', async () => {
    // Don't resolve the permission check yet
    const permissionPromise = new Promise<boolean>(resolve => {
      // Resolve after some time to keep the component in loading state
      setTimeout(() => resolve(true), 100);
    });
    (hasPermissionInTenant as jest.Mock).mockReturnValue(permissionPromise);
    
    const { container } = render(
      <TestWrapper>
        <PermissionGuard resourceType="category" permission="read" showLoading={false}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should not show loading indicator
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeNull();
    
    // Should show nothing initially
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    
    // Wait for permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    }, { timeout: 200 });
  });
});
