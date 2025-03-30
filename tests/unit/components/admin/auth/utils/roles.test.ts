/**
 * Unit tests for roles utilities
 */

import { 
  getRoleKey,
  getUserRolesKey,
  getTenantUsersKey,
  convertToTenantACL,
  hasPermissionInTenant,
  createTenantAdminRole,
  createSuperAdminRole
} from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

describe('Roles Utilities', () => {
  // Test data
  const testTenantId = 'tenant-123';
  const testRoleId = 'role-456';
  const testUserId = 'user-789';
  
  describe('Key generation', () => {
    it('should generate correct role key', () => {
      const key = getRoleKey(testTenantId, testRoleId);
      expect(key).toBe(`role:${testTenantId}:${testRoleId}`);
    });
    
    it('should generate correct user roles key', () => {
      const key = getUserRolesKey(testUserId, testTenantId);
      expect(key).toBe(`user:roles:${testUserId}:${testTenantId}`);
    });
    
    it('should generate correct tenant users key', () => {
      const key = getTenantUsersKey(testTenantId);
      expect(key).toBe(`tenant:users:${testTenantId}`);
    });
  });
  
  describe('convertToTenantACL', () => {
    it('should convert legacy ACL to tenant ACL', () => {
      // Arrange
      const legacyACL = [
        {
          resource: {
            type: 'category' as ResourceType,
            id: 'category-123',
            siteId: 'site-456',
          },
          permission: 'create' as Permission,
        },
        {
          resource: {
            type: 'listing' as ResourceType,
          },
          permission: 'read' as Permission,
        },
      ];
      
      // Act
      const result = convertToTenantACL(legacyACL, testTenantId);
      
      // Assert
      expect(result).toEqual([
        {
          resource: {
            type: 'category',
            id: 'category-123',
            siteId: 'site-456',
            tenantId: testTenantId,
          },
          permission: 'create',
        },
        {
          resource: {
            type: 'listing',
            tenantId: testTenantId,
          },
          permission: 'read',
        },
      ]);
    });
  });
  
  describe('hasPermissionInTenant', () => {
    it('should return true when user has exact permission in tenant', () => {
      // Arrange
      const resourceType = 'category' as ResourceType;
      const permission = 'create' as Permission;
      const resourceId = 'category-123';
      
      const roles = [
        {
          id: 'role-1',
          name: 'Editor',
          description: 'Editor role',
          tenantId: testTenantId,
          isGlobal: false,
          createdAt: '',
          updatedAt: '',
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: resourceId,
                tenantId: testTenantId,
              },
              permission,
            },
          ],
        },
      ];
      
      // Act
      const result = hasPermissionInTenant(
        roles,
        resourceType,
        permission,
        testTenantId,
        resourceId
      );
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return true when user has global permission for resource type', () => {
      // Arrange
      const resourceType = 'category' as ResourceType;
      const permission = 'create' as Permission;
      const resourceId = 'category-123';
      
      const roles = [
        {
          id: 'role-1',
          name: 'Admin',
          description: 'Admin role',
          tenantId: testTenantId,
          isGlobal: false,
          createdAt: '',
          updatedAt: '',
          aclEntries: [
            {
              resource: {
                type: resourceType,
                tenantId: testTenantId,
              },
              permission,
            },
          ],
        },
      ];
      
      // Act
      const result = hasPermissionInTenant(
        roles,
        resourceType,
        permission,
        testTenantId,
        resourceId
      );
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should ignore roles from different tenants', () => {
      // Arrange
      const resourceType = 'category' as ResourceType;
      const permission = 'create' as Permission;
      const otherTenantId = 'tenant-other';
      
      const roles = [
        {
          id: 'role-1',
          name: 'Editor',
          description: 'Editor role',
          tenantId: otherTenantId,
          isGlobal: false,
          createdAt: '',
          updatedAt: '',
          aclEntries: [
            {
              resource: {
                type: resourceType,
                tenantId: otherTenantId,
              },
              permission,
            },
          ],
        },
      ];
      
      // Act
      const result = hasPermissionInTenant(
        roles,
        resourceType,
        permission,
        testTenantId
      );
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should consider global roles for any tenant', () => {
      // Arrange
      const resourceType = 'category' as ResourceType;
      const permission = 'create' as Permission;
      const systemTenantId = 'system';
      
      const roles = [
        {
          id: 'role-1',
          name: 'Super Admin',
          description: 'Super Admin role',
          tenantId: systemTenantId,
          isGlobal: true,
          createdAt: '',
          updatedAt: '',
          aclEntries: [
            {
              resource: {
                type: resourceType,
                tenantId: systemTenantId,
              },
              permission,
            },
          ],
        },
      ];
      
      // Act
      const result = hasPermissionInTenant(
        roles,
        resourceType,
        permission,
        testTenantId
      );
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false when no roles have the permission', () => {
      // Arrange
      const resourceType = 'category' as ResourceType;
      const permission = 'create' as Permission;
      
      const roles = [
        {
          id: 'role-1',
          name: 'Viewer',
          description: 'Viewer role',
          tenantId: testTenantId,
          isGlobal: false,
          createdAt: '',
          updatedAt: '',
          aclEntries: [
            {
              resource: {
                type: resourceType,
                tenantId: testTenantId,
              },
              permission: 'read' as Permission,
            },
          ],
        },
      ];
      
      // Act
      const result = hasPermissionInTenant(
        roles,
        resourceType,
        permission,
        testTenantId
      );
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('createTenantAdminRole', () => {
    it('should create a tenant admin role with all permissions', () => {
      // Act
      const role = createTenantAdminRole(testTenantId);
      
      // Assert
      expect(role.name).toBe('Tenant Admin');
      expect(role.tenantId).toBe(testTenantId);
      expect(role.isGlobal).toBe(false);
      
      // Should have ACL entries for all resource types and permissions
      const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting'];
      const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
      
      const expectedEntriesCount = resourceTypes.length * permissions.length;
      expect(role.aclEntries.length).toBe(expectedEntriesCount);
      
      // Verify all combinations are present
      resourceTypes.forEach(type => {
        permissions.forEach(permission => {
          const hasEntry = role.aclEntries.some(entry => 
            entry.resource.type === type && 
            entry.permission === permission &&
            entry.resource.tenantId === testTenantId
          );
          
          expect(hasEntry).toBe(true);
        });
      });
    });
    
    it('should accept custom name and description', () => {
      // Arrange
      const customName = 'Custom Admin';
      const customDescription = 'Custom admin description';
      
      // Act
      const role = createTenantAdminRole(testTenantId, customName, customDescription);
      
      // Assert
      expect(role.name).toBe(customName);
      expect(role.description).toBe(customDescription);
    });
  });
  
  describe('createSuperAdminRole', () => {
    it('should create a global super admin role', () => {
      // Act
      const role = createSuperAdminRole();
      
      // Assert
      expect(role.name).toBe('Super Admin');
      expect(role.isGlobal).toBe(true);
      
      // Should have special tenant management permission
      const hasTenantPermission = role.aclEntries.some(entry => 
        entry.resource.type === 'tenant' &&
        entry.permission === 'manage'
      );
      
      expect(hasTenantPermission).toBe(true);
      
      // Should have all standard permissions
      const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting'];
      const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
      
      resourceTypes.forEach(type => {
        permissions.forEach(permission => {
          const hasEntry = role.aclEntries.some(entry => 
            entry.resource.type === type && 
            entry.permission === permission
          );
          
          expect(hasEntry).toBe(true);
        });
      });
    });
    
    it('should accept custom name and description', () => {
      // Arrange
      const customName = 'Global Admin';
      const customDescription = 'Global system admin';
      
      // Act
      const role = createSuperAdminRole(customName, customDescription);
      
      // Assert
      expect(role.name).toBe(customName);
      expect(role.description).toBe(customDescription);
    });
  });
});
