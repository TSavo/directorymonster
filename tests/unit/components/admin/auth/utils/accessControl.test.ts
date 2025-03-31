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
  type ACL
} from '@/components/admin/auth/utils/accessControl';

describe('Access Control Utilities', () => {
  describe('detectCrossTenantAccess', () => {
    it('should return true when user has access to multiple tenants including the requested one', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'tenant-456' },
            permission: 'read' as Permission
          },
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'tenant-789' },
            permission: 'read' as Permission
          }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert - returns true because there's an entry for tenant-789 which is different from tenant-456
      expect(result).toBe(true);
    });
    
    it('should return false when user has access only to the requested tenant', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'tenant-456' },
            permission: 'read' as Permission
          },
          { 
            resource: { type: 'listing' as ResourceType, tenantId: 'tenant-456' },
            permission: 'read' as Permission
          }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert - returns false because all entries are for tenant-456
      expect(result).toBe(false);
    });
    
    it('should return true when user has no access to the requested tenant', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'tenant-789' },
            permission: 'read' as Permission
          },
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'tenant-111' },
            permission: 'read' as Permission
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
      const acl = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'system' },
            permission: 'manage' as Permission
          }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should handle empty entries by returning false', () => {
      // Arrange
      const acl = {
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
    it('should extract tenant IDs from ACL entries', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'tenant-456' },
            permission: 'read' as Permission
          },
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'tenant-789' },
            permission: 'read' as Permission
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
  });
  
  describe('Permission Management Functions', () => {
    let acl: ACL;
    
    beforeEach(() => {
      acl = {
        userId: 'user-123',
        entries: [
          { 
            resource: { type: 'user' as ResourceType, tenantId: 'tenant-456' },
            permission: 'read' as Permission
          }
        ]
      };
    });
    
    describe('hasPermission', () => {
      it('should return true when user has the requested permission', () => {
        // Act
        const result = hasPermission(acl, 'user', 'read', 'tenant-456');
        
        // Assert
        expect(result).toBe(true);
      });
      
      it('should return false when user does not have the requested permission', () => {
        // Act
        const result = hasPermission(acl, 'user', 'write' as Permission, 'tenant-456');
        
        // Assert
        expect(result).toBe(false);
      });
    });
    
    describe('grantPermission', () => {
      it('should add a new permission to the ACL', () => {
        // Act
        const updatedAcl = grantPermission(acl, 'user', 'update', 'tenant-456');
        
        // Assert
        expect(updatedAcl.entries.length).toBe(2);
        expect(updatedAcl.entries[1].permission).toBe('update');
      });
    });
    
    describe('revokePermission', () => {
      it('should remove a permission from the ACL', () => {
        // Arrange
        const aclWithMultiplePermissions = {
          userId: 'user-123',
          entries: [
            { 
              resource: { type: 'user' as ResourceType, tenantId: 'tenant-456' },
              permission: 'read' as Permission
            },
            { 
              resource: { type: 'user' as ResourceType, tenantId: 'tenant-456' },
              permission: 'update' as Permission
            }
          ]
        };
        
        // Act
        const updatedAcl = revokePermission(aclWithMultiplePermissions, 'user', 'update', 'tenant-456');
        
        // Assert
        expect(updatedAcl.entries.length).toBe(1);
        expect(updatedAcl.entries[0].permission).toBe('read');
      });
    });
    
    describe('ACL Factory Functions', () => {
      it('should create a super admin ACL with system tenant permissions', () => {
        // Act
        const result = createSuperAdminACL('user-123');
        
        // Assert
        expect(result.userId).toBe('user-123');
        expect(result.entries.length).toBeGreaterThan(0);
        expect(result.entries[0].resource.tenantId).toBe('system');
      });
      
      it('should create a tenant admin ACL with permissions for a specific tenant', () => {
        // Act
        const result = createTenantAdminACL('user-123', 'tenant-456');
        
        // Assert
        expect(result.userId).toBe('user-123');
        expect(result.entries.length).toBeGreaterThan(0);
        expect(result.entries[0].resource.tenantId).toBe('tenant-456');
      });
      
      it('should create a site admin ACL with site-specific permissions', () => {
        // Act
        const result = createSiteAdminACL('user-123', 'tenant-456', 'site-789');
        
        // Assert
        expect(result.userId).toBe('user-123');
        expect(result.entries.length).toBeGreaterThan(0);
        expect(result.entries[0].resource.tenantId).toBe('tenant-456');
        expect(result.entries[0].resource.id).toBe('site-789');
      });
    });
  });
});