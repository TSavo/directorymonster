/**
 * Unit tests for RoleService using the built-in Redis memory fallback
 */

import { RoleService } from '@/lib/role-service';
import { redis, kv } from '@/lib/redis-client';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { createTenantAdminRole } from '@/components/admin/auth/utils/roles';

// Test data
const testTenantId = 'tenant-123';
const testRoleId = 'role-456';
const testUserId = 'user-789';

// Silence console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('RoleService with Built-in Redis Mock', () => {
  beforeEach(async () => {
    // Clear any existing data in the Redis mock
    const keys = await redis.keys('*');
    for (const key of keys) {
      await redis.del(key);
    }
    
    // Mock crypto.randomUUID for predictable IDs
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(testRoleId);
    
    // Mock Date.now for predictable timestamps
    const mockDate = new Date('2025-03-30T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('createRole', () => {
    it('should create a new role with generated ID and timestamps', async () => {
      // Arrange
      const roleData = createTenantAdminRole(testTenantId);
      
      // Act
      const result = await RoleService.createRole(roleData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(testRoleId);
      expect(result.tenantId).toBe(testTenantId);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      
      // Verify it was stored in Redis
      const storedRole = await kv.get(`role:${testTenantId}:${testRoleId}`);
      expect(storedRole).toEqual(result);
    });
  });
  
  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      // Arrange - Create a role first
      const roleData = createTenantAdminRole(testTenantId);
      const role = await RoleService.createRole(roleData);
      
      // Act
      const result = await RoleService.assignRoleToUser(testUserId, testTenantId, role.id);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify user has the role in Redis
      const userRoles = await redis.smembers(`user:roles:${testUserId}:${testTenantId}`);
      expect(userRoles).toContain(role.id);
      
      // Verify user is in the tenant
      const tenantUsers = await redis.smembers(`tenant:users:${testTenantId}`);
      expect(tenantUsers).toContain(testUserId);
    });
    
    it('should return false if role does not exist', async () => {
      // Act
      const result = await RoleService.assignRoleToUser(testUserId, testTenantId, 'non-existent-role');
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('removeRoleFromUser', () => {
    it('should remove a role from a user', async () => {
      // Arrange - Create a role and assign it to a user
      const roleData = createTenantAdminRole(testTenantId);
      const role = await RoleService.createRole(roleData);
      await RoleService.assignRoleToUser(testUserId, testTenantId, role.id);
      
      // Act
      const result = await RoleService.removeRoleFromUser(testUserId, testTenantId, role.id);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify role was removed
      const userRoles = await redis.smembers(`user:roles:${testUserId}:${testTenantId}`);
      expect(userRoles).not.toContain(role.id);
    });
  });
  
  describe('hasPermission', () => {
    it('should return true when user has the required permission', async () => {
      // Arrange - Create a role with the required permission and assign it to a user
      const roleData = {
        name: 'Test Role',
        description: 'A test role',
        tenantId: testTenantId,
        permissions: ['read:document']
      };
      const role = await RoleService.createRole(roleData);
      await RoleService.assignRoleToUser(testUserId, testTenantId, role.id);
      
      // Act
      const result = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'document' as ResourceType,
        'read' as Permission
      );
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false when user does not have the required permission', async () => {
      // Arrange - Create a role without the required permission and assign it to a user
      const roleData = {
        name: 'Test Role',
        description: 'A test role',
        tenantId: testTenantId,
        permissions: ['read:document'] // Only has read permission
      };
      const role = await RoleService.createRole(roleData);
      await RoleService.assignRoleToUser(testUserId, testTenantId, role.id);
      
      // Act - Check for write permission
      const result = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'document' as ResourceType,
        'write' as Permission
      );
      
      // Assert
      expect(result).toBe(false);
    });
  });
});