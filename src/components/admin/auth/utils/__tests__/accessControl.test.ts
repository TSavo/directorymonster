import { 
  ResourceType, 
  Permission, 
  Resource, 
  ACE, 
  ACL, 
  hasPermission, 
  grantPermission, 
  revokePermission,
  createSiteAdminACL,
  createTenantAdminACL,
  createSuperAdminACL,
  detectCrossTenantAccess,
  getReferencedTenants
} from '../accessControl';

describe('Access Control with Tenant Context', () => {
  // Test data
  const userId = 'user123';
  const tenantId1 = 'tenant1';
  const tenantId2 = 'tenant2';
  const resourceId = 'resource123';
  const siteId = 'site123';
  const resourceType: ResourceType = 'listing';
  const permission: Permission = 'read';
  
  describe('hasPermission', () => {
    test('should return true when user has exact permission in tenant', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: resourceType,
              id: resourceId,
              tenantId: tenantId1,
              siteId
            },
            permission
          }
        ]
      };
      
      // Act
      const result = hasPermission(acl, resourceType, permission, tenantId1, resourceId, siteId);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should return false when permission is in different tenant', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: resourceType,
              id: resourceId,
              tenantId: tenantId1,
              siteId
            },
            permission
          }
        ]
      };
      
      // Act - check permission in tenant2 when ACL has tenant1
      const result = hasPermission(acl, resourceType, permission, tenantId2, resourceId, siteId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('should return true for site-wide permission in correct tenant', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: resourceType,
              tenantId: tenantId1,
              siteId
            },
            permission
          }
        ]
      };
      
      // Act - specific resource in site
      const result = hasPermission(acl, resourceType, permission, tenantId1, resourceId, siteId);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should return true for tenant-wide permission', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: resourceType,
              tenantId: tenantId1
            },
            permission
          }
        ]
      };
      
      // Act - specific resource in tenant
      const result = hasPermission(acl, resourceType, permission, tenantId1, resourceId, siteId);
      
      // Assert
      expect(result).toBe(true);
    });
  });
  
  describe('grantPermission', () => {
    test('should add permission with tenant context', () => {
      // Arrange
      const acl: ACL = { userId, entries: [] };
      
      // Act
      const updatedAcl = grantPermission(acl, resourceType, permission, tenantId1, resourceId, siteId);
      
      // Assert
      expect(updatedAcl.entries.length).toBe(1);
      expect(updatedAcl.entries[0].resource.tenantId).toBe(tenantId1);
      expect(updatedAcl.entries[0].resource.type).toBe(resourceType);
      expect(updatedAcl.entries[0].resource.id).toBe(resourceId);
      expect(updatedAcl.entries[0].resource.siteId).toBe(siteId);
      expect(updatedAcl.entries[0].permission).toBe(permission);
    });
    
    test('should not add duplicate permission', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: resourceType,
              id: resourceId,
              tenantId: tenantId1,
              siteId
            },
            permission
          }
        ]
      };
      
      // Act
      const updatedAcl = grantPermission(acl, resourceType, permission, tenantId1, resourceId, siteId);
      
      // Assert
      expect(updatedAcl.entries.length).toBe(1);
    });
  });
  
  describe('revokePermission', () => {
    test('should remove permission with matching tenant', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: resourceType,
              id: resourceId,
              tenantId: tenantId1,
              siteId
            },
            permission
          }
        ]
      };
      
      // Act
      const updatedAcl = revokePermission(acl, resourceType, permission, tenantId1, resourceId, siteId);
      
      // Assert
      expect(updatedAcl.entries.length).toBe(0);
    });
    
    test('should not remove permission with non-matching tenant', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: resourceType,
              id: resourceId,
              tenantId: tenantId1,
              siteId
            },
            permission
          }
        ]
      };
      
      // Act - try to revoke in tenant2 when ACL has tenant1
      const updatedAcl = revokePermission(acl, resourceType, permission, tenantId2, resourceId, siteId);
      
      // Assert
      expect(updatedAcl.entries.length).toBe(1);
    });
  });
  
  describe('createSiteAdminACL', () => {
    test('should create ACL with site permissions in tenant context', () => {
      // Act
      const acl = createSiteAdminACL(userId, tenantId1, siteId);
      
      // Assert
      expect(acl.userId).toBe(userId);
      expect(acl.entries.length).toBeGreaterThan(0);
      
      // All entries should have the correct tenant ID
      acl.entries.forEach(entry => {
        expect(entry.resource.tenantId).toBe(tenantId1);
      });
      
      // Should have site management permission
      const hasSiteManage = acl.entries.some(entry => 
        entry.resource.type === 'site' && 
        entry.resource.id === siteId && 
        entry.permission === 'manage'
      );
      expect(hasSiteManage).toBe(true);
    });
  });
  
  describe('createTenantAdminACL', () => {
    test('should create ACL with tenant-wide permissions', () => {
      // Act
      const acl = createTenantAdminACL(userId, tenantId1);
      
      // Assert
      expect(acl.userId).toBe(userId);
      expect(acl.entries.length).toBeGreaterThan(0);
      
      // All entries should have the correct tenant ID
      acl.entries.forEach(entry => {
        expect(entry.resource.tenantId).toBe(tenantId1);
      });
      
      // Should have tenant-wide permissions for multiple resource types
      const resourceTypes = new Set<ResourceType>();
      acl.entries.forEach(entry => {
        resourceTypes.add(entry.resource.type);
      });
      
      expect(resourceTypes.size).toBeGreaterThan(1);
    });
  });
  
  describe('createSuperAdminACL', () => {
    test('should create ACL with system-level permissions', () => {
      // Act
      const acl = createSuperAdminACL(userId);
      
      // Assert
      expect(acl.userId).toBe(userId);
      expect(acl.entries.length).toBeGreaterThan(0);
      
      // All entries should have the system tenant ID
      acl.entries.forEach(entry => {
        expect(entry.resource.tenantId).toBe('system');
      });
      
      // Should have tenant management permission
      const hasTenantManage = acl.entries.some(entry => 
        entry.resource.type === 'tenant' && 
        entry.permission === 'manage'
      );
      expect(hasTenantManage).toBe(true);
    });
  });
  
  describe('detectCrossTenantAccess', () => {
    test('should detect when ACL references multiple non-system tenants', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: 'user',
              tenantId: tenantId1
            },
            permission: 'read'
          },
          {
            resource: {
              type: 'listing',
              tenantId: tenantId2
            },
            permission: 'read'
          }
        ]
      };
      
      // Act
      const hasCrossTenantAccess = detectCrossTenantAccess(acl, tenantId1);
      
      // Assert
      expect(hasCrossTenantAccess).toBe(true);
    });
    
    test('should allow system tenant references', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: 'user',
              tenantId: tenantId1
            },
            permission: 'read'
          },
          {
            resource: {
              type: 'tenant',
              tenantId: 'system'
            },
            permission: 'manage'
          }
        ]
      };
      
      // Act
      const hasCrossTenantAccess = detectCrossTenantAccess(acl, tenantId1);
      
      // Assert
      expect(hasCrossTenantAccess).toBe(false);
    });
  });
  
  describe('getReferencedTenants', () => {
    test('should return all tenant IDs referenced in ACL', () => {
      // Arrange
      const acl: ACL = {
        userId,
        entries: [
          {
            resource: {
              type: 'user',
              tenantId: tenantId1
            },
            permission: 'read'
          },
          {
            resource: {
              type: 'listing',
              tenantId: tenantId2
            },
            permission: 'read'
          },
          {
            resource: {
              type: 'tenant',
              tenantId: 'system'
            },
            permission: 'manage'
          }
        ]
      };
      
      // Act
      const tenantIds = getReferencedTenants(acl);
      
      // Assert
      expect(tenantIds.length).toBe(3);
      expect(tenantIds).toContain(tenantId1);
      expect(tenantIds).toContain(tenantId2);
      expect(tenantIds).toContain('system');
    });
  });
});
