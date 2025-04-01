/**
 * Tests for RoleService user role assignment functionality
 */

import { RoleService } from '@/lib/role-service';
import { 
  testTenantId, 
  testUserId,
  setupRoleServiceTests, 
  cleanupRoleServiceTests 
} from './setup';

describe('RoleService User Role Assignment', () => {
  beforeEach(() => {
    setupRoleServiceTests();
  });
  
  afterEach(() => {
    cleanupRoleServiceTests();
  });
  
  it('should assign and check roles for a user', async () => {
    // 1. Create a role
    const roleData = {
      name: 'Test Role',
      description: 'A test role',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    };
    
    const createdRole = await RoleService.createRole(roleData);
    const roleId = createdRole.id;
    
    // 2. Assign the role to a user
    const assignResult = await RoleService.assignRoleToUser(testUserId, testTenantId, roleId);
    expect(assignResult).toBe(true);
    
    // 3. Check if the user has the role
    const hasRole = await RoleService.hasSpecificRole(testUserId, testTenantId, roleId);
    expect(hasRole).toBe(true);
    
    // 4. Check if the user has any role in the tenant
    const hasAnyRole = await RoleService.hasRoleInTenant(testUserId, testTenantId);
    expect(hasAnyRole).toBe(true);
    
    // 5. Get all roles for the user
    const userRoles = await RoleService.getUserRoles(testUserId, testTenantId);
    expect(userRoles).toHaveLength(1);
    expect(userRoles[0]).toEqual(createdRole);
    
    // 6. Remove the role from the user
    const removeResult = await RoleService.removeRoleFromUser(testUserId, testTenantId, roleId);
    expect(removeResult).toBe(true);
    
    // 7. Verify the role was removed
    const hasRoleAfterRemoval = await RoleService.hasSpecificRole(testUserId, testTenantId, roleId);
    expect(hasRoleAfterRemoval).toBe(false);
  });
  
  it('should handle assigning non-existent roles', async () => {
    // Try to assign a non-existent role
    const assignResult = await RoleService.assignRoleToUser(testUserId, testTenantId, 'non-existent-role');
    expect(assignResult).toBe(false);
    
    // Verify the user has no roles
    const hasAnyRole = await RoleService.hasRoleInTenant(testUserId, testTenantId);
    expect(hasAnyRole).toBe(false);
  });
});