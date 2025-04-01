/**
 * Unit tests for Access Control utilities
 * Tests the Cross-Tenant Attack Prevention detection functionality
 */

import { 
  ResourceType, 
  Permission, 
  hasPermission, 
  grantPermission, 
  revokePermission, 
  createSiteAdminACL, 
  createTenantAdminACL,
  createSuperAdminACL,
  detectCrossTenantAccess,
  getReferencedTenants,
  type ACL,
  type Resource
} from '@/components/admin/auth/utils/accessControl';

describe('Access Control Utilities', () => {
  describe('detectCrossTenantAccess', () => {
    it('should return false when user has explicit access to the requested tenant', () => {
      // Arrange
      const acl: ACL = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'site', tenantId: 'tenant-456' },
            permission: 'read'
          },
          { 
            resource: { type: 'user', tenantId: 'tenant-789' },
            permission: 'read'
          }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should return true when user has no access to the requested tenant', () => {
      // Arrange
      const acl: ACL = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'site', tenantId: 'tenant-789' },
            permission: 'read'
          },
          { 
            resource: { type: 'user', tenantId: 'tenant-111' },
            permission: 'read'
          }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false when user has admin access to all tenants', () => {
      // Arrange
      const acl: ACL = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'user', tenantId: 'system' },
            permission: 'manage'
          }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should handle ACL with empty entries by indicating no cross-tenant access', () => {
      // Arrange
      const acl: ACL = {
        userId: 'user-123',
        entries: []
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('getReferencedTenants', () => {
    it('should extract tenant IDs from an ACL object', () => {
      // Arrange
      const acl: ACL = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'site', tenantId: 'tenant-456' },
            permission: 'read'
          },
          { 
            resource: { type: 'user', tenantId: 'tenant-789' },
            permission: 'read'
          }
        ]
      };
      
      // Act
      const result = getReferencedTenants(acl);
      
      // Assert
      expect(result).toContain('tenant-456');
      expect(result).toContain('tenant-789');
      expect(result.length).toBe(2);
    });
    
    it('should extract tenant IDs with system tenantId', () => {
      // Arrange
      const acl: ACL = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'site', tenantId: 'tenant-456' },
            permission: 'read'
          },
          { 
            resource: { type: 'site', tenantId: 'system' },
            permission: 'manage'
          }
        ]
      };
      
      // Act
      const result = getReferencedTenants(acl);
      
      // Assert
      expect(result).toContain('tenant-456');
      expect(result).toContain('system');
      expect(result.length).toBe(2);
    });
    
    it('should handle ACL with empty entries', () => {
      // Arrange
      const acl: ACL = {
        userId: 'user-123',
        entries: []
      };
      
      // Act
      const result = getReferencedTenants(acl);
      
      // Assert
      expect(result.length).toBe(0);
    });
  });
  
  describe('Permission Management Functions', () => {
    describe('hasPermission', () => {
      it('should return true when user has the requested permission', () => {
        // Arrange
        const acl: ACL = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'read'
            }
          ]
        };
        
        // Act
        const result = hasPermission(acl, 'site', 'read', 'tenant-456');
        
        // Assert
        expect(result).toBe(true);
      });
      
      it('should return false when user does not have the requested permission', () => {
        // Arrange
        const acl: ACL = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'read'
            }
          ]
        };
        
        // Act
        const result = hasPermission(acl, 'site', 'update', 'tenant-456');
        
        // Assert
        expect(result).toBe(false);
      });
      
      it('should return false when user does not have access to the tenant', () => {
        // Arrange
        const acl: ACL = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'read'
            }
          ]
        };
        
        // Act
        const result = hasPermission(acl, 'site', 'read', 'tenant-789');
        
        // Assert
        expect(result).toBe(false);
      });
    });
    
    describe('grantPermission', () => {
      it('should add a new permission to the ACL', () => {
        // Arrange
        const acl: ACL = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'read'
            }
          ]
        };
        
        // Act
        const result = grantPermission(acl, 'site', 'update', 'tenant-456');
        
        // Assert
        expect(result.entries.length).toBe(2);
        expect(result.entries[1].resource.type).toBe('site');
        expect(result.entries[1].permission).toBe('update');
        expect(result.entries[1].resource.tenantId).toBe('tenant-456');
      });
      
      it('should not duplicate existing permissions', () => {
        // Arrange
        const acl: ACL = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'read'
            }
          ]
        };
        
        // Act
        const result = grantPermission(acl, 'site', 'read', 'tenant-456');
        
        // Assert
        expect(result.entries.length).toBe(1);
      });
      
      it('should add permission to different resource type', () => {
        // Arrange
        const acl: ACL = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'read'
            }
          ]
        };
        
        // Act
        const result = grantPermission(acl, 'user', 'read', 'tenant-456');
        
        // Assert
        expect(result.entries.length).toBe(2);
        expect(result.entries[1].resource.type).toBe('user');
      });
    });
    
    describe('revokePermission', () => {
      it('should remove a permission from the ACL', () => {
        // Arrange
        const acl: ACL = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'read'
            },
            {
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'update'
            }
          ]
        };
        
        // Act
        const result = revokePermission(acl, 'site', 'update', 'tenant-456');
        
        // Assert
        expect(result.entries.length).toBe(1);
        expect(result.entries[0].permission).toBe('read');
      });
      
      it('should handle non-existent permissions gracefully', () => {
        // Arrange
        const acl: ACL = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'site', tenantId: 'tenant-456' },
              permission: 'read'
            }
          ]
        };
        
        // Act
        const result = revokePermission(acl, 'site', 'delete', 'tenant-456');
        
        // Assert
        expect(result.entries.length).toBe(1);
      });
    });
    
    describe('ACL Factory Functions', () => {
      it('should create a super admin ACL with system tenant permissions', () => {
        // Act
        const result = createSuperAdminACL('user-123');
        
        // Assert
        expect(result.userId).toBe('user-123');
        // Check if it contains a system tenant entry with manage permission
        const hasTenantManage = result.entries.some(entry => 
          entry.resource.type === 'tenant' && 
          entry.resource.tenantId === 'system' && 
          entry.permission === 'manage'
        );
        expect(hasTenantManage).toBe(true);
      });
      
      it('should create a tenant admin ACL with permissions for a specific tenant', () => {
        // Act
        const result = createTenantAdminACL('user-123', 'tenant-456');
        
        // Assert
        expect(result.userId).toBe('user-123');
        // Verify it has manage permissions for all resource types
        const resourceTypes = ['user', 'site', 'category', 'listing', 'setting', 'audit', 'role'];
        
        resourceTypes.forEach(type => {
          const hasManagePermission = result.entries.some(entry => 
            entry.resource.type === type && 
            entry.resource.tenantId === 'tenant-456' && 
            entry.permission === 'manage'
          );
          expect(hasManagePermission).toBe(true);
        });
      });
      
      it('should create a site admin ACL with admin permissions for a specific site', () => {
        // Act
        const result = createSiteAdminACL('user-123', 'tenant-456', 'site-789');
        
        // Assert
        expect(result.userId).toBe('user-123');
        
        // Check for site management permission
        const hasSiteManage = result.entries.some(entry => 
          entry.resource.type === 'site' && 
          entry.resource.tenantId === 'tenant-456' && 
          entry.resource.id === 'site-789' &&
          entry.permission === 'manage'
        );
        expect(hasSiteManage).toBe(true);
        
        // Check for category permissions
        const hasCategoryPermissions = result.entries.some(entry => 
          entry.resource.type === 'category' && 
          entry.resource.tenantId === 'tenant-456' && 
          entry.resource.siteId === 'site-789'
        );
        expect(hasCategoryPermissions).toBe(true);
      });
    });
  });
});