/**
 * Tests for RoleService audit logging functionality
 *
 * This test uses a simpler approach by mocking the RoleService methods
 * to verify that they call AuditService.logEvent correctly.
 */

// Mock the Redis module used by AuditService
jest.mock('@/lib/redis', () => ({
  __esModule: true,
  default: {
    set: jest.fn().mockResolvedValue('OK'),
    zadd: jest.fn().mockResolvedValue(1),
    zrange: jest.fn().mockResolvedValue([]),
    zrevrange: jest.fn().mockResolvedValue([]),
    zcount: jest.fn().mockResolvedValue(0),
    get: jest.fn().mockResolvedValue(null)
  }
}));

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

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  redis: {
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    sismember: jest.fn().mockResolvedValue(0),
    scan: jest.fn().mockImplementation((cursor, options, callback) => {
      if (typeof callback === 'function') {
        callback(null, ['0', []]);
      } else {
        return Promise.resolve(['0', []]);
      }
    }),
    zadd: jest.fn().mockResolvedValue(1)
  },
  kv: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockImplementation((key) => {
      if (key.includes('global')) {
        return Promise.resolve({
          id: 'global-role-id',
          name: 'Global Role',
          description: 'A global role',
          tenantId: 'system',
          isGlobal: true,
          aclEntries: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      return Promise.resolve(null);
    }),
    del: jest.fn().mockResolvedValue(1)
  }
}));

// Import after mocking
import { RoleService } from '@/lib/role-service';
import { AuditService } from '@/lib/audit/audit-service';

describe('RoleService Audit Logging', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock RoleService.scanKeys to avoid Redis dependency
    RoleService.scanKeys = jest.fn().mockResolvedValue([]);

    // Mock getRole and getGlobalRole methods
    RoleService.getRole = jest.fn().mockImplementation((tenantId, roleId) => {
      if (tenantId === 'system' && roleId === 'global-role-id') {
        return Promise.resolve({
          id: 'global-role-id',
          name: 'Global Test Role',
          description: 'A global role for testing',
          tenantId: 'system',
          isGlobal: true,
          aclEntries: [],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        });
      }
      return Promise.resolve(null);
    });

    RoleService.getGlobalRole = jest.fn().mockImplementation((roleId) => {
      if (roleId === 'global-role-id') {
        return Promise.resolve({
          id: 'global-role-id',
          name: 'Global Test Role',
          description: 'A global role for testing',
          tenantId: 'system',
          isGlobal: true,
          aclEntries: [],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('Global Role Operations', () => {
    it('should log audit events when updating global roles', async () => {
      // Update a global role
      await RoleService.updateRole('system', 'global-role-id', {
        description: 'Updated description'
      });

      // Verify that AuditService.logEvent was called with the correct parameters
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'global_role_updated',
          resourceType: 'role',
          resourceId: 'global-role-id',
          tenantId: 'system'
        })
      );
    });

    it('should log audit events when deleting global roles', async () => {
      // Delete a global role
      await RoleService.deleteRole('system', 'global-role-id');

      // Debug
      console.log('AuditService.logEvent mock calls:', AuditService.logEvent.mock.calls);

      // Verify that AuditService.logEvent was called with the correct parameters
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'global_role_deleted',
          resourceType: 'role',
          resourceId: 'global-role-id',
          tenantId: 'system'
        })
      );
    });
  });

  describe('User Role Assignment', () => {
    it('should log audit events when assigning global roles to users', async () => {
      // Mock the getRole method to return null first (tenant role not found)
      jest.spyOn(RoleService, 'getRole').mockResolvedValueOnce(null);

      // Mock the getGlobalRole method to return a global role
      const mockGlobalRole = {
        id: 'global-role-id',
        name: 'Global Role',
        description: 'A global role',
        tenantId: 'system',
        isGlobal: true,
        aclEntries: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      jest.spyOn(RoleService, 'getGlobalRole').mockResolvedValueOnce(mockGlobalRole);

      // Assign a global role to a user
      await RoleService.assignRoleToUser('test-user-id', 'test-tenant', 'global-role-id');

      // Verify that AuditService.logEvent was called with the correct parameters
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'global_role_assigned',
          resourceType: 'user',
          resourceId: 'test-user-id',
          tenantId: 'test-tenant'
        })
      );
    });

    it('should log audit events when removing global roles from users', async () => {
      // Remove a global role from a user
      await RoleService.removeRoleFromUser('test-user-id', 'test-tenant', 'global-role-id');

      // Verify that AuditService.logEvent was called with the correct parameters
      expect(AuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'global_role_removed',
          resourceType: 'user',
          resourceId: 'test-user-id',
          tenantId: 'test-tenant'
        })
      );
    });
  });
});