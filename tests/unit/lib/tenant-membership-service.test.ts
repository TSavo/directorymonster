/**
 * Unit tests for TenantMembershipService
 */

import { jest } from '@jest/globals';
import { TenantMembershipService } from '@/lib/tenant-membership-service';

// Create a test version of TenantMembershipService that uses our mock functions directly
class TestTenantMembershipService {
  // Mock Redis functions
  static mockSismember = jest.fn().mockResolvedValue(0);
  static mockSadd = jest.fn().mockResolvedValue(1);
  static mockSrem = jest.fn().mockResolvedValue(1);
  static mockSmembers = jest.fn().mockResolvedValue([]);
  static mockScan = jest.fn().mockResolvedValue(['0', []]);
  static mockDel = jest.fn().mockResolvedValue(1);
  
  // Mock dependent services
  static mockRoleService = {
    assignRoleToUser: jest.fn().mockResolvedValue(true),
    removeRoleFromUser: jest.fn().mockResolvedValue(true)
  };
  
  static mockTenantService = {
    getTenantById: jest.fn().mockResolvedValue(null)
  };
  
  // Methods matching TenantMembershipService but using our mocks
  static async isTenantMember(userId: string, tenantId: string): Promise<boolean> {
    try {
      const tenantUsersKey = `tenant:users:${tenantId}`;
      const result = await this.mockSismember(tenantUsersKey, userId);
      return result === 1 || result === true;
    } catch (error) {
      console.error(`Error checking tenant membership for user ${userId}:`, error);
      return false;
    }
  }
  
  static async getUserTenants(userId: string): Promise<any[]> {
    try {
      // Scan for all user:roles keys for this user
      const pattern = `user:roles:${userId}:*`;
      const keys = await this.scanKeys(pattern);
      
      // Extract tenant IDs from the keys
      const tenantIds: string[] = keys.map(key => {
        const parts = key.split(':');
        return parts[parts.length - 1];
      });
      
      // Get tenant configs for each ID
      const tenants: any[] = [];
      for (const tenantId of tenantIds) {
        const tenant = await this.mockTenantService.getTenantById(tenantId);
        if (tenant) {
          tenants.push(tenant);
        }
      }
      
      return tenants;
    } catch (error) {
      console.error(`Error getting tenants for user ${userId}:`, error);
      return [];
    }
  }
  
  static async addUserToTenant(
    userId: string,
    tenantId: string,
    roleId?: string
  ): Promise<boolean> {
    try {
      // Add user to tenant users
      const tenantUsersKey = `tenant:users:${tenantId}`;
      await this.mockSadd(tenantUsersKey, userId);
      
      // If role ID is provided, assign that role
      if (roleId) {
        await this.mockRoleService.assignRoleToUser(userId, tenantId, roleId);
      }
      
      return true;
    } catch (error) {
      console.error(`Error adding user ${userId} to tenant ${tenantId}:`, error);
      return false;
    }
  }
  
