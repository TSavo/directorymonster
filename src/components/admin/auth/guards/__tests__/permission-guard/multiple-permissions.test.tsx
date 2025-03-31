import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionGuard } from '../../PermissionGuard';
import { 
  setupMocks, 
  mockHasAnyPermissionInTenant,
  mockHasAllPermissionsInTenant 
} from './setup';

describe('PermissionGuard - Multiple Permissions', () => {
  beforeEach(setupMocks);

  it('should check for any of multiple permissions when requireAll is false', async () => {
    mockHasAnyPermissionInTenant.mockResolvedValue(true);
    
    render(
      <PermissionGuard 
        resourceType="category" 
        permissions={['read', 'update']}
        requireAll={false}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should check any permission
    await waitFor(() => {
      expect(mockHasAnyPermissionInTenant).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
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
    mockHasAllPermissionsInTenant.mockResolvedValue(true);
    
    render(
      <PermissionGuard 
        resourceType="category" 
        permissions={['read', 'update']}
        requireAll={true}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should check all permissions
    await waitFor(() => {
      expect(mockHasAllPermissionsInTenant).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
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
    mockHasAllPermissionsInTenant.mockResolvedValue(false);
    
    render(
      <PermissionGuard 
        resourceType="category" 
        permissions={['read', 'update', 'delete']}
        requireAll={true}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should check all permissions
    await waitFor(() => {
      expect(mockHasAllPermissionsInTenant).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
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
    mockHasAnyPermissionInTenant.mockResolvedValue(false);
    
    render(
      <PermissionGuard 
        resourceType="category" 
        permissions={['update', 'delete']}
        requireAll={false}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should check any permission
    await waitFor(() => {
      expect(mockHasAnyPermissionInTenant).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
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