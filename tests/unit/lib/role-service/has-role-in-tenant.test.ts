/**
 * Tests for RoleService hasRoleInTenant functionality
 */

import { RoleService } from '@/lib/role-service';
import { redis } from '@/lib/redis-client';
import { getUserRolesKey } from '@/components/admin/auth/utils/roles';

// Test data
const testUserId = 'user-789';
const testTenantId = 'tenant-123';

describe('RoleService › hasRoleInTenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if user has any role in the tenant', async () => {
    // Arrange
    const roleIds = ['role-1'];
    jest.spyOn(redis, 'smembers').mockResolvedValueOnce(roleIds);
    
    // Act
    const result = await RoleService.hasRoleInTenant(testUserId, testTenantId);
    
    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(result).toBe(true);
  });
  
  it('should return false if user has no roles in the tenant', async () => {
    // Arrange
    jest.spyOn(redis, 'smembers').mockResolvedValueOnce([]);
    
    // Act
    const result = await RoleService.hasRoleInTenant(testUserId, testTenantId);
    
    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(result).toBe(false);
  });
  
  it('should handle Redis errors gracefully', async () => {
    // Arrange
    jest.spyOn(redis, 'smembers').mockRejectedValueOnce(new Error('Redis error'));
    
    // Act
    const result = await RoleService.hasRoleInTenant(testUserId, testTenantId);
    
    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(result).toBe(false);
  });
});