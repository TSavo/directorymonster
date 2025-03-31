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

// Mock the hooks directly
jest.mock('../../../hooks/useAuth');
jest.mock('@/lib/tenant/use-tenant');
jest.mock('../../../utils/tenantAccessControl');

// Mock data for consistent testing
const mockUser = { id: 'user-123', name: 'Test User' };
const mockTenant = { id: 'tenant-456', name: 'Test Tenant' };

// Create specific mock hooks for tests
const mockUseAuthWithoutUser = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null
};

const mockUseTenantWithoutTenant = {
  tenant: null,
  loading: false,
  error: null
};

const mockUseAuthLoading = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: true,
  error: null
};

describe('PermissionGuard - Error Handling and Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default mock return values
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

  it('should handle missing user', async () => {
    // Override the default mock for this specific test
    (useAuth as jest.Mock).mockReturnValue(mockUseAuthWithoutUser);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permission="read"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should not check permissions if user is missing
    await waitFor(() => {
      expect(hasPermissionInTenant).not.toHaveBeenCalled();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should handle missing tenant', async () => {
    // Override the default mock for this specific test
    (useTenant as jest.Mock).mockReturnValue(mockUseTenantWithoutTenant);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permission="read"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should not check permissions if tenant is missing
    await waitFor(() => {
      expect(hasPermissionInTenant).not.toHaveBeenCalled();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should handle permission check errors', async () => {
    (hasPermissionInTenant as jest.Mock).mockRejectedValue(new Error('Permission check failed'));
    
    // Suppress console.error for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <TestWrapper>
        <PermissionGuard resourceType="category" permission="read">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should handle error and deny access
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
    
    // Restore console.error
    jest.restoreAllMocks();
  });

  it('should handle empty permissions array', async () => {
    (hasPermissionInTenant as jest.Mock).mockResolvedValue(true);
    
    render(
      <TestWrapper>
        <PermissionGuard resourceType="category" permissions={[]}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should default to checking read permission
    await waitFor(() => {
      expect(hasPermissionInTenant).toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
  
  it('should handle auth loading state', async () => {
    // Override the default mock for this specific test
    (useAuth as jest.Mock).mockReturnValue(mockUseAuthLoading);
    
    render(
      <TestWrapper>
        <PermissionGuard 
          resourceType="category" 
          permission="read"
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>
      </TestWrapper>
    );
    
    // Should not render protected content when auth is loading
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
