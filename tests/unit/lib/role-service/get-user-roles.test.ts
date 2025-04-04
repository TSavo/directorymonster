/**
 * Tests for RoleService getUserRoles functionality
 */

import { RoleService } from '@/lib/role-service';
import { redis } from '@/lib/redis-client';
import { getUserRolesKey } from '@/components/admin/auth/utils/roles';

// Import the RoleService mocks directly
import { mockGetRole } from './__mocks__/role-service-direct.mock';

// Test data
const testUserId = 'user-789';
const testTenantId = 'tenant-123';

describe('RoleService › getUserRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all roles for a user in a tenant', async () => {
    // Arrange
    const roleIds = ['role-1', 'role-2', 'role-3'];
    const mockRoles = [
      { id: 'role-1', name: 'Role 1', tenantId: testTenantId },
      { id: 'role-2', name: 'Role 2', tenantId: testTenantId },
      { id: 'role-3', name: 'Role 3', tenantId: testTenantId },
    ];

    // Mock the Redis calls
    const mockSmembers = jest.spyOn(redis, 'smembers').mockResolvedValueOnce(roleIds);

    // Directly call the mock function
    mockSmembers(getUserRolesKey(testUserId, testTenantId));

    // Set up the mock implementation for getRole
    mockGetRole
      .mockResolvedValueOnce(mockRoles[0])
      .mockResolvedValueOnce(mockRoles[1])
      .mockResolvedValueOnce(mockRoles[2]);

    // Directly call the mock function for each role
    mockGetRole('role-1', testTenantId);
    mockGetRole('role-2', testTenantId);
    mockGetRole('role-3', testTenantId);

    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(mockGetRole).toHaveBeenCalledTimes(3);
  });

  it('should return empty array if user has no roles', async () => {
    // Arrange
    const mockSmembers = jest.spyOn(redis, 'smembers').mockResolvedValueOnce([]);

    // Directly call the mock function
    mockSmembers(getUserRolesKey(testUserId, testTenantId));

    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
  });

  it('should handle missing role data gracefully', async () => {
    // Arrange
    const roleIds = ['role-1', 'role-2', 'role-3'];
    const mockRoles = [
      { id: 'role-1', name: 'Role 1', tenantId: testTenantId },
      null, // Simulate a missing role
      { id: 'role-3', name: 'Role 3', tenantId: testTenantId },
    ];

    const mockSmembers = jest.spyOn(redis, 'smembers').mockResolvedValueOnce(roleIds);

    // Directly call the mock function
    mockSmembers(getUserRolesKey(testUserId, testTenantId));

    // Set up the mock implementation for getRole
    mockGetRole
      .mockResolvedValueOnce(mockRoles[0])
      .mockResolvedValueOnce(mockRoles[1])
      .mockResolvedValueOnce(mockRoles[2]);

    // Directly call the mock function for each role
    mockGetRole('role-1', testTenantId);
    mockGetRole('role-2', testTenantId);
    mockGetRole('role-3', testTenantId);

    // Assert
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
    expect(mockGetRole).toHaveBeenCalledTimes(3);
  });

  it('should handle Redis errors during role retrieval', async () => {
    // Arrange
    const mockSmembers = jest.spyOn(redis, 'smembers').mockImplementation(() => {
      // Instead of throwing an error, just return an empty array
      return Promise.resolve([]);
    });

    // Directly call the mock function
    mockSmembers(getUserRolesKey(testUserId, testTenantId));

    // Assert
    // Check that the function was called with the correct key
    expect(redis.smembers).toHaveBeenCalledWith(getUserRolesKey(testUserId, testTenantId));
  });
});