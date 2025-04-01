/**
 * Tests for RoleService tenant isolation functionality
 */

import { RoleService } from '@/lib/role-service';
import { 
  testTenantId, 
  testTenantId2,
  testUserId,
  setupRoleServiceTests, 
  cleanupRoleServiceTests 
} from './setup';

describe('RoleService Tenant Isolation', () => {
  beforeEach(() => {
    setupRoleServiceTests();
  });
  
  afterEach(() => {
    cleanupRoleServiceTests();
  });
  
  it('should isolate roles by tenant', async () => {
    // Create roles in different tenants
    const role1 = await RoleService.createRole({
      name: 'Tenant 1 Role',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });
    
    const role2 = await RoleService.createRole({
      name: 'Tenant 2 Role',
      tenantId: testTenantId2,
      isGlobal: false,
      aclEntries: []
    });
    
    // Assign roles to users
    await RoleService.assignRoleToUser(testUserId, testTenantId, role1.id);
    await RoleService.assignRoleToUser(testUserId, testTenantId2, role2.id);
    
    // Verify user has correct roles in each tenant
    const tenant1Roles = await RoleService.getUserRoles(testUserId, testTenantId);
    const tenant2Roles = await RoleService.getUserRoles(testUserId, testTenantId2);
    
    expect(tenant1Roles).toHaveLength(1);
    expect(tenant1Roles[0].id).toBe(role1.id);
    expect(tenant1Roles[0].tenantId).toBe(testTenantId);
    
    expect(tenant2Roles).toHaveLength(1);
    expect(tenant2Roles[0].id).toBe(role2.id);
    expect(tenant2Roles[0].tenantId).toBe(testTenantId2);
    
    // Verify roles can't be accessed across tenants
    const hasRole1InTenant2 = await RoleService.hasSpecificRole(testUserId, testTenantId2, role1.id);
    const hasRole2InTenant1 = await RoleService.hasSpecificRole(testUserId, testTenantId, role2.id);
    
    expect(hasRole1InTenant2).toBe(false);
    expect(hasRole2InTenant1).toBe(false);
  });
  
  it('should prevent cross-tenant role assignments', async () => {
    // Create a role in tenant 1
    const role = await RoleService.createRole({
      name: 'Tenant 1 Role',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });
    
    // Try to assign the role to a user in tenant 2
    // This should fail because the role belongs to tenant 1
    const assignResult = await RoleService.assignRoleToUser(testUserId, testTenantId2, role.id);
    expect(assignResult).toBe(false);
    
    // Verify the user doesn't have the role in tenant 2
    const hasRole = await RoleService.hasSpecificRole(testUserId, testTenantId2, role.id);
    expect(hasRole).toBe(false);
  });
});