/**
 * Tests for RoleService audit logging functionality
 */

import { RoleService } from '@/lib/role-service';
import AuditService from '@/lib/audit/audit-service';
import { 
  testTenantId, 
  testUserId,
  SYSTEM_TENANT_ID,
  setupRoleServiceTests, 
  cleanupRoleServiceTests 
} from './setup';

// Mock the scanKeys method directly
jest.mock('@/lib/role-service', () => {
  const originalModule = jest.requireActual('@/lib/role-service');
  return {
    ...originalModule,
    RoleService: {
      ...originalModule.RoleService,
      scanKeys: jest.fn().mockResolvedValue([])
    }
  };
});

describe('RoleService Audit Logging', () => {
  beforeEach(() => {
    setupRoleServiceTests();
    
    // Ensure the mock is properly set up
    RoleService.scanKeys = jest.fn().mockResolvedValue([]);
  });
  
  afterEach(() => {
    cleanupRoleServiceTests();
  });
  
  it('should log audit events when creating roles', async () => {
    // Create a role
    const role = await RoleService.createRole({
      name: 'Audit Test Role',
      description: 'A test role for audit logging',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });
    
    // Verify audit event was logged
    expect(AuditService.logEvent).toHaveBeenCalled();
  });
  
  it('should log audit events when creating global roles', async () => {
    // Clear previous calls
    (AuditService.logEvent as jest.Mock).mockClear();
    
    // Create a global role
    const globalRole = await RoleService.createGlobalRole({
      name: 'Global Audit Test Role',
      description: 'A global role for audit testing',
      aclEntries: []
    });
    
    // Verify audit event was logged
    expect(AuditService.logEvent).toHaveBeenCalled();
  });
});