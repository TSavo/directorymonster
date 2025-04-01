/**
 * Tests for tenant role audit logging
 */

import { 
  logTenantRoleUpdate, 
  logTenantRoleDelete 
} from '@/lib/role-service/tenant-role-audit';
import { AuditService } from '@/lib/audit/audit-service';

// Mock dependencies
jest.mock('@/lib/audit/audit-service');

describe('Tenant Role Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logTenantRoleUpdate', () => {
    it('should log an audit event for tenant role update', async () => {
      await logTenantRoleUpdate(
        'test-role-id',
        'test-tenant',
        'Test Role',
        ['name', 'description']
      );
      
      expect(AuditService.logEvent).toHaveBeenCalledWith({
        action: 'role_updated',
        resourceType: 'role',
        resourceId: 'test-role-id',
        tenantId: 'test-tenant',
        details: {
          roleName: 'Test Role',
          updates: ['name', 'description']
        }
      });
    });
  });

  describe('logTenantRoleDelete', () => {
    it('should log an audit event for tenant role deletion', async () => {
      await logTenantRoleDelete(
        'test-role-id',
        'test-tenant',
        'Test Role'
      );
      
      expect(AuditService.logEvent).toHaveBeenCalledWith({
        action: 'role_deleted',
        resourceType: 'role',
        resourceId: 'test-role-id',
        tenantId: 'test-tenant',
        details: {
          roleName: 'Test Role'
        }
      });
    });
  });
});