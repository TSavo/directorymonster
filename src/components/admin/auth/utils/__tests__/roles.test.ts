import {
  Role,
  TenantResource,
  TenantACE,
  hasPermissionInTenant,
  createTenantAdminRole,
  createSuperAdminRole,
  getRoleKey,
  getUserRolesKey,
  getTenantUsersKey,
  convertToTenantACL
} from '../roles';

describe('Role-based Access Control', () => {
  // Test data
  const userId = 'user123';
  const tenantId1 = 'tenant1';
  const tenantId2 = 'tenant2';
  const roleId = 'role123';
  const resourceId = 'resource123';
  
  describe('hasPermissionInTenant', () => {
    test('should return true when role has exact permission in tenant', () => {
      // Arrange
      const roles: Role[] = [
        {
          id: roleId,
          name: 'Test Role',
          description: 'Test role description',
          tenantId: tenantId1,
          isGlobal: false,
          aclEntries: [
            {
              resource: {
                type: 'listing',
                id: resourceId,
                tenantId: tenantId1
              },
              permission: 'read'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Act
      const result = hasPermissionInTenant(
        roles,
        'listing',
        'read',
        tenantId1,
        resourceId
      );
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should return false when permission is in different tenant', () => {
      // Arrange
      const roles: Role[] = [
        {
          id: roleId,
          name: 'Test Role',
          description: 'Test role description',
          tenantId: tenantId1,
          isGlobal: false,
          aclEntries: [
            {
              resource: {
                type: 'listing',
                id: resourceId,
                tenantId: tenantId1
              },
              permission: 'read'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Act - check permission in tenant2 when role is in tenant1
      const result = hasPermissionInTenant(
        roles,
        'listing',
        'read',
        tenantId2,
        resourceId
      );
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('should return true for global type permission in tenant', () => {
      // Arrange
      const roles: Role[] = [
        {
          id: roleId,
          name: 'Test Role',
          description: 'Test role description',
          tenantId: tenantId1,
          isGlobal: false,
          aclEntries: [
            {
              resource: {
                type: 'listing',
                tenantId: tenantId1
              },
              permission: 'read'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Act - specific resource with type permission
      const result = hasPermissionInTenant(
        roles,
        'listing',
        'read',
        tenantId1,
        resourceId
      );
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should return true for global role in any tenant', () => {
      // Arrange
      const roles: Role[] = [
        {
          id: roleId,
          name: 'Super Admin',
          description: 'Global admin role',
          tenantId: 'system',
          isGlobal: true,
          aclEntries: [
            {
              resource: {
                type: 'listing',
                tenantId: 'system'
              },
              permission: 'read'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Act - check in tenant2 even though role is system level
      const result = hasPermissionInTenant(
        roles,
        'listing',
        'read',
        tenantId2,
        resourceId
      );
      
      // Assert
      expect(result).toBe(true);
    });
  });
  
  describe('createTenantAdminRole', () => {
    test('should create admin role with proper tenant context', () => {
      // Act
      const role = createTenantAdminRole(tenantId1);
      
      // Assert
      expect(role.tenantId).toBe(tenantId1);
      expect(role.isGlobal).toBe(false);
      expect(role.aclEntries.length).toBeGreaterThan(0);
      
      // All entries should have the correct tenant ID
      role.aclEntries.forEach(entry => {
        expect(entry.resource.tenantId).toBe(tenantId1);
      });
    });
  });
  
  describe('createSuperAdminRole', () => {
    test('should create global admin role with system tenant', () => {
      // Act
      const role = createSuperAdminRole();
      
      // Assert
      expect(role.tenantId).toBe('system');
      expect(role.isGlobal).toBe(true);
      expect(role.aclEntries.length).toBeGreaterThan(0);
      
      // Should have tenant management permission
      const hasTenantManage = role.aclEntries.some(entry => 
        entry.resource.type === 'tenant' && 
        entry.permission === 'manage'
      );
      expect(hasTenantManage).toBe(true);
    });
  });
  
  describe('Redis key generators', () => {
    test('getRoleKey should include tenant ID', () => {
      // Act
      const key = getRoleKey(tenantId1, roleId);
      
      // Assert
      expect(key).toContain(tenantId1);
      expect(key).toContain(roleId);
    });
    
    test('getUserRolesKey should include tenant ID', () => {
      // Act
      const key = getUserRolesKey(userId, tenantId1);
      
      // Assert
      expect(key).toContain(userId);
      expect(key).toContain(tenantId1);
    });
    
    test('getTenantUsersKey should include tenant ID', () => {
      // Act
      const key = getTenantUsersKey(tenantId1);
      
      // Assert
      expect(key).toContain(tenantId1);
    });
  });
  
  describe('convertToTenantACL', () => {
    test('should convert ACL to tenant ACL', () => {
      // Arrange
      const acl = [
        {
          resource: {
            type: 'listing',
            id: resourceId
          },
          permission: 'read'
        }
      ];
      
      // Act
      const tenantAcl = convertToTenantACL(acl, tenantId1);
      
      // Assert
      expect(tenantAcl.length).toBe(1);
      expect(tenantAcl[0].resource.tenantId).toBe(tenantId1);
      expect(tenantAcl[0].resource.type).toBe('listing');
      expect(tenantAcl[0].resource.id).toBe(resourceId);
    });
  });
});
