/**
 * Implementation tests for RoleService
 *
 * These tests focus on the actual behavior of the RoleService rather than
 * the specific Redis method calls. This makes the tests more resilient to
 * implementation changes.
 */

// Mock the scanKeys function in utils.ts
jest.mock('@/lib/role/utils', () => {
  const originalModule = jest.requireActual('@/lib/role/utils');
  return {
    ...originalModule,
    scanKeys: jest.fn().mockImplementation(async (redisClient, pattern) => {
      // Simple implementation that uses the keys method instead of scan
      if (redisClient && redisClient.keys) {
        return await redisClient.keys(pattern);
      }
      return [];
    })
  };
});

// Mock the AuditService module
jest.mock('@/lib/audit/audit-service', () => {
  const mockLogEvent = jest.fn().mockResolvedValue({
    id: 'mock-audit-id',
    timestamp: new Date().toISOString()
  });

  // Create a mock class with the logEvent method
  const MockAuditService = {
    logEvent: mockLogEvent,
    logRoleEvent: jest.fn().mockResolvedValue({
      id: 'mock-audit-id',
      timestamp: new Date().toISOString()
    })
  };

  // Export both as default and named export to support both import styles
  return {
    __esModule: true,
    default: MockAuditService,
    AuditService: MockAuditService
  };
});

import { RoleService } from '@/lib/role-service';
import { redis, kv } from '@/lib/redis-client';

// Test data
const testTenantId = 'tenant-123';
const testRoleId = 'role-456';
const testUserId = 'user-789';

// Helper function to clear Redis store between tests
const clearRedisStore = () => {
  if (redis.store && typeof redis.store.clear === 'function') {
    redis.store.clear();
  }
};

