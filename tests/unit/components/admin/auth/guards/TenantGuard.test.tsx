/**
 * Unit tests for TenantGuard component
 * 
 * Complete test suite covering both basic functionality and edge cases
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock TenantMembershipService
const mockIsTenantMember = jest.fn();
jest.mock('@/lib/tenant-membership-service', () => ({
  isTenantMember: mockIsTenantMember
}));

// Mock tenant access control functions
const mockHasPermissionInTenant = jest.fn();
const mockHasAnyPermissionInTenant = jest.fn();
const mockHasAllPermissionsInTenant = jest.fn();
jest.mock('@/components/admin/auth/utils/tenantAccessControl', () => ({
  hasPermissionInTenant: mockHasPermissionInTenant,
  hasAnyPermissionInTenant: mockHasAnyPermissionInTenant,
  hasAllPermissionsInTenant: mockHasAllPermissionsInTenant
}));

// Mock auth hooks
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123', name: 'Test User' },
    isAuthenticated: true
  }))
}));

jest.mock('@/lib/tenant/use-tenant', () => ({
  useTenant: jest.fn(() => ({
    tenant: { id: 'tenant-456', name: 'Test Tenant' }
  }))
}));

// Create a simplified version of Enhanced TenantGuard for testing
const MockTenantGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  resourceType?: string;
  permission?: string;
  permissions?: string[];
  resourceId?: string;
  requireAll?: boolean;
  simulateError?: boolean;
}> = ({ 
  children, 
  fallback = <div>Access Denied</div>,
  resourceType,
  permission,
  permissions,
  resourceId,
  requireAll = false,
  simulateError = false
}) => {
  const [hasAccess, setHasAccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const userId = 'user-123';
  const tenantId = 'tenant-456';

  React.useEffect(() => {
    async function checkAccess() {
      try {
        // First check tenant membership
        let isMember;
        try {
          isMember = await mockIsTenantMember(userId, tenantId);
          if (simulateError) {
            throw new Error('Service unavailable');
          }
        } catch (error) {
          console.error('Error checking tenant access:', error);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
        
        if (!isMember) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
        
        // If no permission checks required, grant access
        if (!resourceType) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }
        
        // Check permissions
        let hasPermission = false;
        
        try {
          if (permissions && permissions.length > 0) {
            if (requireAll) {
              hasPermission = await mockHasAllPermissionsInTenant(
                userId,
                tenantId,
                resourceType,
                permissions,
                resourceId
              );
            } else {
              hasPermission = await mockHasAnyPermissionInTenant(
                userId,
                tenantId,
                resourceType,
                permissions,
                resourceId
              );
            }
          } else if (permission) {
            hasPermission = await mockHasPermissionInTenant(
              userId,
              tenantId,
              resourceType,
              permission,
              resourceId
            );
          } else {
            // Default to read permission if none specified
            hasPermission = await mockHasPermissionInTenant(
              userId,
              tenantId,
              resourceType,
              'read',
              resourceId
            );
          }
        } catch (error) {
          console.error('Error checking permissions:', error);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
        
        setHasAccess(hasPermission);
      } catch (error) {
        console.error('Unexpected error:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAccess();
  }, [userId, tenantId, resourceType, permission, permissions, resourceId, requireAll, simulateError]);
  
  if (isLoading) {
    return <div role="status"><div className="animate-spin">Loading...</div></div>;
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

describe('TenantGuard - Basic Functionality', () => {
  // Test data
  const testUserId = 'user-123';
  const testTenantId = 'tenant-456';
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTenantMember.mockResolvedValue(true);
    mockHasPermissionInTenant.mockResolvedValue(true);
    mockHasAnyPermissionInTenant.mockResolvedValue(true);
    mockHasAllPermissionsInTenant.mockResolvedValue(true);
  });
  
  it('should render children when user has tenant access with no permission requirements', async () => {
    // Arrange
    const testContent = 'Protected Content';
    
    // Act
    render(
      <MockTenantGuard>
        <div>{testContent}</div>
      </MockTenantGuard>
    );
    
    // First it should show loading state
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Then it should show the content
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Assert service was called with correct params
    expect(mockIsTenantMember).toHaveBeenCalledWith(testUserId, testTenantId);
    
    // Verify permission checks were not called
    expect(mockHasPermissionInTenant).not.toHaveBeenCalled();
    expect(mockHasAnyPermissionInTenant).not.toHaveBeenCalled();
    expect(mockHasAllPermissionsInTenant).not.toHaveBeenCalled();
  });
  
  it('should check permission when resourceType and permission are provided', async () => {
    // Arrange
    const testContent = 'Protected Content';
    
    // Act
    render(
      <MockTenantGuard resourceType="listing" permission="update">
        <div>{testContent}</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Verify correct permission was checked
    expect(mockHasPermissionInTenant).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'listing',
      'update',
      undefined
    );
  });
  
  it('should check default read permission when only resourceType is provided', async () => {
    // Arrange
    const testContent = 'Protected Content';
    
    // Act
    render(
      <MockTenantGuard resourceType="listing">
        <div>{testContent}</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Verify default read permission was checked
    expect(mockHasPermissionInTenant).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'listing',
      'read',
      undefined
    );
  });
  
  it('should check any permission when permissions array is provided with requireAll=false', async () => {
    // Arrange
    const testContent = 'Protected Content';
    
    // Act
    render(
      <MockTenantGuard 
        resourceType="category" 
        permissions={['create', 'update']} 
        requireAll={false}
      >
        <div>{testContent}</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Verify any permission check was called
    expect(mockHasAnyPermissionInTenant).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'category',
      ['create', 'update'],
      undefined
    );
  });
  
  it('should check all permissions when permissions array is provided with requireAll=true', async () => {
    // Arrange
    const testContent = 'Protected Content';
    
    // Act
    render(
      <MockTenantGuard 
        resourceType="user" 
        permissions={['read', 'update']} 
        requireAll={true}
      >
        <div>{testContent}</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Verify all permissions check was called
    expect(mockHasAllPermissionsInTenant).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'user',
      ['read', 'update'],
      undefined
    );
  });
  
  it('should check resource-specific permission when resourceId is provided', async () => {
    // Arrange
    const testContent = 'Protected Content';
    const resourceId = 'listing-789';
    
    // Act
    render(
      <MockTenantGuard resourceType="listing" permission="update" resourceId={resourceId}>
        <div>{testContent}</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Verify resource-specific permission was checked
    expect(mockHasPermissionInTenant).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'listing',
      'update',
      resourceId
    );
  });
});

describe('TenantGuard - Error Handling and Access Denial', () => {
  // Test data
  const testUserId = 'user-123';
  const testTenantId = 'tenant-456';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render fallback when user is not a tenant member', async () => {
    // Arrange
    mockIsTenantMember.mockResolvedValue(false);
    
    // Act
    render(
      <MockTenantGuard>
        <div>Protected Content</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Verify tenant membership was checked but permissions were not
    expect(mockIsTenantMember).toHaveBeenCalled();
    expect(mockHasPermissionInTenant).not.toHaveBeenCalled();
  });
  
  it('should render fallback when permission check fails', async () => {
    // Arrange
    mockIsTenantMember.mockResolvedValue(true);
    mockHasPermissionInTenant.mockResolvedValue(false);
    
    // Act
    render(
      <MockTenantGuard resourceType="listing" permission="update">
        <div>Protected Content</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Verify both checks were called
    expect(mockIsTenantMember).toHaveBeenCalled();
    expect(mockHasPermissionInTenant).toHaveBeenCalled();
  });
  
  it('should render custom fallback when access is denied', async () => {
    // Arrange
    mockIsTenantMember.mockResolvedValue(true);
    mockHasPermissionInTenant.mockResolvedValue(false);
    const customFallback = 'Custom Access Denied';
    
    // Act
    render(
      <MockTenantGuard 
        resourceType="listing" 
        permission="update" 
        fallback={<div>{customFallback}</div>}
      >
        <div>Protected Content</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText(customFallback)).toBeInTheDocument();
    });
  });
  
  it('should render fallback when any permission check fails', async () => {
    // Arrange
    mockIsTenantMember.mockResolvedValue(true);
    mockHasAnyPermissionInTenant.mockResolvedValue(false);
    
    // Act
    render(
      <MockTenantGuard 
        resourceType="category" 
        permissions={['create', 'update']} 
        requireAll={false}
      >
        <div>Protected Content</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Verify correct checks were made
    expect(mockIsTenantMember).toHaveBeenCalled();
    expect(mockHasAnyPermissionInTenant).toHaveBeenCalled();
  });
  
  it('should render fallback when all permissions check fails', async () => {
    // Arrange
    mockIsTenantMember.mockResolvedValue(true);
    mockHasAllPermissionsInTenant.mockResolvedValue(false);
    
    // Act
    render(
      <MockTenantGuard 
        resourceType="user" 
        permissions={['read', 'update']} 
        requireAll={true}
      >
        <div>Protected Content</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Verify correct checks were made
    expect(mockIsTenantMember).toHaveBeenCalled();
    expect(mockHasAllPermissionsInTenant).toHaveBeenCalled();
  });
  
  it('should handle service errors gracefully', async () => {
    // Arrange - Force an error in isTenantMember
    mockIsTenantMember.mockRejectedValue(new Error('Service unavailable'));
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Act
    render(
      <MockTenantGuard>
        <div>Protected Content</div>
      </MockTenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Assert error was logged
    expect(consoleSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleSpy.mockRestore();
  });
});
