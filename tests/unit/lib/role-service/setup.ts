/**
 * Common setup for RoleService tests
 */

import { redis, kv } from '@/lib/redis-client';
import AuditService from '@/lib/audit/audit-service';

// Test data
export const testTenantId = 'tenant-123';
export const testTenantId2 = 'tenant-456';
export const testUserId = 'user-789';
export const testUserId2 = 'user-101';
export const SYSTEM_TENANT_ID = 'system';

// Helper function to clear Redis store between tests
export const clearRedisStore = () => {
  if (redis.store && typeof redis.store.clear === 'function') {
    redis.store.clear();
  }
};

// Setup function to be called in beforeEach
export const setupRoleServiceTests = () => {
  clearRedisStore();
  
  // Mock Date.now for predictable timestamps
  const mockDate = new Date('2025-03-30T12:00:00Z');
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  
  // Mock Redis scan method which is used by scanKeys in RoleService
  redis.scan = jest.fn().mockImplementation((cursor, options, callback) => {
    if (typeof callback === 'function') {
      callback(null, ['0', []]);
    } else {
      return Promise.resolve(['0', []]);
    }
  });
  
  // Mock scanKeys method directly on RoleService
  jest.mock('@/lib/role-service', () => {
    const original = jest.requireActual('@/lib/role-service');
    return {
      ...original,
      RoleService: {
        ...original.RoleService,
        scanKeys: jest.fn().mockResolvedValue([])
      }
    };
  }, { virtual: true });
  
  // Mock AuditService
  jest.spyOn(AuditService, 'logEvent').mockImplementation(async (eventInput) => {
    return {
      ...eventInput,
      id: 'mock-audit-id',
      timestamp: new Date().toISOString(),
      severity: 'info'
    };
  });
  
  jest.spyOn(AuditService, 'logRoleEvent').mockImplementation(async (userId, tenantId, action, roleId, details) => {
    return {
      id: 'mock-audit-id',
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      action,
      resourceType: 'role',
      resourceId: roleId,
      details,
      severity: 'info',
      success: true
    };
  });
  
  jest.spyOn(AuditService, 'logPermissionEvent').mockImplementation(async (userId, tenantId, resourceType, permission, success, resourceId, details) => {
    return {
      id: 'mock-audit-id',
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      action: success ? 'access_granted' : 'access_denied',
      resourceType,
      resourceId,
      details: { permission, ...details },
      severity: success ? 'info' : 'warning',
      success
    };
  });
};

// Cleanup function to be called in afterEach
export const cleanupRoleServiceTests = () => {
  jest.restoreAllMocks();
  jest.resetModules();
};