describe('RoleService Implementation Tests', () => {
  beforeEach(() => {
    clearRedisStore();

    // Mock Date.now for predictable timestamps
    const mockDate = new Date('2025-03-30T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Role CRUD Operations', () => {
    it('should create, retrieve, update, and delete a role', async () => {
      // 1. Create a role
      const roleData = {
        name: 'Test Role',
        description: 'A test role',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: [
          {
            resourceType: 'user',
            permissions: ['read', 'create']
          }
        ]
      };

      const createdRole = await RoleService.createRole(roleData);
      expect(createdRole).toMatchObject({
        name: roleData.name,
        description: roleData.description,
        tenantId: roleData.tenantId,
        isGlobal: roleData.isGlobal,
        aclEntries: roleData.aclEntries
      });
      expect(createdRole.id).toBeDefined();

      const roleId = createdRole.id;

      // 2. Retrieve the role
      const retrievedRole = await RoleService.getRole(testTenantId, roleId);
      expect(retrievedRole).toEqual(createdRole);

      // 3. Update the role
      const updates = {
        name: 'Updated Role',
        description: 'An updated test role'
      };

      const updatedRole = await RoleService.updateRole(testTenantId, roleId, updates);
      expect(updatedRole).toMatchObject({
        id: roleId,
        name: updates.name,
        description: updates.description,
        tenantId: testTenantId,
        isGlobal: roleData.isGlobal,
        aclEntries: roleData.aclEntries
      });

      // Verify the update was persisted
      const retrievedUpdatedRole = await RoleService.getRole(testTenantId, roleId);
      expect(retrievedUpdatedRole).toEqual(updatedRole);

      // 4. Delete the role
      const deleteResult = await RoleService.deleteRole(testTenantId, roleId);
      expect(deleteResult).toBe(true);

      // Verify the role was deleted
      const retrievedDeletedRole = await RoleService.getRole(testTenantId, roleId);
      expect(retrievedDeletedRole).toBeNull();
    });

    it('should handle non-existent roles gracefully', async () => {
      // Try to get a non-existent role
      const nonExistentRole = await RoleService.getRole(testTenantId, 'non-existent-role');
      expect(nonExistentRole).toBeNull();

      // Try to update a non-existent role
      const updateResult = await RoleService.updateRole(testTenantId, 'non-existent-role', { name: 'Updated Name' });
      expect(updateResult).toBeNull();

      // Try to delete a non-existent role
      const deleteResult = await RoleService.deleteRole(testTenantId, 'non-existent-role');
      expect(deleteResult).toBe(false); // Deleting a non-existent role should return false
    });
  });

  describe('User Role Assignment', () => {
    it('should assign and check roles for a user', async () => {
      // 1. Create a role
      const roleData = {
        name: 'Test Role',
        description: 'A test role',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: []
      };

      const createdRole = await RoleService.createRole(roleData);
      const roleId = createdRole.id;

      // 2. Assign the role to a user
      const assignResult = await RoleService.assignRoleToUser(testUserId, testTenantId, roleId);
      expect(assignResult).toBe(true);

      // 3. Check if the user has the role
      const hasRole = await RoleService.hasSpecificRole(testUserId, testTenantId, roleId);
      expect(hasRole).toBe(true);

      // 4. Check if the user has any role in the tenant
      const hasAnyRole = await RoleService.hasRoleInTenant(testUserId, testTenantId);
      expect(hasAnyRole).toBe(true);

      // 5. Get all roles for the user
      const userRoles = await RoleService.getUserRoles(testUserId, testTenantId);
      expect(userRoles).toHaveLength(1);
      expect(userRoles[0]).toEqual(createdRole);

      // 6. Remove the role from the user
      const removeResult = await RoleService.removeRoleFromUser(testUserId, testTenantId, roleId);
      expect(removeResult).toBe(true);

      // 7. Verify the role was removed
      const hasRoleAfterRemoval = await RoleService.hasSpecificRole(testUserId, testTenantId, roleId);
      expect(hasRoleAfterRemoval).toBe(false);
    });

    it('should handle assigning non-existent roles', async () => {
      // Try to assign a non-existent role
      const assignResult = await RoleService.assignRoleToUser(testUserId, testTenantId, 'non-existent-role');
      expect(assignResult).toBe(false);

      // Verify the user has no roles
      const hasAnyRole = await RoleService.hasRoleInTenant(testUserId, testTenantId);
      expect(hasAnyRole).toBe(false);
    });
  });

  describe('Multiple Roles and Users', () => {
    it('should handle multiple roles for a user', async () => {
      // Create multiple roles
      const role1 = await RoleService.createRole({
        name: 'Role 1',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: []
      });

      const role2 = await RoleService.createRole({
        name: 'Role 2',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: []
      });

      // Assign both roles to the user
      await RoleService.assignRoleToUser(testUserId, testTenantId, role1.id);
      await RoleService.assignRoleToUser(testUserId, testTenantId, role2.id);

      // Get all roles for the user
      const userRoles = await RoleService.getUserRoles(testUserId, testTenantId);
      expect(userRoles).toHaveLength(2);
      expect(userRoles.map(r => r.id)).toContain(role1.id);
      expect(userRoles.map(r => r.id)).toContain(role2.id);

      // Delete one role
      await RoleService.deleteRole(testTenantId, role1.id);

      // Verify only one role remains
      const remainingRoles = await RoleService.getUserRoles(testUserId, testTenantId);
      expect(remainingRoles).toHaveLength(1);
      expect(remainingRoles[0].id).toBe(role2.id);
    });

    it('should handle multiple users with the same role', async () => {
      // Create a role
      const role = await RoleService.createRole({
        name: 'Shared Role',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: []
      });

      // Assign the role to multiple users
      const user1 = 'user-1';
      const user2 = 'user-2';

      await RoleService.assignRoleToUser(user1, testTenantId, role.id);
      await RoleService.assignRoleToUser(user2, testTenantId, role.id);

      // Verify both users have the role
      const user1HasRole = await RoleService.hasSpecificRole(user1, testTenantId, role.id);
      const user2HasRole = await RoleService.hasSpecificRole(user2, testTenantId, role.id);

      expect(user1HasRole).toBe(true);
      expect(user2HasRole).toBe(true);

      // Remove the role from one user
      await RoleService.removeRoleFromUser(user1, testTenantId, role.id);

      // Verify only the second user still has the role
      const user1HasRoleAfter = await RoleService.hasSpecificRole(user1, testTenantId, role.id);
      const user2HasRoleAfter = await RoleService.hasSpecificRole(user2, testTenantId, role.id);

      expect(user1HasRoleAfter).toBe(false);
      expect(user2HasRoleAfter).toBe(true);
    });
  });

  describe('Global Roles', () => {
    it('should create and manage global roles', async () => {
      // Create a global role
      const globalRole = await RoleService.createGlobalRole({
        name: 'Global Admin',
        description: 'A global admin role',
        aclEntries: [
          {
            resourceType: 'tenant',
            permissions: ['read', 'create', 'update', 'delete']
          }
        ]
      });

      expect(globalRole).toMatchObject({
        name: 'Global Admin',
        description: 'A global admin role',
        isGlobal: true
      });

      // Assign the global role to a user
      const assignResult = await RoleService.assignGlobalRoleToUser(testUserId, globalRole.id);
      expect(assignResult).toBe(true);

      // Check if the user has the global role
      const hasGlobalRole = await RoleService.hasGlobalRole(testUserId, globalRole.id);
      expect(hasGlobalRole).toBe(true);

      // Get all global roles for the user
      const userGlobalRoles = await RoleService.getUserGlobalRoles(testUserId);
      expect(userGlobalRoles).toHaveLength(1);
      expect(userGlobalRoles[0]).toEqual(globalRole);

      // Remove the global role from the user
      const removeResult = await RoleService.removeGlobalRoleFromUser(testUserId, globalRole.id);
      expect(removeResult).toBe(true);

      // Verify the role was removed
      const hasGlobalRoleAfter = await RoleService.hasGlobalRole(testUserId, globalRole.id);
      expect(hasGlobalRoleAfter).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    it('should correctly check permissions for a user', async () => {
      // Create a role with specific permissions
      const role = await RoleService.createRole({
        name: 'User Manager',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: [
          {
            resource: {
              type: 'user',
              tenantId: testTenantId
            },
            permission: 'read'
          },
          {
            resource: {
              type: 'user',
              tenantId: testTenantId
            },
            permission: 'create'
          }
        ]
      });

      // Assign the role to a user
      await RoleService.assignRoleToUser(testUserId, testTenantId, role.id);

      // Check permissions the user should have
      const canReadUsers = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'user',
        'read'
      );
      expect(canReadUsers).toBe(true);

      const canCreateUsers = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'user',
        'create'
      );
      expect(canCreateUsers).toBe(true);

      // Check permissions the user should NOT have
      const canUpdateUsers = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'user',
        'update'
      );
      expect(canUpdateUsers).toBe(false);

      const canReadSettings = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'setting',
        'read'
      );
      expect(canReadSettings).toBe(false);
    });

    it('should check permissions across multiple roles', async () => {
      // Create two roles with different permissions
      const role1 = await RoleService.createRole({
        name: 'User Reader',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: [
          {
            resource: {
              type: 'user',
              tenantId: testTenantId
            },
            permission: 'read'
          }
        ]
      });

      const role2 = await RoleService.createRole({
        name: 'Settings Manager',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: [
          {
            resource: {
              type: 'setting',
              tenantId: testTenantId
            },
            permission: 'read'
          },
          {
            resource: {
              type: 'setting',
              tenantId: testTenantId
            },
            permission: 'update'
          }
        ]
      });

      // Assign both roles to the user
      await RoleService.assignRoleToUser(testUserId, testTenantId, role1.id);
      await RoleService.assignRoleToUser(testUserId, testTenantId, role2.id);

      // Check permissions from the first role
      const canReadUsers = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'user',
        'read'
      );
      expect(canReadUsers).toBe(true);

      // Check permissions from the second role
      const canUpdateSettings = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'setting',
        'update'
      );
      expect(canUpdateSettings).toBe(true);

      // Check a permission that should be missing
      const canDeleteUsers = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'user',
        'delete'
      );
      expect(canDeleteUsers).toBe(false);
    });
  });
});