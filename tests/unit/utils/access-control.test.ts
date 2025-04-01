/**
 * Unit tests for access control utilities
 * Focuses on testing the Cross-Tenant Attack Prevention functionality
 */

import { jest } from '@jest/globals';
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

describe('Access Control Utilities - Cross-Tenant Security', () => {
  // Test data
  const userId = 'user-123';
  const tenantId = 'tenant-456';
  const otherTenantId = 'tenant-789';
  const systemTenantId = 'system';
  const siteId = 'site-abc';
  let userAcl: ACL;
  
  beforeEach(() => {
    // Create a fresh ACL with basic permissions in the main tenant
    userAcl = {
      userId,
      entries: [
        {
          resource: { 
            type: 'category' as ResourceType, 
            tenantId,
            siteId 
          },
          permission: 'read' as Permission
        },
        {
          resource: { 
            type: 'listing' as ResourceType, 
            tenantId,
            siteId 
          },
          permission: 'read' as Permission
        }
      ]
    };
  });
  
  describe('detectCrossTenantAccess', () => {
    it('should return false for ACL with entries from only one tenant', () => {
      // Act
      const result = detectCrossTenantAccess(userAcl, tenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should return true when ACL has entries from multiple tenants', () => {
      // Arrange
      // Add an entry with a different tenant ID
      userAcl.entries.push({
        resource: { 
          type: 'category' as ResourceType, 
          tenantId: otherTenantId 
        },
        permission: 'read' as Permission
      });
      
      // Act
      const result = detectCrossTenantAccess(userAcl, tenantId);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should allow system tenant entries regardless of tenant context', () => {
      // Arrange
      // Add an entry with the system tenant
      userAcl.entries.push({
        resource: { 
          type: 'setting' as ResourceType, 
          tenantId: systemTenantId 
        },
        permission: 'read' as Permission
      });
      
      // Act
      const result = detectCrossTenantAccess(userAcl, tenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should return false for empty ACL', () => {
      // Arrange
      const emptyAcl: ACL = { userId, entries: [] };
      
      // Act
      const result = detectCrossTenantAccess(emptyAcl, tenantId);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should detect cross-tenant access in a complex ACL with nested permissions', () => {
      // Arrange
      // Create a more complex ACL with multiple permissions
      const complexAcl: ACL = {
        userId,
        entries: [
          // Regular permissions
          {
            resource: { type: 'category' as ResourceType, tenantId, siteId },
            permission: 'read' as Permission
          },
          {
            resource: { type: 'category' as ResourceType, tenantId, siteId },
            permission: 'update' as Permission
          },
          // System tenant permission (allowed)
          {
            resource: { type: 'setting' as ResourceType, tenantId: systemTenantId },
            permission: 'read' as Permission
          },
          // Cross-tenant permission (not allowed)
          {
            resource: { type: 'listing' as ResourceType, tenantId: otherTenantId, siteId: 'other-site' },
            permission: 'read' as Permission
          }
        ]
      };
      
      // Act
      const result = detectCrossTenantAccess(complexAcl, tenantId);
      
      // Assert
      expect(result).toBe(true);
    });
  });
  
  describe('getReferencedTenants', () => {
    it('should return all tenant IDs referenced in the ACL', () => {
      // Arrange
      // Add entries with different tenant IDs
      userAcl.entries.push({
        resource: { 
          type: 'setting' as ResourceType, 
          tenantId: otherTenantId 
        },
        permission: 'read' as Permission
      });
      
      userAcl.entries.push({
        resource: { 
          type: 'user' as ResourceType, 
          tenantId: systemTenantId 
        },
        permission: 'read' as Permission
      });
      
      // Act
      const result = getReferencedTenants(userAcl);
      
      // Assert
      expect(result).toHaveLength(3);
      expect(result).toContain(tenantId);
      expect(result).toContain(otherTenantId);
      expect(result).toContain(systemTenantId);
    });
    
    it('should return unique tenant IDs even when referenced multiple times', () => {
      // Arrange
      // Add multiple entries for the same tenant
      userAcl.entries.push({
        resource: { 
          type: 'listing' as ResourceType, 
          tenantId
        },
        permission: 'create' as Permission
      });
      
      userAcl.entries.push({
        resource: { 
          type: 'listing' as ResourceType, 
          tenantId
        },
        permission: 'update' as Permission
      });
      
      // Act
      const result = getReferencedTenants(userAcl);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(tenantId);
    });
    
    it('should return an empty array for empty ACL', () => {
      // Arrange
      const emptyAcl: ACL = { userId, entries: [] };
      
      // Act
      const result = getReferencedTenants(emptyAcl);
      
      // Assert
      expect(result).toHaveLength(0);
    });
  });
  
  // Integration tests for cross-tenant security with existing ACL functions
  describe('ACL management with cross-tenant security', () => {
    it('should detect cross-tenant access after granting permission to another tenant', () => {
      // Act - add a permission for another tenant
      const updatedAcl = grantPermission(
        userAcl,
        'category',
        'read',
        otherTenantId
      );
      
      // Assert - this should be detected as cross-tenant access
      expect(detectCrossTenantAccess(updatedAcl, tenantId)).toBe(true);
      expect(getReferencedTenants(updatedAcl)).toContain(otherTenantId);
    });
    
    it('should no longer detect cross-tenant access after revoking other tenant permissions', () => {
      // Arrange - start with cross-tenant ACL
      userAcl.entries.push({
        resource: { 
          type: 'category' as ResourceType, 
          tenantId: otherTenantId 
        },
        permission: 'read' as Permission
      });
      
      // Act - revoke the cross-tenant permission
      const updatedAcl = revokePermission(
        userAcl,
        'category',
        'read',
        otherTenantId
      );
      
      // Assert
      expect(detectCrossTenantAccess(updatedAcl, tenantId)).toBe(false);
      expect(getReferencedTenants(updatedAcl)).not.toContain(otherTenantId);
    });
    
    it('should create site admin ACL with no cross-tenant references', () => {
      // Act
      const siteAdminAcl = createSiteAdminACL(userId, tenantId, siteId);
      
      // Assert
      expect(detectCrossTenantAccess(siteAdminAcl, tenantId)).toBe(false);
      expect(getReferencedTenants(siteAdminAcl)).toEqual([tenantId]);
    });
    
    it('should create tenant admin ACL with no cross-tenant references', () => {
      // Act
      const tenantAdminAcl = createTenantAdminACL(userId, tenantId);
      
      // Assert
      expect(detectCrossTenantAccess(tenantAdminAcl, tenantId)).toBe(false);
      expect(getReferencedTenants(tenantAdminAcl)).toEqual([tenantId]);
    });
    
    it('should create super admin ACL with system tenant references but no unauthorized cross-tenant access', () => {
      // Act
      const superAdminAcl = createSuperAdminACL(userId);
      
      // Assert - detectCrossTenantAccess should not flag system tenant as cross-tenant
      expect(detectCrossTenantAccess(superAdminAcl, tenantId)).toBe(false);
      expect(detectCrossTenantAccess(superAdminAcl, systemTenantId)).toBe(false);
      
      // But getReferencedTenants should include system tenant
      expect(getReferencedTenants(superAdminAcl)).toEqual([systemTenantId]);
    });
  });
});