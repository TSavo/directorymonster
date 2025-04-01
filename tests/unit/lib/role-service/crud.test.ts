/**
 * Tests for RoleService CRUD operations
 */

import { RoleService } from '@/lib/role-service';
import { 
  testTenantId, 
  setupRoleServiceTests, 
  cleanupRoleServiceTests 
} from './setup';

describe('RoleService CRUD Operations', () => {
  beforeEach(() => {
    setupRoleServiceTests();
  });
  
  afterEach(() => {
    cleanupRoleServiceTests();
  });
  
  it('should create, retrieve, update, and delete a role', async () => {
    // 1. Create a role
    const roleData = {
      name: 'Test Role',
      description: 'A test role',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: []
    };
    
    const createdRole = await RoleService.createRole(roleData);
    expect(createdRole).toMatchObject({
      name: roleData.name,
      description: roleData.description,
      tenantId: roleData.tenantId,
      isGlobal: roleData.isGlobal
    });
    expect(createdRole.id).toBeDefined();
    
    const roleId = createdRole.id;
    
    // 2. Retrieve the role
    const retrievedRole = await RoleService.getRole(testTenantId, roleId);
    expect(retrievedRole).toEqual(createdRole);
    
    // 3. Update the role
    const updates = {
      name: 'Updated Role',
      description: 'An updated test role'
    };
    
    const updatedRole = await RoleService.updateRole(testTenantId, roleId, updates);
    expect(updatedRole).toMatchObject({
      id: roleId,
      name: updates.name,
      description: updates.description,
      tenantId: testTenantId,
      isGlobal: roleData.isGlobal
    });
    
    // Verify the update was persisted
    const retrievedUpdatedRole = await RoleService.getRole(testTenantId, roleId);
    expect(retrievedUpdatedRole).toEqual(updatedRole);
    
    // 4. Delete the role
    const deleteResult = await RoleService.deleteRole(testTenantId, roleId);
    expect(deleteResult).toBe(true);
    
    // Verify the role was deleted
    const retrievedDeletedRole = await RoleService.getRole(testTenantId, roleId);
    expect(retrievedDeletedRole).toBeNull();
  });
  
  it('should handle non-existent roles gracefully', async () => {
    // Try to get a non-existent role
    const nonExistentRole = await RoleService.getRole(testTenantId, 'non-existent-role');
    expect(nonExistentRole).toBeNull();
    
    // Try to update a non-existent role
    const updateResult = await RoleService.updateRole(testTenantId, 'non-existent-role', { name: 'Updated Name' });
    expect(updateResult).toBeNull();
  });
  
  it('should create a role with ACL entries', async () => {
    // Create a role with ACL entries
    const roleData = {
      name: 'Admin Role',
      description: 'Role with ACL entries',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: [
        {
          resourceType: 'user',
          permissions: ['read', 'create', 'update']
        },
        {
          resourceType: 'setting',
          permissions: ['read']
        }
      ]
    };
    
    const createdRole = await RoleService.createRole(roleData);
    expect(createdRole.aclEntries).toHaveLength(2);
    expect(createdRole.aclEntries[0].resourceType).toBe('user');
    expect(createdRole.aclEntries[0].permissions).toContain('read');
    expect(createdRole.aclEntries[0].permissions).toContain('create');
    expect(createdRole.aclEntries[0].permissions).toContain('update');
    expect(createdRole.aclEntries[1].resourceType).toBe('setting');
    expect(createdRole.aclEntries[1].permissions).toContain('read');
  });
  
  it('should update ACL entries for an existing role', async () => {
    // Create a role with initial ACL entries
    const roleData = {
      name: 'Admin Role',
      description: 'Role with ACL entries',
      tenantId: testTenantId,
      isGlobal: false,
      aclEntries: [
        {
          resourceType: 'user',
          permissions: ['read']
        }
      ]
    };
    
    const createdRole = await RoleService.createRole(roleData);
    
    // Update the role with new ACL entries
    const updates = {
      aclEntries: [
        {
          resourceType: 'user',
          permissions: ['read', 'create', 'update']
        },
        {
          resourceType: 'setting',
          permissions: ['read']
        }
      ]
    };
    
    const updatedRole = await RoleService.updateRole(testTenantId, createdRole.id, updates);
    expect(updatedRole.aclEntries).toHaveLength(2);
    expect(updatedRole.aclEntries[0].resourceType).toBe('user');
    expect(updatedRole.aclEntries[0].permissions).toContain('update');
    expect(updatedRole.aclEntries[1].resourceType).toBe('setting');
  });
});