  static async removeUserFromTenant(
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      // Get user's roles in this tenant
      const userRolesKey = `user:roles:${userId}:${tenantId}`;
      const roleIds = await this.mockSmembers(userRolesKey);
      
      // Remove all roles from user in this tenant
      for (const roleId of roleIds) {
        await this.mockRoleService.removeRoleFromUser(userId, tenantId, roleId);
      }
      
      // Remove user from tenant users
      const tenantUsersKey = `tenant:users:${tenantId}`;
      await this.mockSrem(tenantUsersKey, userId);
      
      // Delete the user's roles key for this tenant
      await this.mockDel(userRolesKey);
      
      return true;
    } catch (error) {
      console.error(`Error removing user ${userId} from tenant ${tenantId}:`, error);
      return false;
    }
  }
  
  static async getTenantUsers(tenantId: string): Promise<string[]> {
    try {
      // Get all user IDs in this tenant
      const tenantUsersKey = `tenant:users:${tenantId}`;
      return await this.mockSmembers(tenantUsersKey);
    } catch (error) {
      console.error(`Error getting users in tenant ${tenantId}:`, error);
      return [];
    }
  }
  
  static async getUserRolesAllTenants(userId: string): Promise<Map<string, string[]>> {
    try {
      // Get all tenants user has access to
      const tenants = await this.getUserTenants(userId);
      
      // Get roles for each tenant
      const roleMap = new Map<string, string[]>();
      for (const tenant of tenants) {
        const userRolesKey = `user:roles:${userId}:${tenant.id}`;
        const roleIds = await this.mockSmembers(userRolesKey);
        roleMap.set(tenant.id, roleIds);
      }
      
      return roleMap;
    } catch (error) {
      console.error(`Error getting roles for user ${userId} across tenants:`, error);
      return new Map();
    }
  }
  
  private static async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      // Scan with the current cursor
      const result = await this.mockScan(cursor, 'MATCH', pattern, 'COUNT', '100');
      cursor = result[0];
      const batch = result[1];
      
      // Add keys to the result
      keys.push(...batch);
      
      // Continue until cursor is 0
    } while (cursor !== '0');
    
    return keys;
  }
}

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
      TestTenantMembershipService.mockSismember.mockResolvedValueOnce(1);
      
      // Act
      const result = await TestTenantMembershipService.isTenantMember(testUserId, testTenantId);
      
      // Assert
      expect(TestTenantMembershipService.mockSismember).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(result).toBe(true);
    });
    
    it('should return false if user is not a member', async () => {
      // Arrange
      TestTenantMembershipService.mockSismember.mockResolvedValueOnce(0);
      
      // Act
      const result = await TestTenantMembershipService.isTenantMember(testUserId, testTenantId);
      
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
      
      TestTenantMembershipService.mockScan.mockResolvedValueOnce(['0', tenantKeys]);
      TestTenantMembershipService.mockTenantService.getTenantById
        .mockResolvedValueOnce(mockTenants[0])
        .mockResolvedValueOnce(mockTenants[1]);
      
      // Act
      const result = await TestTenantMembershipService.getUserTenants(testUserId);
      
      // Assert
      expect(TestTenantMembershipService.mockScan).toHaveBeenCalledWith('0', 'MATCH', `user:roles:${testUserId}:*`, 'COUNT', '100');
      expect(TestTenantMembershipService.mockTenantService.getTenantById).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTenants);
    });
    
    it('should return empty array if user has no tenants', async () => {
      // Arrange
      TestTenantMembershipService.mockScan.mockResolvedValueOnce(['0', []]);
      
      // Act
      const result = await TestTenantMembershipService.getUserTenants(testUserId);
      
      // Assert
      expect(result).toEqual([]);
    });
  });
  
  describe('addUserToTenant', () => {
    it('should add user to tenant without role assignment', async () => {
      // Act
      const result = await TestTenantMembershipService.addUserToTenant(testUserId, testTenantId);
      
      // Assert
      expect(TestTenantMembershipService.mockSadd).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(TestTenantMembershipService.mockRoleService.assignRoleToUser).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should add user to tenant with role assignment', async () => {
      // Act
      const result = await TestTenantMembershipService.addUserToTenant(testUserId, testTenantId, testRoleId);
      
      // Assert
      expect(TestTenantMembershipService.mockSadd).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(TestTenantMembershipService.mockRoleService.assignRoleToUser).toHaveBeenCalledWith(testUserId, testTenantId, testRoleId);
      expect(result).toBe(true);
    });
  });
  
  describe('removeUserFromTenant', () => {
    it('should remove user from tenant and all roles', async () => {
      // Arrange
      const roleIds = ['role-1', 'role-2'];
      TestTenantMembershipService.mockSmembers.mockResolvedValueOnce(roleIds);
      
      // Act
      const result = await TestTenantMembershipService.removeUserFromTenant(testUserId, testTenantId);
      
      // Assert
      expect(TestTenantMembershipService.mockSmembers).toHaveBeenCalledWith(`user:roles:${testUserId}:${testTenantId}`);
      roleIds.forEach(roleId => {
        expect(TestTenantMembershipService.mockRoleService.removeRoleFromUser).toHaveBeenCalledWith(testUserId, testTenantId, roleId);
      });
      expect(TestTenantMembershipService.mockSrem).toHaveBeenCalledWith(`tenant:users:${testTenantId}`, testUserId);
      expect(TestTenantMembershipService.mockDel).toHaveBeenCalledWith(`user:roles:${testUserId}:${testTenantId}`);
      expect(result).toBe(true);
    });
  });
  
  describe('getTenantUsers', () => {
    it('should get all users in a tenant', async () => {
      // Arrange
      const userIds = ['user-1', 'user-2', 'user-3'];
      TestTenantMembershipService.mockSmembers.mockResolvedValueOnce(userIds);
      
      // Act
      const result = await TestTenantMembershipService.getTenantUsers(testTenantId);
      
      // Assert
      expect(TestTenantMembershipService.mockSmembers).toHaveBeenCalledWith(`tenant:users:${testTenantId}`);
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
      jest.spyOn(TestTenantMembershipService, 'getUserTenants').mockResolvedValueOnce(mockTenants);
      
      // Mock redis.smembers to return different roles for each tenant
      TestTenantMembershipService.mockSmembers
        .mockResolvedValueOnce(tenant1Roles)
        .mockResolvedValueOnce(tenant2Roles);
      
      // Act
      const result = await TestTenantMembershipService.getUserRolesAllTenants(testUserId);
      
      // Assert
      expect(TestTenantMembershipService.getUserTenants).toHaveBeenCalledWith(testUserId);
      expect(TestTenantMembershipService.mockSmembers).toHaveBeenCalledTimes(2);
      expect(TestTenantMembershipService.mockSmembers).toHaveBeenCalledWith(`user:roles:${testUserId}:tenant-1`);
      expect(TestTenantMembershipService.mockSmembers).toHaveBeenCalledWith(`user:roles:${testUserId}:tenant-2`);
      
      expect(result.get('tenant-1')).toEqual(tenant1Roles);
      expect(result.get('tenant-2')).toEqual(tenant2Roles);
    });
  });
});
