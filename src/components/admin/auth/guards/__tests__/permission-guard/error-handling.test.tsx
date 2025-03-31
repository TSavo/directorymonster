import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionGuard } from '../../PermissionGuard';
import { 
  setupMocks, 
  mockUseAuth,
  mockUseTenant,
  mockHasPermissionInTenant 
} from './setup';

describe('PermissionGuard - Error Handling and Edge Cases', () => {
  beforeEach(setupMocks);

  it('should handle missing user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });
    
    render(
      <PermissionGuard resourceType="category" permission="read">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should not check permissions if user is missing
    await waitFor(() => {
      expect(mockHasPermissionInTenant).not.toHaveBeenCalled();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should handle missing tenant', async () => {
    mockUseTenant.mockReturnValue({
      tenant: null,
      loading: false,
      error: null
    });
    
    render(
      <PermissionGuard resourceType="category" permission="read">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should not check permissions if tenant is missing
    await waitFor(() => {
      expect(mockHasPermissionInTenant).not.toHaveBeenCalled();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should handle permission check errors', async () => {
    mockHasPermissionInTenant.mockRejectedValue(new Error('Permission check failed'));
    
    // Suppress console.error for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <PermissionGuard resourceType="category" permission="read">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should handle error and deny access
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
    
    // Restore console.error
    jest.restoreAllMocks();
  });

  it('should handle empty permissions array', async () => {
    mockHasPermissionInTenant.mockResolvedValue(true);
    
    render(
      <PermissionGuard resourceType="category" permissions={[]}>
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should default to checking read permission
    await waitFor(() => {
      expect(mockHasPermissionInTenant).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
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
  
  it('should handle auth loading state', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      loading: true,
      error: null
    });
    
    render(
      <PermissionGuard resourceType="category" permission="read">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should not render protected content when auth is loading
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});