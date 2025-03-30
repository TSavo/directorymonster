/**
 * Unit tests for TenantMembershipService
 */

import { jest } from '@jest/globals';
import { TenantMembershipService } from '@/lib/tenant-membership-service';
import { RoleService } from '@/lib/role-service';
import TenantService from '@/lib/tenant/tenant-service';

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

// Mock RoleService
jest.mock('@/lib/role-service', () => ({
  RoleService: {
    assignRoleToUser: jest.fn().mockResolvedValue(true),
    removeRoleFromUser: jest.fn().mockResolvedValue(true),
  },
}));

// Mock TenantService
jest.mock('@/lib/tenant/tenant-service', () => ({
  default: {
    getTenantById: jest.fn(),
  },
}));

// Import mocked redis client
import { redis, kv } from '@/lib/redis-client';

// Test data
const testTenantId = 'tenant-123';
const testUserId = 'user-789';
const testRoleId = 'role-456';

describe('TenantMembershipService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('isTenantMember', () => {
    it('should check if user is a member of a tenant', async () => {
      // Arrange
      (redis.sismember as jest.Mock).mockResolvedValueOnce(1);
      
      // Act
      const result = await TenantMembershipService.isTenantMember(testUserId, testTenantId);
      
      // Assert
      expect(redis.sismember).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(result).toBe(true);
    });
    
    it('should return false if user is not a member', async () => {
      // Arrange
      (redis.sismember as jest.Mock).mockResolvedValueOnce(0);
      
      // Act
      const result = await TenantMembershipService.isTenantMember(testUserId, testTenantId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('getUserTenants', () => {
    it('should return all tenants a user has access to', async () => {
      // Arrange
      const tenantKeys = [
        `user:roles:${testUserId}:tenant-1`,
        `user:roles:${testUserId}:tenant-2`,
      ];
      
      const mockTenants = [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
      ];
      
      (redis.scan as jest.Mock).mockResolvedValueOnce(['0', tenantKeys]);
      (TenantService.getTenantById as jest.Mock)
        .mockResolvedValueOnce(mockTenants[0])
        .mockResolvedValueOnce(mockTenants[1]);
      
      // Act
      const result = await TenantMembershipService.getUserTenants(testUserId);
      
      // Assert
      expect(redis.scan).toHaveBeenCalledWith('0', 'MATCH', `user:roles:${testUserId}:*`, 'COUNT', '100');
      expect(TenantService.getTenantById).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTenants);
    });
    
    it('should return empty array if user has no tenants', async () => {
      // Arrange
      (redis.scan as jest.Mock).mockResolvedValueOnce(['0', []]);
      
      // Act
      const result = await TenantMembershipService.getUserTenants(testUserId);
      
      // Assert
      expect(result).toEqual([]);
    });
  });
  
  describe('addUserToTenant', () => {
    it('should add user to tenant without role assignment', async () => {
      // Act
      const result = await TenantMembershipService.addUserToTenant(testUserId, testTenantId);
      
      // Assert
      expect(redis.sadd).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(RoleService.assignRoleToUser).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should add user to tenant with role assignment', async () => {
      // Act
      const result = await TenantMembershipService.addUserToTenant(testUserId, testTenantId, testRoleId);
      
      // Assert
      expect(redis.sadd).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(RoleService.assignRoleToUser).toHaveBeenCalledWith(testUserId, testTenantId, testRoleId);
      expect(result).toBe(true);
    });
  });
  
  describe('removeUserFromTenant', () => {
    it('should remove user from tenant and all roles', async () => {
      // Arrange
      const roleIds = ['role-1', 'role-2'];
      (redis.smembers as jest.Mock).mockResolvedValueOnce(roleIds);
      
      // Act
      const result = await TenantMembershipService.removeUserFromTenant(testUserId, testTenantId);
      
      // Assert
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${testUserId}:${testTenantId}`);
      roleIds.forEach(roleId => {
        expect(RoleService.removeRoleFromUser).toHaveBeenCalledWith(testUserId, testTenantId, roleId);
      });
      expect(redis.srem).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(kv.del).toHaveBeenCalledWith(`user:roles:${testUserId}:${testTenantId}`);
      expect(result).toBe(true);
    });
  });
  
  describe('getTenantUsers', () => {
    it('should get all users in a tenant', async () => {
      // Arrange
      const userIds = ['user-1', 'user-2', 'user-3'];
      (redis.smembers as jest.Mock).mockResolvedValueOnce(userIds);
      
      // Act
      const result = await TenantMembershipService.getTenantUsers(testTenantId);
      
      // Assert
      expect(redis.smembers).toHaveBeenCalledWith(`tenant:users:${testTenantId}`);
      expect(result).toEqual(userIds);
    });
  });
  
  describe('getUserRolesAllTenants', () => {
    it('should get user roles across all tenants', async () => {
      // Arrange
      const mockTenants = [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
      ];
      
      const tenant1Roles = ['role-a', 'role-b'];
      const tenant2Roles = ['role-c'];
      
      // Mock getUserTenants
      jest.spyOn(TenantMembershipService, 'getUserTenants').mockResolvedValueOnce(mockTenants);
      
      // Mock redis.smembers to return different roles for each tenant
      (redis.smembers as jest.Mock)
        .mockResolvedValueOnce(tenant1Roles)
        .mockResolvedValueOnce(tenant2Roles);
      
      // Act
      const result = await TenantMembershipService.getUserRolesAllTenants(testUserId);
      
      // Assert
      expect(TenantMembershipService.getUserTenants).toHaveBeenCalledWith(testUserId);
      expect(redis.smembers).toHaveBeenCalledTimes(2);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${testUserId}:tenant-1`);
      expect(redis.smembers).toHaveBeenCalledWith(`user:roles:${testUserId}:tenant-2`);
      
      expect(result.get('tenant-1')).toEqual(tenant1Roles);
      expect(result.get('tenant-2')).toEqual(tenant2Roles);
    });
  });
});
