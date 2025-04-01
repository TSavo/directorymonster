/**
 * Tests for RoleService audit logging functionality
 * 
 * This test uses the actual RoleService implementation and verifies
 * that it correctly logs audit events for both global and tenant roles.
 */

import { RoleService } from '@/lib/role-service';
import AuditService from '@/lib/audit/audit-service';
import { redis, kv } from '@/lib/redis-client';

// Create a spy on AuditService.logEvent to track calls
const logEventSpy = jest.spyOn(AuditService, 'logEvent');

// Mock Redis operations to avoid actual Redis calls
jest.spyOn(redis, 'sadd').mockResolvedValue(1);
jest.spyOn(redis, 'srem').mockResolvedValue(1);
jest.spyOn(redis, 'smembers').mockResolvedValue([]);
jest.spyOn(redis, 'sismember').mockResolvedValue(0);
jest.spyOn(kv, 'set').mockResolvedValue('OK');
jest.spyOn(kv, 'get').mockResolvedValue(null);
jest.spyOn(kv, 'del').mockResolvedValue(1);

describe('RoleService Audit Logging', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock RoleService.scanKeys to avoid Redis dependency
    RoleService.scanKeys = jest.fn().mockResolvedValue([]);
  });
  
  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });
  
  describe('Role Creation Audit Logging', () => {
    it('should log audit events when creating a global role', async () => {
      // Create a global role
      const role = await RoleService.createRole({
        name: 'Global Test Role',
        description: 'A global test role',
        tenantId: 'system',
        isGlobal: true,
        aclEntries: []
      });
      
      // Verify that AuditService.logEvent was called with the correct parameters
      expect(logEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'global_role_created',
          resourceType: 'role',
          resourceId: role.id,
          tenantId: 'system',
          details: expect.objectContaining({
            roleName: 'Global Test Role',
            isGlobal: true
          })
        })
      );
    });
    
    it('should log audit events when creating a regular tenant role', async () => {
      // Create a regular tenant role
      const role = await RoleService.createRole({
        name: 'Tenant Test Role',
        description: 'A tenant test role',
        tenantId: 'test-tenant',
        isGlobal: false,
        aclEntries: []
      });
      
      // Verify that AuditService.logEvent was called with the correct parameters
      expect(logEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'role_created',
          resourceType: 'role',
          resourceId: role.id,
          tenantId: 'test-tenant',
          details: expect.objectContaining({
            roleName: 'Tenant Test Role',
            isGlobal: false
          })
        })
      );
    });
  });
});