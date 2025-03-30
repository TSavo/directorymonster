/**
 * Unit tests for RoleService
 */

import { jest } from '@jest/globals';
import { RoleService } from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { createTenantAdminRole, createSuperAdminRole } from '@/components/admin/auth/utils/roles';

// Mock Redis client
jest.mock('@/lib/redis-client', () => {
  const mockSet = jest.fn().mockResolvedValue('OK');
  const mockGet = jest.fn();
  const mockDel = jest.fn().mockResolvedValue(1);
  const mockSadd = jest.fn().mockResolvedValue(1);
  const mockSrem = jest.fn().mockResolvedValue(1);
  const mockSmembers = jest.fn();
  const mockScan = jest.fn();
  const mockSismember = jest.fn();
  
  return {
    kv: {
      set: mockSet,
      get: mockGet,
      del: mockDel,
    },
    redis: {
      sadd: mockSadd,
      srem: mockSrem,
      smembers: mockSmembers,
      scan: mockScan,
      sismember: mockSismember,
    },
  };
});

// Import mocked redis client
import { redis, kv } from '@/lib/redis-client';

// Test data
const testTenantId = 'tenant-123';
const testRoleId = 'role-456';
const testUserId = 'user-789';

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock UUID generation for predictable IDs
    global.crypto = {
      randomUUID: jest.fn().mockReturnValue(testRoleId),
    } as any;
    
    // Mock Date.now for predictable timestamps
    const mockDate = new Date('2025-03-30T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });
  
  describe('createRole', () => {
    it('should create a new role with generated ID and timestamps', async () => {
      // Arrange
      const roleData = createTenantAdminRole(testTenantId);
      
      // Act
      const result = await RoleService.createRole(roleData);
      
      // Assert
      expect(kv.set).toHaveBeenCalledWith(
        `role:${testTenantId}:${testRoleId}`,
        expect.objectContaining({
          id: testRoleId,
          name: roleData.name,
          tenantId: testTenantId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
      
      expect(result).toEqual(expect.objectContaining({
        id: testRoleId,
        name: roleData.name,
        tenantId: testTenantId,
      }));
    });
    
    it('should throw an error if Redis operation fails', async () => {
      // Arrange
      const roleData = createTenantAdminRole(testTenantId);
      (kv.set as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));
      
      // Act & Assert
      await expect(RoleService.createRole(roleData)).rejects.toThrow('Failed to create role');
    });
  });
  
  describe('getRole', () => {
    it('should retrieve a role by ID', async () => {
      // Arrange
      const mockRole = {
        id: testRoleId,
        name: 'Test Role',
        tenantId: testTenantId,
      };
      (kv.get as jest.Mock).mockResolvedValueOnce(mockRole);
      
      // Act
      const result = await RoleService.getRole(testTenantId, testRoleId);
      
      // Assert
      expect(kv.get).toHaveBeenCalledWith(`role:${testTenantId}:${testRoleId}`);
      expect(result).toEqual(mockRole);
    });
    
    it('should return null if role is not found', async () => {
      // Arrange
      (kv.get as jest.Mock).mockResolvedValueOnce(null);
      
      // Act
      const result = await RoleService.getRole(testTenantId, testRoleId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('updateRole', () => {
    it('should update an existing role', async () => {
      // Arrange
      const existingRole = {
        id: testRoleId,
        name: 'Test Role',
        description: 'Original description',
        tenantId: testTenantId,
        isGlobal: false,
        aclEntries: [],
        createdAt: '2025-03-30T11:00:00Z',
        updatedAt: '2025-03-30T11:00:00Z',
      };
      
      const updates = {
        name: 'Updated Role',
        description: 'Updated description',
      };
      
      (kv.get as jest.Mock).mockResolvedValueOnce(existingRole);
      
      // Act
      const result = await RoleService.updateRole(testTenantId, testRoleId, updates);
      
      // Assert
      expect(kv.set).toHaveBeenCalledWith(
        `role:${testTenantId}:${testRoleId}`,
        expect.objectContaining({
          id: testRoleId,
          name: updates.name,
          description: updates.description,
          tenantId: testTenantId,
          updatedAt: expect.any(String),
          createdAt: existingRole.createdAt,
        })
      );
      
      expect(result).toEqual(expect.objectContaining({
        id: testRoleId,
        name: updates.name,
        description: updates.description,
        tenantId: testTenantId,
      }));
    });
    
    it('should return null if role is not found', async () => {
      // Arrange
      (kv.get as jest.Mock).mockResolvedValueOnce(null);
      
      // Act
      const result = await RoleService.updateRole(testTenantId, testRoleId, { name: 'Updated Role' });
      
      // Assert
      expect(result).toBeNull();
      expect(kv.set).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteRole', () => {
    it('should delete a role and remove it from all users', async () => {
      // Arrange
      const userIds = ['user-1', 'user-2', 'user-3'];
      (redis.smembers as jest.Mock).mockResolvedValueOnce(userIds);
      
      // Act
      const result = await RoleService.deleteRole(testTenantId, testRoleId);
      
      // Assert
      expect(redis.smembers).toHaveBeenCalledWith(`tenant:users:${testTenantId}`);
      userIds.forEach(userId => {
        expect(redis.srem).toHaveBeenCalledWith(`user:roles:${userId}:${testTenantId}`, testRoleId);
      });
      expect(kv.del).toHaveBeenCalledWith(`role:${testTenantId}:${testRoleId}`);
      expect(result).toBe(true);
    });
  });
  
  describe('assignRoleToUser', () => {
    it('should assign a role to a user and add user to tenant', async () => {
      // Arrange
      const mockRole = {
        id: testRoleId,
        name: 'Test Role',
        tenantId: testTenantId,
      };
      (kv.get as jest.Mock).mockResolvedValueOnce(mockRole);
      
      // Act
      const result = await RoleService.assignRoleToUser(testUserId, testTenantId, testRoleId);
      
      // Assert
      expect(kv.get).toHaveBeenCalledWith(`role:${testTenantId}:${testRoleId}`);
      expect(redis.sadd).toHaveBeenCalledWith(`user:roles:${testUserId}:${testTenantId}`, testRoleId);
      expect(redis.sadd).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(result).toBe(true);
    });
    
    it('should throw an error if role does not exist', async () => {
      // Arrange
      (kv.get as jest.Mock).mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(RoleService.assignRoleToUser(testUserId, testTenantId, testRoleId))
        .rejects.toThrow(`Role ${testRoleId} not found in tenant ${testTenantId}`);
    });
  });
  
  describe('getUserRoles', () => {
    it('should retrieve all roles for a user in a tenant', async () => {
      // Arrange
      const roleIds = ['role-1', 'role-2'];
      const mockRoles = [
        { id: 'role-1', name: 'Role 1', tenantId: testTenantId },
        { id: 'role-2', name: 'Role 2', tenantId: testTenantId },
      ];
      
      (redis.smembers as jest.Mock).mockResolvedValueOnce(roleIds);
      (kv.get as jest.Mock)
        .mockResolvedValueOnce(mockRoles[0])
        .mockResolvedValueOnce(mockRoles[1]);
      
      // Act
      const result = await RoleService.getUserRoles(testUserId, testTenantId);
      
      // Assert
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${testUserId}:${testTenantId}`);
      expect(kv.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockRoles);
    });
    
    it('should return empty array if user has no roles', async () => {
      // Arrange
      (redis.smembers as jest.Mock).mockResolvedValueOnce([]);
      
      // Act
      const result = await RoleService.getUserRoles(testUserId, testTenantId);
      
      // Assert
      expect(result).toEqual([]);
    });
  });
  
  describe('hasPermission', () => {
    it('should check if user has specific permission through their roles', async () => {
      // Arrange
      const mockRoles = [
        {
          id: 'role-1',
          name: 'Admin Role',
          tenantId: testTenantId,
          isGlobal: false,
          aclEntries: [{
            resource: {
              type: 'category' as ResourceType,
              tenantId: testTenantId,
            },
            permission: 'create' as Permission,
          }],
        },
      ];
      
      // Mock getUserRoles to return the mock roles
      jest.spyOn(RoleService, 'getUserRoles').mockResolvedValueOnce(mockRoles);
      
      // Act
      const result = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'category',
        'create'
      );
      
      // Assert
      expect(RoleService.getUserRoles).toHaveBeenCalledWith(testUserId, testTenantId);
      expect(result).toBe(true);
    });
    
    it('should return false if user does not have the permission', async () => {
      // Arrange
      const mockRoles = [
        {
          id: 'role-1',
          name: 'Viewer Role',
          tenantId: testTenantId,
          isGlobal: false,
          aclEntries: [{
            resource: {
              type: 'category' as ResourceType,
              tenantId: testTenantId,
            },
            permission: 'read' as Permission,
          }],
        },
      ];
      
      // Mock getUserRoles to return the mock roles
      jest.spyOn(RoleService, 'getUserRoles').mockResolvedValueOnce(mockRoles);
      
      // Act
      const result = await RoleService.hasPermission(
        testUserId,
        testTenantId,
        'category',
        'create'
      );
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
