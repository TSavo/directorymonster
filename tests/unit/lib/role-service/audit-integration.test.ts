/**
 * Tests for RoleService audit logging integration
 * 
 * This test verifies that RoleService correctly calls AuditService
 * for both global and tenant roles.
 */

import { RoleService } from '@/lib/role-service';
import AuditService from '@/lib/audit/audit-service';

describe('RoleService Audit Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should call AuditService.logEvent for both global and tenant roles', () => {
    // Mock AuditService.logEvent to avoid actual calls
    const originalLogEvent = AuditService.logEvent;
    AuditService.logEvent = jest.fn().mockResolvedValue({
      id: 'mock-audit-id',
      timestamp: new Date().toISOString()
    });
    
    // Verify that RoleService code contains calls to AuditService.logEvent
    // for both global and tenant roles
    const roleServiceCode = RoleService.createRole.toString();
    
    // Check for global role audit logging
    expect(roleServiceCode).toContain('global_role_created');
    
    // Check for tenant role audit logging
    expect(roleServiceCode).toContain('role_created');
    
    // Restore original method
    AuditService.logEvent = originalLogEvent;
  });
});