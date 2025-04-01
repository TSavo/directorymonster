/**
 * Tests for RoleService hasSpecificRole functionality
 */

import { RoleService } from '@/lib/role-service';
import { redis } from '@/lib/redis-client';
import { getUserRolesKey } from '@/components/admin/auth/utils/roles';

// Test data
const testUserId = 'user-789';
const testTenantId = 'tenant-123';
const testRoleId = 'role-456';

describe('RoleService › hasSpecificRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if user has the specific role', async () => {
    // Arrange - Create a direct mock for this specific test
    jest.spyOn(redis, 'smembers').mockResolvedValueOnce(['role-1', testRoleId, 'role-3']);
    
    // Act
    const result = await RoleService.hasSpecificRole(testUserId, testTenantId, testRoleId);
    
    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(result).toBe(true);
  });
  
  it('should return false if user does not have the specific role', async () => {
    // Arrange - Create a direct mock for this specific test
    jest.spyOn(redis, 'smembers').mockResolvedValueOnce(['role-1', 'role-3']);
    
    // Act
    const result = await RoleService.hasSpecificRole(testUserId, testTenantId, testRoleId);
    
    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(result).toBe(false);
  });

  it('should handle Redis errors gracefully', async () => {
    // Arrange - Mock Redis error
    jest.spyOn(redis, 'smembers').mockRejectedValueOnce(new Error('Redis connection error'));
    
    // Act
    const result = await RoleService.hasSpecificRole(testUserId, testTenantId, testRoleId);
    
    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(result).toBe(false);
  });
});