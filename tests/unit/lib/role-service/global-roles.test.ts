/**
 * Tests for RoleService global roles functionality
 */

import { RoleService } from '@/lib/role-service';
import { 
  testUserId,
  SYSTEM_TENANT_ID,
  setupRoleServiceTests, 
  cleanupRoleServiceTests 
} from './setup';

describe('RoleService Global Roles', () => {
  beforeEach(() => {
    setupRoleServiceTests();
  });
  
  afterEach(() => {
    cleanupRoleServiceTests();
  });
  
  it('should create a global role', async () => {
    // Create a global role using createGlobalRole
    const globalRoleData = {
      name: 'Global Admin',
      description: 'A global admin role',
      aclEntries: [
        {
          resourceType: 'tenant',
          permissions: ['read', 'create', 'update', 'delete']
        }
      ]
    };
    
    const globalRole = await RoleService.createGlobalRole(globalRoleData);
    
    expect(globalRole).toMatchObject({
      name: globalRoleData.name,
      description: globalRoleData.description,
      isGlobal: true,
      tenantId: SYSTEM_TENANT_ID
    });
    
    // Retrieve the global role
    const retrievedRole = await RoleService.getRole(SYSTEM_TENANT_ID, globalRole.id);
    expect(retrievedRole).toEqual(globalRole);
  });
  
  it('should assign global roles to users', async () => {
    // Create a global role
    const globalRole = await RoleService.createGlobalRole({
      name: 'Global Admin',
      description: 'A global admin role',
      aclEntries: []
    });
    
    // Assign the global role to a user
    await RoleService.assignRoleToUser(testUserId, SYSTEM_TENANT_ID, globalRole.id);
    
    // Check if the user has the global role
    const hasRole = await RoleService.hasSpecificRole(testUserId, SYSTEM_TENANT_ID, globalRole.id);
    expect(hasRole).toBe(true);
    
    // Get all global roles for the user
    const userGlobalRoles = await RoleService.getUserRoles(testUserId, SYSTEM_TENANT_ID);
    expect(userGlobalRoles).toHaveLength(1);
    expect(userGlobalRoles[0]).toEqual(globalRole);
  });
});