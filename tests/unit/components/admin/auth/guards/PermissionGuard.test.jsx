/**
 * Unit tests for PermissionGuard component
 */

const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const { PermissionGuard } = require('@/components/admin/auth/guards/PermissionGuard');
const { useAuth } = require('@/components/admin/auth/hooks/useAuth');
const { useTenant } = require('@/lib/tenant/use-tenant');
const RoleService = require('@/lib/role-service').default;
const { ResourceType, Permission } = require('@/components/admin/auth/utils/accessControl');

// Mock the hooks properly
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/lib/tenant/use-tenant', () => ({
  useTenant: jest.fn()
}));

jest.mock('@/lib/role-service', () => ({
  __esModule: true,
  default: {
    hasPermission: jest.fn()
  }
}));

describe('PermissionGuard', () => {
  // Test data
  const testUser = { id: 'user-123', name: 'Test User' };
  const testTenant = { id: 'tenant-456', name: 'Test Tenant' };
  const testResourceType = 'category';
  const testPermission = 'create';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock hooks with default values
    useAuth.mockReturnValue({
      user: testUser,
      isAuthenticated: true,
    });
    
    useTenant.mockReturnValue({
      tenant: testTenant,
    });
    
    // Mock RoleService
    RoleService.hasPermission.mockResolvedValue(true);
  });
  
  it('should render children when user has permission', async () => {
    // Arrange
    const testContent = 'Protected Content';
    
    // Act
    render(
      <PermissionGuard
        resourceType={testResourceType}
        permission={testPermission}
      >
        <div>{testContent}</div>
      </PermissionGuard>
    );
    
    // First it should not render anything (loading)
    expect(screen.queryByText(testContent)).not.toBeInTheDocument();
    
    // Then it should show the content
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Assert service was called with correct params
    expect(RoleService.hasPermission).toHaveBeenCalledWith(
      testUser.id,
      testTenant.id,
      testResourceType,
      testPermission,
      undefined
    );
  });
  
  it('should not render children when user lacks permission', async () => {
    // Arrange
    RoleService.hasPermission.mockResolvedValue(false);
    const testContent = 'Protected Content';
    
    // Act
    render(
      <PermissionGuard
        resourceType={testResourceType}
        permission={testPermission}
      >
        <div>{testContent}</div>
      </PermissionGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.queryByText(testContent)).not.toBeInTheDocument();
    });
  });
  
  it('should render fallback when user lacks permission', async () => {
    // Arrange
    RoleService.hasPermission.mockResolvedValue(false);
    const testContent = 'Protected Content';
    const fallbackContent = 'Fallback Content';
    
    // Act
    render(
      <PermissionGuard
        resourceType={testResourceType}
        permission={testPermission}
        fallback={<div>{fallbackContent}</div>}
      >
        <div>{testContent}</div>
      </PermissionGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.queryByText(testContent)).not.toBeInTheDocument();
      expect(screen.getByText(fallbackContent)).toBeInTheDocument();
    });
  });
  
  it('should check specific resource ID when provided', async () => {
    // Arrange
    const resourceId = 'resource-789';
    
    // Act
    render(
      <PermissionGuard
        resourceType={testResourceType}
        permission={testPermission}
        resourceId={resourceId}
      >
        <div>Protected Content</div>
      </PermissionGuard>
    );
    
    // Assert service was called with resource ID
    await waitFor(() => {
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        testUser.id,
        testTenant.id,
        testResourceType,
        testPermission,
        resourceId
      );
    });
  });
  
  it('should not render when user is not authenticated', async () => {
    // Arrange
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });
    
    // Act
    render(
      <PermissionGuard
        resourceType={testResourceType}
        permission={testPermission}
      >
        <div>Protected Content</div>
      </PermissionGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
    });
  });
  
  it('should handle service errors gracefully', async () => {
    // Arrange
    RoleService.hasPermission.mockRejectedValue(new Error('Service error'));
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Act
    render(
      <PermissionGuard
        resourceType={testResourceType}
        permission={testPermission}
      >
        <div>Protected Content</div>
      </PermissionGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    // Restore console.error
    consoleSpy.mockRestore();
  });
});
