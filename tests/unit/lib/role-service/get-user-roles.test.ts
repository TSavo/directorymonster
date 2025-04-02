/**
 * Tests for RoleService getUserRoles functionality
 */

import { RoleService } from '@/lib/role-service';
import { redis } from '@/lib/redis-client';
import { getUserRolesKey } from '@/components/admin/auth/utils/roles';

// Test data
const testUserId = 'user-789';
const testTenantId = 'tenant-123';

describe('RoleService › getUserRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip($2, async () => {
    // Arrange
    const roleIds = ['role-1', 'role-2', 'role-3'];
    const mockRoles = [
      { id: 'role-1', name: 'Role 1', tenantId: testTenantId },
      { id: 'role-2', name: 'Role 2', tenantId: testTenantId },
      { id: 'role-3', name: 'Role 3', tenantId: testTenantId },
    ];
    
    // Mock the Redis calls
    jest.spyOn(redis, 'smembers').mockResolvedValueOnce(roleIds);
    
    // Mock the getRole method
    jest.spyOn(RoleService, 'getRole')
      .mockResolvedValueOnce(mockRoles[0])
      .mockResolvedValueOnce(mockRoles[1])
      .mockResolvedValueOnce(mockRoles[2]);
    
    // Act
    const result = await RoleService.getUserRoles(testUserId, testTenantId);
    
    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(RoleService.getRole).toHaveBeenCalledTimes(3);
    expect(result).toEqual(mockRoles);
  });
  
  it('should return empty array if user has no roles', async () => {
    // Arrange
    jest.spyOn(redis, 'smembers').mockResolvedValueOnce([]);
    
    // Act
    const result = await RoleService.getUserRoles(testUserId, testTenantId);
    
    // Assert
    expect(result).toEqual([]);
  });
  
  it.skip($2, async () => {
    // Arrange
    const roleIds = ['role-1', 'role-2', 'role-3'];
    const mockRoles = [
      { id: 'role-1', name: 'Role 1', tenantId: testTenantId },
      null, // Simulate a missing role
      { id: 'role-3', name: 'Role 3', tenantId: testTenantId },
    ];
    
    jest.spyOn(redis, 'smembers').mockResolvedValueOnce(roleIds);
    
    // Mock the getRole method
    jest.spyOn(RoleService, 'getRole')
      .mockResolvedValueOnce(mockRoles[0])
      .mockResolvedValueOnce(mockRoles[1])
      .mockResolvedValueOnce(mockRoles[2]);
    
    // Act
    const result = await RoleService.getUserRoles(testUserId, testTenantId);
    
    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(RoleService.getRole).toHaveBeenCalledTimes(3);
    // Should filter out the null role
    expect(result).toEqual([mockRoles[0], mockRoles[2]]);
  });
  
  it('should handle Redis errors during role retrieval', async () => {
    // Arrange
    jest.spyOn(redis, 'smembers').mockRejectedValueOnce(new Error('Redis error'));
    
    // Act
    const result = await RoleService.getUserRoles(testUserId, testTenantId);
    
    // Assert
    expect(result).toEqual([]);
    // Check that error was handled gracefully
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
  });
});