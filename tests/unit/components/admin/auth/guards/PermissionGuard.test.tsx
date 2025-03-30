/**
 * Unit tests for PermissionGuard component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { PermissionGuard } from '@/components/admin/auth/guards/PermissionGuard';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import RoleService from '@/lib/role-service';

// Mock the hooks and services
jest.mock('@/components/admin/auth/hooks/useAuth');
jest.mock('@/lib/tenant/use-tenant');
jest.mock('@/lib/role-service');

describe('PermissionGuard', () => {
  // Test data
  const testUser = { id: 'user-123', name: 'Test User' };
  const testTenant = { id: 'tenant-456', name: 'Test Tenant' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock hooks with default values
    (useAuth as jest.Mock).mockReturnValue({
      user: testUser,
      isAuthenticated: true,
    });
    
    (useTenant as jest.Mock).mockReturnValue({
      tenant: testTenant,
    });
    
    // Mock RoleService
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
  });
  
  it('should render children when user has required permission', async () => {
    // Arrange
    const testContent = 'Authorized Content';
    
    // Act
    render(
      <PermissionGuard
        resourceType="category"
        permission="create"
      >
        <div>{testContent}</div>
      </PermissionGuard>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Assert service was called with correct params
    expect(RoleService.hasPermission).toHaveBeenCalledWith(
      testUser.id,
      testTenant.id,
      'category',
      'create',
      undefined
    );
  });
  
  it('should not render children when user does not have permission', async () => {
    // Arrange
    const testContent = 'Authorized Content';
    const fallbackContent = 'Fallback Content';
    
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);
    
    // Act
    render(
      <PermissionGuard
        resourceType="category"
        permission="create"
        fallback={<div>{fallbackContent}</div>}
      >
        <div>{testContent}</div>
      </PermissionGuard>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText(testContent)).not.toBeInTheDocument();
      expect(screen.getByText(fallbackContent)).toBeInTheDocument();
    });
  });
  
  it('should check permission with specific resource ID', async () => {
    // Arrange
    const resourceId = 'resource-789';
    
    // Act
    render(
      <PermissionGuard
        resourceType="category"
        permission="update"
        resourceId={resourceId}
      >
        <div>Authorized Content</div>
      </PermissionGuard>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        testUser.id,
        testTenant.id,
        'category',
        'update',
        resourceId
      );
    });
  });
  
  it('should render nothing as fallback by default', async () => {
    // Arrange
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);
    
    // Act
    render(
      <PermissionGuard
        resourceType="category"
        permission="create"
      >
        <div>Authorized Content</div>
      </PermissionGuard>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText('Authorized Content')).not.toBeInTheDocument();
    });
    
    // The component should be empty
    expect(document.body.textContent).toBe('');
  });
  
  it('should not render anything while loading', async () => {
    // Arrange - create a never-resolving promise
    (RoleService.hasPermission as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    // Act
    render(
      <PermissionGuard
        resourceType="category"
        permission="create"
      >
        <div>Authorized Content</div>
      </PermissionGuard>
    );
    
    // The component should be empty while loading
    expect(document.body.textContent).toBe('');
  });
  
  it('should handle service errors gracefully', async () => {
    // Arrange
    (RoleService.hasPermission as jest.Mock).mockRejectedValue(
      new Error('Service error')
    );
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Act
    render(
      <PermissionGuard
        resourceType="category"
        permission="create"
      >
        <div>Authorized Content</div>
      </PermissionGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.queryByText('Authorized Content')).not.toBeInTheDocument();
    });
    
    // Assert error was logged
    expect(consoleSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleSpy.mockRestore();
  });
});
