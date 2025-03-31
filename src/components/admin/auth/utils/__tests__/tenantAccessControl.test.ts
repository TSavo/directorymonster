import {
  hasPermissionInTenant,
  hasAnyPermissionInTenant,
  hasAllPermissionsInTenant,
  getAccessibleResourcesInTenant,
  hasGlobalPermissionInTenant
} from '../tenantAccessControl';

// Mock dependencies
jest.mock('@/lib/tenant-membership-service', () => ({
  TenantMembershipService: {
    isTenantMember: jest.fn()
  }
}));

jest.mock('@/lib/role-service', () => ({
  RoleService: {
    hasPermission: jest.fn(),
    getUserRoles: jest.fn()
  }
}));

import { TenantMembershipService } from '@/lib/tenant-membership-service';
import { RoleService } from '@/lib/role-service';
import { ResourceType, Permission } from '../accessControl';

describe('Tenant Access Control', () => {
  // Test data
  const userId = 'user123';
  const tenantId = 'tenant123';
  const resourceType: ResourceType = 'listing';
  const permission: Permission = 'read';
  const resourceId = 'resource123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('hasPermissionInTenant', () => {
    test('should return false if user is not a tenant member', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await hasPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      // Assert
      expect(result).toBe(false);
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
    });
    
    test('should check role service if user is a tenant member', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await hasPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      // Assert
      expect(result).toBe(true);
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        userId,
        tenantId,
        resourceType,
        permission,
        resourceId
      );
    });
    
    test('should handle errors gracefully', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Act
      const result = await hasPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('hasAnyPermissionInTenant', () => {
    test('should return false if user is not a tenant member', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await hasAnyPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        [permission, 'create']
      );
      
      // Assert
      expect(result).toBe(false);
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
    });
    
    test('should return true if user has any of the permissions', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.hasPermission as jest.Mock)
        .mockResolvedValueOnce(false) // First permission check
        .mockResolvedValueOnce(true);  // Second permission check
      
      // Act
      const result = await hasAnyPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        ['update', 'read']
      );
      
      // Assert
      expect(result).toBe(true);
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
    });
    
    test('should return false if user has none of the permissions', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await hasAnyPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        ['create', 'update']
      );
      
      // Assert
      expect(result).toBe(false);
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('hasAllPermissionsInTenant', () => {
    test('should return false if user is not a tenant member', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await hasAllPermissionsInTenant(
        userId,
        tenantId,
        resourceType,
        [permission, 'create']
      );
      
      // Assert
      expect(result).toBe(false);
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
    });
    
    test('should return true if user has all permissions', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await hasAllPermissionsInTenant(
        userId,
        tenantId,
        resourceType,
        ['read', 'create']
      );
      
      // Assert
      expect(result).toBe(true);
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
    });
    
    test('should return false if user is missing any permission', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.hasPermission as jest.Mock)
        .mockResolvedValueOnce(true)   // First permission check
        .mockResolvedValueOnce(false); // Second permission check
      
      // Act
      const result = await hasAllPermissionsInTenant(
        userId,
        tenantId,
        resourceType,
        ['read', 'create']
      );
      
      // Assert
      expect(result).toBe(false);
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getAccessibleResourcesInTenant', () => {
    const mockRoles = [
      {
        id: 'role1',
        name: 'Test Role',
        description: 'Test description',
        tenantId,
        isGlobal: false,
        aclEntries: [
          {
            resource: {
              type: resourceType,
              id: 'resource1',
              tenantId
            },
            permission
          },
          {
            resource: {
              type: resourceType,
              id: 'resource2',
              tenantId
            },
            permission
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    test('should return empty array if user is not a tenant member', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await getAccessibleResourcesInTenant(
        userId,
        tenantId,
        resourceType,
        permission
      );
      
      // Assert
      expect(result).toEqual([]);
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.getUserRoles).not.toHaveBeenCalled();
    });
    
    test('should return resource IDs user has permission for', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.getUserRoles as jest.Mock).mockResolvedValue(mockRoles);
      
      // Act
      const result = await getAccessibleResourcesInTenant(
        userId,
        tenantId,
        resourceType,
        permission
      );
      
      // Assert
      expect(result).toEqual(['resource1', 'resource2']);
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.getUserRoles).toHaveBeenCalledWith(userId, tenantId);
    });
    
    test('should filter out resources with different permissions', async () => {
      // Arrange
      const mixedRoles = [
        {
          ...mockRoles[0],
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: 'resource1',
                tenantId
              },
              permission: 'read'
            },
            {
              resource: {
                type: resourceType,
                id: 'resource2',
                tenantId
              },
              permission: 'create' // Different permission
            }
          ]
        }
      ];
      
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.getUserRoles as jest.Mock).mockResolvedValue(mixedRoles);
      
      // Act
      const result = await getAccessibleResourcesInTenant(
        userId,
        tenantId,
        resourceType,
        'read'
      );
      
      // Assert
      expect(result).toEqual(['resource1']);
    });
    
    test('should filter out resources in different tenants', async () => {
      // Arrange
      const crossTenantRoles = [
        {
          ...mockRoles[0],
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: 'resource1',
                tenantId
              },
              permission
            },
            {
              resource: {
                type: resourceType,
                id: 'resource2',
                tenantId: 'different-tenant'
              },
              permission
            }
          ]
        }
      ];
      
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.getUserRoles as jest.Mock).mockResolvedValue(crossTenantRoles);
      
      // Act
      const result = await getAccessibleResourcesInTenant(
        userId,
        tenantId,
        resourceType,
        permission
      );
      
      // Assert
      expect(result).toEqual(['resource1']);
    });
    
    test('should include resources from global roles', async () => {
      // Arrange
      const globalRoles = [
        {
          id: 'role1',
          name: 'Global Role',
          description: 'Global role description',
          tenantId: 'system',
          isGlobal: true,
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: 'resource3',
                tenantId: 'system'
              },
              permission
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.getUserRoles as jest.Mock).mockResolvedValue([...mockRoles, ...globalRoles]);
      
      // Act
      const result = await getAccessibleResourcesInTenant(
        userId,
        tenantId,
        resourceType,
        permission
      );
      
      // Assert
      expect(result).toContain('resource1');
      expect(result).toContain('resource2');
      expect(result).toContain('resource3');
    });
  });
  
  describe('hasGlobalPermissionInTenant', () => {
    const mockRoles = [
      {
        id: 'role1',
        name: 'Test Role',
        description: 'Test description',
        tenantId,
        isGlobal: false,
        aclEntries: [
          {
            resource: {
              type: resourceType,
              tenantId // No resource ID means global permission
            },
            permission
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    test('should return false if user is not a tenant member', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await hasGlobalPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        permission
      );
      
      // Assert
      expect(result).toBe(false);
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.getUserRoles).not.toHaveBeenCalled();
    });
    
    test('should return true if user has global permission for resource type', async () => {
      // Arrange
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.getUserRoles as jest.Mock).mockResolvedValue(mockRoles);
      
      // Act
      const result = await hasGlobalPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        permission
      );
      
      // Assert
      expect(result).toBe(true);
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.getUserRoles).toHaveBeenCalledWith(userId, tenantId);
    });
    
    test('should return false if user has only specific resource permissions', async () => {
      // Arrange
      const specificRoles = [
        {
          ...mockRoles[0],
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: 'resource1', // Specific resource ID
                tenantId
              },
              permission
            }
          ]
        }
      ];
      
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.getUserRoles as jest.Mock).mockResolvedValue(specificRoles);
      
      // Act
      const result = await hasGlobalPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        permission
      );
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('should return true if user has global role', async () => {
      // Arrange
      const globalRoles = [
        {
          id: 'role1',
          name: 'Global Role',
          description: 'Global role description',
          tenantId: 'system',
          isGlobal: true,
          aclEntries: [
            {
              resource: {
                type: resourceType,
                tenantId: 'system'
              },
              permission
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.getUserRoles as jest.Mock).mockResolvedValue(globalRoles);
      
      // Act
      const result = await hasGlobalPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        permission
      );
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should check for correct permission type', async () => {
      // Arrange
      const mixedPermissionRoles = [
        {
          ...mockRoles[0],
          aclEntries: [
            {
              resource: {
                type: resourceType,
                tenantId
              },
              permission: 'create' // Different permission
            }
          ]
        }
      ];
      
      (TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValue(true);
      (RoleService.getUserRoles as jest.Mock).mockResolvedValue(mixedPermissionRoles);
      
      // Act
      const result = await hasGlobalPermissionInTenant(
        userId,
        tenantId,
        resourceType,
        'read'
      );
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
