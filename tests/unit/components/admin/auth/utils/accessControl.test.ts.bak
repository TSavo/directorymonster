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
    it('should return false when user has explicit access to the requested tenant', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { tenantId: 'tenant-456', permissions: ['read', 'write'] },
          { tenantId: 'tenant-789', permissions: ['read'] }
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
      const acl = {
        userId: 'user-123',
        entries: [
          { tenantId: 'tenant-789', permissions: ['read', 'write'] },
          { tenantId: 'tenant-111', permissions: ['read'] }
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
          { tenantId: '*', permissions: ['admin'] }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should return false when user has wildcard access to the tenant category', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { tenantId: 'tenant-*', permissions: ['read'] }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should handle null or undefined ACL by indicating cross-tenant access', () => {
      // Arrange
      const acl = null;
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should handle null or undefined tenantId by indicating no cross-tenant access', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { tenantId: 'tenant-456', permissions: ['read', 'write'] }
        ]
      };
      const requestedTenantId = null;
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should handle ACL with empty entries by indicating cross-tenant access', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: []
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should handle tenant-specific permission checks correctly', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { tenantId: 'tenant-456', permissions: ['read'] } // Only read permission
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId, 'write');
      
      // Assert - should be true because user doesn't have write permission
      expect(result).toBe(true);
    });
    
    it('should validate against all tenant IDs in a multi-tenant request', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { tenantId: 'tenant-456', permissions: ['read', 'write'] },
          { tenantId: 'tenant-789', permissions: ['read'] }
        ]
      };
      const requestedTenantIds = ['tenant-456', 'tenant-789', 'tenant-111'];
      
      // Act - passing array of tenant IDs
      const result = detectCrossTenantAccess(acl, requestedTenantIds);
      
      // Assert - should be true because user doesn't have access to tenant-111
      expect(result).toBe(true);
    });
    
    it('should allow access when user has the required permission for the requested tenant', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { tenantId: 'tenant-456', permissions: ['read', 'write', 'admin'] }
        ]
      };
      const requestedTenantId = 'tenant-456';
      
      // Act
      const result = detectCrossTenantAccess(acl, requestedTenantId, 'admin');
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should handle deep nested permissions for complex tenant structures', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { 
            tenantId: 'tenant-456', 
            permissions: ['read', 'write'],
            resources: [
              { 
                type: ResourceType.DOCUMENT, 
                id: 'doc-1', 
                permissions: ['read', 'write'] 
              }
            ]
          }
        ]
      };
      
      // Act
      const result = detectCrossTenantAccess(acl, 'tenant-456', 'read', { 
        resourceType: ResourceType.DOCUMENT, 
        resourceId: 'doc-1' 
      });
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should correctly handle multilevel permissions with resource checks', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { 
            tenantId: 'tenant-456', 
            permissions: ['read'],
            resources: [
              { 
                type: ResourceType.FOLDER, 
                id: 'folder-1', 
                permissions: ['read'] 
              }
            ]
          }
        ]
      };
      
      // Act - checking write permission but user only has read
      const result = detectCrossTenantAccess(acl, 'tenant-456', 'write', { 
        resourceType: ResourceType.FOLDER, 
        resourceId: 'folder-1' 
      });
      
      // Assert - should be true because user doesn't have write permission on this resource
      expect(result).toBe(true);
    });
    
    it('should verify hierarchical resource permissions correctly', () => {
      // Arrange
      const acl = {
        userId: 'user-123',
        entries: [
          { 
            tenantId: 'tenant-456', 
            permissions: ['read', 'write'],
            resources: [
              { 
                type: ResourceType.FOLDER, 
                id: 'folder-1', 
                permissions: ['read', 'write'],
                children: [
                  {
                    type: ResourceType.DOCUMENT,
                    id: 'doc-1',
                    permissions: ['read']
                  }
                ]
              }
            ]
          }
        ]
      };
      
      // Act - checking write permission on doc-1 but user only has read
      const result = detectCrossTenantAccess(acl, 'tenant-456', 'write', { 
        resourceType: ResourceType.DOCUMENT, 
        resourceId: 'doc-1',
        parentId: 'folder-1'
      });
      
      // Assert - should be true because user doesn't have write permission on doc-1
      expect(result).toBe(true);
    });
  });
  
  describe('getReferencedTenants', () => {
    it('should extract tenant IDs from a simple object', () => {
      // Arrange
      const data = {
        name: 'Test',
        tenantId: 'tenant-456',
        reference: 'tenant-789'
      };
      
      // Act
      const result = getReferencedTenants(data);
      
      // Assert
      expect(result).toContain('tenant-456');
      expect(result).toContain('tenant-789');
      expect(result.length).toBe(2);
    });
    
    it('should extract tenant IDs from nested objects', () => {
      // Arrange
      const data = {
        name: 'Test',
        references: {
          primary: 'tenant-456',
          secondary: {
            id: 'tenant-789'
          }
        }
      };
      
      // Act
      const result = getReferencedTenants(data);
      
      // Assert
      expect(result).toContain('tenant-456');
      expect(result).toContain('tenant-789');
      expect(result.length).toBe(2);
    });
    
    it('should extract tenant IDs from arrays', () => {
      // Arrange
      const data = {
        name: 'Test',
        tenants: ['tenant-456', 'tenant-789']
      };
      
      // Act
      const result = getReferencedTenants(data);
      
      // Assert
      expect(result).toContain('tenant-456');
      expect(result).toContain('tenant-789');
      expect(result.length).toBe(2);
    });
    
    it('should extract tenant IDs from mixed structures', () => {
      // Arrange
      const data = {
        name: 'Test',
        primaryTenant: 'tenant-456',
        references: [
          { id: 'ref-1', tenantId: 'tenant-789' },
          { id: 'ref-2', tenantId: 'tenant-101' }
        ],
        metadata: {
          owner: {
            tenantId: 'tenant-202'
          }
        }
      };
      
      // Act
      const result = getReferencedTenants(data);
      
      // Assert
      expect(result).toContain('tenant-456');
      expect(result).toContain('tenant-789');
      expect(result).toContain('tenant-101');
      expect(result).toContain('tenant-202');
      expect(result.length).toBe(4);
    });
    
    it('should handle circular references gracefully', () => {
      // Arrange
      const data: any = {
        name: 'Test',
        tenantId: 'tenant-456'
      };
      data.self = data; // Create circular reference
      
      // Act
      const result = getReferencedTenants(data);
      
      // Assert
      expect(result).toContain('tenant-456');
      expect(result.length).toBe(1);
    });
    
    it('should extract UUID format tenant IDs', () => {
      // Arrange
      const data = {
        name: 'Test',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        reference: '550e8400-e29b-41d4-a716-446655440001'
      };
      
      // Act
      const result = getReferencedTenants(data);
      
      // Assert
      expect(result).toContain('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toContain('550e8400-e29b-41d4-a716-446655440001');
      expect(result.length).toBe(2);
    });
  });
  
  describe('Permission Management Functions', () => {
    let acl: ACL;
    
    beforeEach(() => {
      acl = {
        userId: 'user-123',
        entries: [
          { tenantId: 'tenant-456', permissions: ['read'] }
        ]
      };
    });
    
    describe('hasPermission', () => {
      it('should return true when user has the requested permission', () => {
        // Act
        const result = hasPermission(acl, 'tenant-456', 'read');
        
        // Assert
        expect(result).toBe(true);
      });
      
      it('should return false when user does not have the requested permission', () => {
        // Act
        const result = hasPermission(acl, 'tenant-456', 'write');
        
        // Assert
        expect(result).toBe(false);
      });
      
      it('should return false when user does not have access to the tenant', () => {
        // Act
        const result = hasPermission(acl, 'tenant-789', 'read');
        
        // Assert
        expect(result).toBe(false);
      });
      
      it('should return true when user has admin permission', () => {
        // Arrange
        acl.entries[0].permissions = ['admin'];
        
        // Act
        const result = hasPermission(acl, 'tenant-456', 'read');
        
        // Assert
        expect(result).toBe(true);
      });
      
      it('should return true for any permission when user has wildcard access', () => {
        // Arrange
        acl.entries[0].permissions = ['*'];
        
        // Act
        const result = hasPermission(acl, 'tenant-456', 'delete');
        
        // Assert
        expect(result).toBe(true);
      });
    });
    
    describe('grantPermission', () => {
      it('should add a new permission to an existing tenant entry', () => {
        // Act
        grantPermission(acl, 'tenant-456', 'write');
        
        // Assert
        expect(acl.entries[0].permissions).toContain('read');
        expect(acl.entries[0].permissions).toContain('write');
        expect(acl.entries[0].permissions.length).toBe(2);
      });
      
      it('should create a new tenant entry when one does not exist', () => {
        // Act
        grantPermission(acl, 'tenant-789', 'read');
        
        // Assert
        expect(acl.entries.length).toBe(2);
        const newEntry = acl.entries.find(e => e.tenantId === 'tenant-789');
        expect(newEntry).toBeDefined();
        expect(newEntry!.permissions).toContain('read');
      });
      
      it('should not duplicate permissions', () => {
        // Act
        grantPermission(acl, 'tenant-456', 'read');
        
        // Assert
        expect(acl.entries[0].permissions).toContain('read');
        expect(acl.entries[0].permissions.length).toBe(1);
      });
    });
    
    describe('revokePermission', () => {
      it('should remove a permission from a tenant entry', () => {
        // Arrange
        acl.entries[0].permissions = ['read', 'write'];
        
        // Act
        revokePermission(acl, 'tenant-456', 'write');
        
        // Assert
        expect(acl.entries[0].permissions).toContain('read');
        expect(acl.entries[0].permissions).not.toContain('write');
        expect(acl.entries[0].permissions.length).toBe(1);
      });
      
      it('should handle non-existent permissions gracefully', () => {
        // Act
        revokePermission(acl, 'tenant-456', 'delete');
        
        // Assert
        expect(acl.entries[0].permissions).toContain('read');
        expect(acl.entries[0].permissions.length).toBe(1);
      });
      
      it('should handle non-existent tenant entries gracefully', () => {
        // Act
        revokePermission(acl, 'tenant-789', 'read');
        
        // Assert
        expect(acl.entries.length).toBe(1);
        expect(acl.entries[0].tenantId).toBe('tenant-456');
      });
    });
    
    describe('ACL Factory Functions', () => {
      it('should create a super admin ACL with global permissions', () => {
        // Act
        const result = createSuperAdminACL('user-123');
        
        // Assert
        expect(result.userId).toBe('user-123');
        expect(result.entries).toContainEqual({
          tenantId: '*',
          permissions: ['*']
        });
      });
      
      it('should create a tenant admin ACL with permissions for a specific tenant', () => {
        // Act
        const result = createTenantAdminACL('user-123', 'tenant-456');
        
        // Assert
        expect(result.userId).toBe('user-123');
        expect(result.entries).toContainEqual({
          tenantId: 'tenant-456',
          permissions: ['admin']
        });
      });
      
      it('should create a site admin ACL with admin permissions for a specific site', () => {
        // Act
        const result = createSiteAdminACL('user-123', 'site-456', 'tenant-789');
        
        // Assert
        expect(result.userId).toBe('user-123');
        expect(result.entries).toContainEqual({
          tenantId: 'tenant-789',
          permissions: ['read', 'write'],
          resources: [
            {
              type: ResourceType.SITE,
              id: 'site-456',
              permissions: ['admin']
            }
          ]
        });
      });
    });
  });
});