/**
 * Tests for RoleService handling multiple roles and users
 */

import { RoleService } from '@/lib/role-service';
import { 
  testTenantId, 
  testUserId,
  setupRoleServiceTests, 
  cleanupRoleServiceTests 
} from './setup';

describe('RoleService Multiple Roles and Users', () => {
  beforeEach(() => {
    setupRoleServiceTests();
  });
  
  afterEach(() => {
    cleanupRoleServiceTests();
  });
  
  it('should handle multiple roles for a user', async () => {
    // Create multiple roles
    const role1 = await RoleService.createRole({
      name: 'Role 1',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });
    
    const role2 = await RoleService.createRole({
      name: 'Role 2',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });
    
    // Assign both roles to the user
    await RoleService.assignRoleToUser(testUserId, testTenantId, role1.id);
    await RoleService.assignRoleToUser(testUserId, testTenantId, role2.id);
    
    // Get all roles for the user
    const userRoles = await RoleService.getUserRoles(testUserId, testTenantId);
    expect(userRoles).toHaveLength(2);
    expect(userRoles.map(r => r.id)).toContain(role1.id);
    expect(userRoles.map(r => r.id)).toContain(role2.id);
    
    // Delete one role
    await RoleService.deleteRole(testTenantId, role1.id);
    
    // Verify only one role remains
    const remainingRoles = await RoleService.getUserRoles(testUserId, testTenantId);
    expect(remainingRoles).toHaveLength(1);
    expect(remainingRoles[0].id).toBe(role2.id);
  });
  
  it('should handle multiple users with the same role', async () => {
    // Create a role
    const role = await RoleService.createRole({
      name: 'Shared Role',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    });
    
    // Assign the role to multiple users
    const user1 = 'user-1';
    const user2 = 'user-2';
    
    await RoleService.assignRoleToUser(user1, testTenantId, role.id);
    await RoleService.assignRoleToUser(user2, testTenantId, role.id);
    
    // Verify both users have the role
    const user1HasRole = await RoleService.hasSpecificRole(user1, testTenantId, role.id);
    const user2HasRole = await RoleService.hasSpecificRole(user2, testTenantId, role.id);
    
    expect(user1HasRole).toBe(true);
    expect(user2HasRole).toBe(true);
    
    // Remove the role from one user
    await RoleService.removeRoleFromUser(user1, testTenantId, role.id);
    
    // Verify only the second user still has the role
    const user1HasRoleAfter = await RoleService.hasSpecificRole(user1, testTenantId, role.id);
    const user2HasRoleAfter = await RoleService.hasSpecificRole(user2, testTenantId, role.id);
    
    expect(user1HasRoleAfter).toBe(false);
    expect(user2HasRoleAfter).toBe(true);
  });
});