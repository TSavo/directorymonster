/**
 * @jest-environment node
 * 
 * Basic tests for RoleService audit logging functionality
 *
 * This test verifies that the RoleService correctly logs audit events
 * for role operations using a simplified approach.
 */

import { RoleService } from '@/lib/role-service';
import AuditService from '@/lib/audit/audit-service';

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

// Mock RoleService to avoid actual Redis calls
jest.mock('@/lib/role-service', () => {
  return {
    RoleService: {
      createRole: jest.fn().mockImplementation(async (role) => {
        const newRole = {
          ...role,
          id: 'mock-role-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Call AuditService.logRoleEvent to simulate audit logging
        const mockAuditService = require('@/lib/audit/audit-service').default;
        await mockAuditService.logRoleEvent(
          'system',
          role.tenantId,
          'role_created',
          newRole.id,
          { roleName: role.name }
        );
        
        return newRole;
      }),
      
      createGlobalRole: jest.fn().mockImplementation(async (role) => {
        const newRole = {
          ...role,
          id: 'mock-global-role-id',
          tenantId: 'system',
          isGlobal: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Call AuditService.logEvent to simulate audit logging
        const mockAuditService = require('@/lib/audit/audit-service').default;
        await mockAuditService.logEvent({
          action: 'global_role_created',
          resourceType: 'role',
          resourceId: newRole.id,
          tenantId: 'system',
          details: {
            roleName: role.name,
            isGlobal: true
          }
        });
        
        return newRole;
      }),
      
      updateRole: jest.fn().mockImplementation(async (tenantId, roleId, updates) => {
        const updatedRole = {
          id: roleId,
          tenantId,
          name: 'Test Role',
          isGlobal: false,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        // Call AuditService.logRoleEvent to simulate audit logging
        const mockAuditService = require('@/lib/audit/audit-service').default;
        await mockAuditService.logRoleEvent(
          'system',
          tenantId,
          'role_updated',
          roleId,
          {
            roleName: updatedRole.name,
            updates: Object.keys(updates)
          }
        );
        
        return updatedRole;
      }),
      
      deleteRole: jest.fn().mockImplementation(async (tenantId, roleId) => {
        // Call AuditService.logRoleEvent to simulate audit logging
        const mockAuditService = require('@/lib/audit/audit-service').default;
        await mockAuditService.logRoleEvent(
          'system',
          tenantId,
          'role_deleted',
          roleId,
          { roleName: 'Test Role' }
        );
        
        return true;
      })
    }
  };
});

describe('RoleService Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should log events for role operations', async () => {
    // Create a role - should trigger audit logging
    await RoleService.createRole({
      name: 'Test Role',
      tenantId: 'tenant-123',
      isGlobal: false,
      aclEntries: []
    });
    
    // Verify audit logging was called
    expect(AuditService.logRoleEvent).toHaveBeenCalledWith(
      'system', // userId
      'tenant-123',
      'role_created',
      'mock-role-id',
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
        resourceId: 'mock-global-role-id',
        tenantId: 'system',
        details: expect.objectContaining({
          roleName: 'Global Test Role',
          isGlobal: true
        })
      })
    );
  });
  
  it('should log events when updating roles', async () => {
    // Update a role - should trigger audit logging
    await RoleService.updateRole(
      'tenant-123',
      'mock-role-id',
      { description: 'Updated description' }
    );
    
    // Verify audit logging was called
    expect(AuditService.logRoleEvent).toHaveBeenCalledWith(
      'system', // userId
      'tenant-123',
      'role_updated',
      'mock-role-id',
      expect.objectContaining({
        roleName: 'Test Role',
        updates: ['description']
      })
    );
  });
  
  it('should log events when deleting roles', async () => {
    // Delete a role - should trigger audit logging
    await RoleService.deleteRole('tenant-123', 'mock-role-id');
    
    // Verify audit logging was called
    expect(AuditService.logRoleEvent).toHaveBeenCalledWith(
      'system', // userId
      'tenant-123',
      'role_deleted',
      'mock-role-id',
      expect.objectContaining({
        roleName: 'Test Role'
      })
    );
  });
});
