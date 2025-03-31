import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionGuard } from '../../PermissionGuard';
import { 
  setupMocks, 
  mockHasPermissionInTenant 
} from './setup';

describe('PermissionGuard - Basic Permission Checks', () => {
  beforeEach(setupMocks);

  it('should render children when user has the required permission', async () => {
    mockHasPermissionInTenant.mockResolvedValue(true);
    
    render(
      <PermissionGuard resourceType="category" permission="read">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should check permission with correct parameters
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

  it('should not render children when user lacks permission', async () => {
    mockHasPermissionInTenant.mockResolvedValue(false);
    
    render(
      <PermissionGuard resourceType="category" permission="update">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should check permission
    await waitFor(() => {
      expect(mockHasPermissionInTenant).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
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
    mockHasPermissionInTenant.mockResolvedValue(true);
    
    render(
      <PermissionGuard resourceType="category">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should check with read permission by default
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

  it('should check resource-specific permissions', async () => {
    mockHasPermissionInTenant.mockResolvedValue(true);
    
    render(
      <PermissionGuard resourceType="listing" permission="update" resourceId="listing-789">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should check permission with specific resource ID
    await waitFor(() => {
      expect(mockHasPermissionInTenant).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
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