import {
  hasPermission,
  grantPermission,
  revokePermission,
  createSiteAdminACL,
  createSuperAdminACL,
  createTenantAdminACL,
  type ACL,
  type ResourceType,
  type Permission,
  type Resource
} from '@/components/admin/auth/utils/accessControl';

describe('accessControl utility', () => {
  // Basic ACL for testing
  const createBasicACL = (userId: string): ACL => ({
    userId,
    entries: [
      {
        resource: { type: 'site', id: 'site1', tenantId: 'tenant1' },
        permission: 'read'
      }
    ]
  });

  describe('hasPermission function', () => {
    it('returns true for exact resource and permission match', () => {
      const acl = createBasicACL('user1');

      const result = hasPermission(acl, 'site', 'read', 'tenant1', 'site1', undefined);

      expect(result).toBe(true);
    });

    it('returns false for non-matching resource type', () => {
      const acl = createBasicACL('user1');

      const result = hasPermission(acl, 'category', 'read', 'tenant1', 'site1', undefined);

      expect(result).toBe(false);
    });

    it('returns false for non-matching permission', () => {
      const acl = createBasicACL('user1');

      const result = hasPermission(acl, 'site', 'update', 'tenant1', 'site1', undefined);

      expect(result).toBe(false);
    });

    it('returns false for non-matching resource ID', () => {
      const acl = createBasicACL('user1');

      const result = hasPermission(acl, 'site', 'read', 'tenant1', 'site2', undefined);

      expect(result).toBe(false);
    });

    it('handles site-wide permissions correctly', () => {
      const acl: ACL = {
        userId: 'user1',
        entries: [
          {
            resource: { type: 'category', siteId: 'site1', tenantId: 'tenant1' },
            permission: 'create'
          }
        ]
      };

      // Permission should apply to any category in the site
      expect(hasPermission(acl, 'category', 'create', 'tenant1', 'category1', 'site1')).toBe(true);
      expect(hasPermission(acl, 'category', 'create', 'tenant1', 'category2', 'site1')).toBe(true);

      // But not to categories in other sites
      expect(hasPermission(acl, 'category', 'create', 'tenant1', 'category1', 'site2')).toBe(false);
    });

    it('handles global permissions correctly', () => {
      const acl: ACL = {
        userId: 'user1',
        entries: [
          {
            resource: { type: 'user', tenantId: 'tenant1' },
            permission: 'read'
          }
        ]
      };

      // Permission should apply to any user resource
      expect(hasPermission(acl, 'user', 'read', 'tenant1', 'user1', undefined)).toBe(true);
      expect(hasPermission(acl, 'user', 'read', 'tenant1', 'user2', undefined)).toBe(true);
      expect(hasPermission(acl, 'user', 'read', 'tenant1', undefined, 'site1')).toBe(true);

      // But not to other resource types
      expect(hasPermission(acl, 'site', 'read', 'tenant1', 'site1', undefined)).toBe(false);
    });
  });

  describe('grantPermission function', () => {
    it('adds a new permission to ACL', () => {
      const acl = createBasicACL('user1');

      const newAcl = grantPermission(acl, 'category', 'update', 'tenant1', 'category1', 'site1');

      // Original ACL should be unchanged
      expect(acl.entries.length).toBe(1);

      // New ACL should have the additional permission
      expect(newAcl.entries.length).toBe(2);
      expect(newAcl.entries[1].resource.type).toBe('category');
      expect(newAcl.entries[1].resource.id).toBe('category1');
      expect(newAcl.entries[1].resource.siteId).toBe('site1');
      expect(newAcl.entries[1].permission).toBe('update');
    });

    it('does not duplicate existing permissions', () => {
      const acl = createBasicACL('user1');

      const newAcl = grantPermission(acl, 'site', 'read', 'tenant1', 'site1', undefined);

      // ACL should be unchanged since permission already exists
      expect(newAcl.entries.length).toBe(1);
      expect(newAcl).toEqual(acl);
    });
  });

  describe('revokePermission function', () => {
    it('removes a permission from ACL', () => {
      const acl = createBasicACL('user1');

      const newAcl = revokePermission(acl, 'site', 'read', 'tenant1', 'site1', undefined);

      // Original ACL should be unchanged
      expect(acl.entries.length).toBe(1);

      // New ACL should have no entries
      expect(newAcl.entries.length).toBe(0);
    });

    it('handles non-existent permissions gracefully', () => {
      const acl = createBasicACL('user1');

      const newAcl = revokePermission(acl, 'category', 'update', 'tenant1', 'category1', 'site1');

      // ACL should be unchanged since permission doesn't exist
      expect(newAcl.entries.length).toBe(1);
      expect(newAcl).toEqual(acl);
    });
  });

  describe('createSiteAdminACL function', () => {
    it('creates full admin permissions for a specific site', () => {
      const acl = createSiteAdminACL('user1', 'tenant1', 'site1');

      expect(acl.userId).toBe('user1');

      // Should have site management permission
      expect(hasPermission(acl, 'site', 'manage', 'tenant1', 'site1', undefined)).toBe(true);

      // Should have all category permissions for the site
      expect(hasPermission(acl, 'category', 'create', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'category', 'read', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'category', 'update', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'category', 'delete', 'tenant1', undefined, 'site1')).toBe(true);

      // Should have all listing permissions for the site
      expect(hasPermission(acl, 'listing', 'create', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'listing', 'read', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'listing', 'update', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'listing', 'delete', 'tenant1', undefined, 'site1')).toBe(true);

      // Should have all user permissions for the site
      expect(hasPermission(acl, 'user', 'create', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'user', 'read', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'user', 'update', 'tenant1', undefined, 'site1')).toBe(true);
      expect(hasPermission(acl, 'user', 'delete', 'tenant1', undefined, 'site1')).toBe(true);

      // But should not have global permissions
      expect(hasPermission(acl, 'site', 'manage', 'tenant1', 'site2', undefined)).toBe(false);
      expect(hasPermission(acl, 'site', 'create', 'tenant1', undefined, undefined)).toBe(false);
    });
  });

  describe('createSuperAdminACL function', () => {
    it('creates global permissions for all resource types', () => {
      const acl = createSuperAdminACL('user1');

      expect(acl.userId).toBe('user1');

      // Define all resource types and permissions to test
      const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting'];
      const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];

      // Test all combinations of resource types and permissions
      resourceTypes.forEach(resourceType => {
        permissions.forEach(permission => {
          // Should have global permission
          expect(hasPermission(acl, resourceType, permission, 'system', undefined, undefined)).toBe(true);

          // Should have specific resource permission
          expect(hasPermission(acl, resourceType, permission, 'system', 'resource1', undefined)).toBe(true);

          // Should have site-scoped permission
          expect(hasPermission(acl, resourceType, permission, 'system', undefined, 'site1')).toBe(true);

          // Should have specific resource and site permission
          expect(hasPermission(acl, resourceType, permission, 'system', 'resource1', 'site1')).toBe(true);
        });
      });
    });
  });
});
