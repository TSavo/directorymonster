/**
 * @jest-environment node
 *
 * Tests for RoleService audit logging functionality
 *
 * This test verifies that the RoleService correctly logs audit events
 * for role operations (create, update, delete) for both global and tenant roles.
 */

import { RoleService } from '@/lib/role-service';
import AuditService from '@/lib/audit/audit-service';
import { redis } from '@/lib/redis-client';

// Test constants
const testTenantId = 'tenant-123';
const SYSTEM_TENANT_ID = 'system';
const testRoleId = 'role-456';
const testUserId = 'user-789';

// Mock UUID generation in the RoleService itself
const originalGenerateUUID = global.crypto.randomUUID;
global.crypto.randomUUID = jest.fn().mockReturnValue(testRoleId);

// Mock Date.now for predictable timestamps
const mockDate = new Date('2025-03-30T12:00:00Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

// Mock AuditService
jest.mock('@/lib/audit/audit-service', () => {
  return {
    __esModule: true,
    default: {
      logEvent: jest.fn().mockResolvedValue({
        id: 'mock-audit-id',
        timestamp: new Date().toISOString()
      }),
      logRoleEvent: jest.fn().mockResolvedValue({
        id: 'mock-audit-id',
        timestamp: new Date().toISOString()
      })
    }
  };
});

describe('RoleService Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Clear the in-memory Redis store
    if (global.inMemoryRedisStore) {
      global.inMemoryRedisStore.clear();
    }

    // Mock Redis scan method which is used by scanKeys in RoleService
    jest.spyOn(redis, 'scan').mockImplementation((cursor, options, callback) => {
      if (typeof callback === 'function') {
        callback(null, ['0', []]);
      } else {
        return Promise.resolve(['0', []]);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should log events for role operations', async () => {
    // Create a role - should trigger audit logging
    await RoleService.createRole({
      name: 'Test Role',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });

    // Verify audit logging was called
    expect(AuditService.logRoleEvent).toHaveBeenCalledWith(
      expect.any(String), // userId
      testTenantId,
      'role_created',
      testRoleId,
      expect.objectContaining({
        roleName: 'Test Role'
      })
    );
  });

  it('should log events for global role operations', async () => {
    // Create a global role - should trigger audit logging
    await RoleService.createGlobalRole({
      name: 'Global Test Role',
      aclEntries: []
    });

    // Verify audit logging was called
    expect(AuditService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'global_role_created',
        resourceType: 'role',
        resourceId: testRoleId,
        tenantId: SYSTEM_TENANT_ID
      })
    );
  });

  it('should log events when updating roles', async () => {
    // Create a role first
    const role = await RoleService.createRole({
      name: 'Test Role',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });

    // Clear mocks to isolate update event
    jest.clearAllMocks();

    // Update the role
    await RoleService.updateRole(
      testTenantId,
      role.id,
      { description: 'Updated description' }
    );

    // Verify audit logging was called
    expect(AuditService.logRoleEvent).toHaveBeenCalledWith(
      expect.any(String), // userId
      testTenantId,
      'role_updated',
      role.id,
      expect.objectContaining({
        roleName: 'Test Role',
        updates: ['description']
      })
    );
  });

  it('should log events when deleting roles', async () => {
    // Create a role first
    const role = await RoleService.createRole({
      name: 'Test Role',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });

    // Clear mocks to isolate delete event
    jest.clearAllMocks();

    // Delete the role
    await RoleService.deleteRole(testTenantId, role.id);

    // Verify audit logging was called
    expect(AuditService.logRoleEvent).toHaveBeenCalledWith(
      expect.any(String), // userId
      testTenantId,
      'role_deleted',
      role.id,
      expect.objectContaining({
        roleName: 'Test Role'
      })
    );
  });
});
