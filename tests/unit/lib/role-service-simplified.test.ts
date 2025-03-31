/**
 * Simplified unit tests for RoleService
 * Using the built-in Redis memory fallback
 */

// Import the module first so we can mock its internal functions
import * as RoleServiceModule from '@/lib/role-service';

// Mock the internal generateUUID function
const mockGenerateUUID = jest.fn().mockReturnValue('role-456');
const originalGenerateUUID = RoleServiceModule.generateUUID;
RoleServiceModule.generateUUID = mockGenerateUUID;

// Now import the rest
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
  // Restore the original function
  RoleServiceModule.generateUUID = originalGenerateUUID;
});

describe('RoleService Simplified Tests', () => {
  beforeEach(async () => {
    // Clear any existing data in the Redis mock
    const keys = await redis.keys('*');
    for (const key of keys) {
      await redis.del(key);
    }
    
    // Reset the mock
    mockGenerateUUID.mockClear();
    
    // Mock Date.now for predictable timestamps
    const mockDate = new Date('2025-03-30T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('removeRoleFromUser', () => {
    it('should remove a role from a user', async () => {
      // Arrange - Add a role to a user directly in Redis
      await redis.sadd(`user:roles:${testUserId}:${testTenantId}`, testRoleId);
      
      // Act
      const result = await RoleServiceModule.RoleService.removeRoleFromUser(testUserId, testTenantId, testRoleId);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify role was removed
      const userRoles = await redis.smembers(`user:roles:${testUserId}:${testTenantId}`);
      expect(userRoles).not.toContain(testRoleId);
    });
  });
  
  describe('assignRoleToUser', () => {
    it('should return false if role does not exist', async () => {
      // Act
      const result = await RoleServiceModule.RoleService.assignRoleToUser(testUserId, testTenantId, 'non-existent-role');
      
      // Assert
      expect(result).toBe(false);
    });
  });
});