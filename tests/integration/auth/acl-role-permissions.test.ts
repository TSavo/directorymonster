/**
 * ACL Integration Test - Role-Based Permissions
 * Tests role-based permission validation and inheritance
 */

import { 
  setupTestTenants, 
  setupTestUsersAndRoles, 
  cleanupTestData, 
  TEST_IDS
} from './acl-test-setup';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

describe('ACL Role-Based Permissions Integration Tests', () => {
  // Set up test data before all tests
  beforeAll(async () => {
    await setupTestTenants();
    await setupTestUsersAndRoles(
      { id: TEST_IDS.TENANT_A, name: 'Test Tenant A', hostname: 'test-a.example.com' },
      { id: TEST_IDS.TENANT_B, name: 'Test Tenant B', hostname: 'test-b.example.com' }
    );
  });

  // Clean up test data after all tests
  afterAll(async () => {
    await cleanupTestData();
  });

  // Test direct permission checks via RoleService
  test('should directly validate permissions through the role service', async () => {
    // Admin in tenant A should have full permissions
    const adminAHasPermission = await RoleService.hasPermission(
      TEST_IDS.USER_ADMIN_A,
      TEST_IDS.TENANT_A,
      'category',
      'manage'
    );
    expect(adminAHasPermission).toBe(true);
    
    // Regular user should have read-only access to listings
    const regularUserReadListing = await RoleService.hasPermission(
      TEST_IDS.USER_REGULAR,
      TEST_IDS.TENANT_A,
      'listing',
      'read'
    );
    expect(regularUserReadListing).toBe(true);
    
    // Regular user should not have manage permissions
    const regularUserManageListing = await RoleService.hasPermission(
      TEST_IDS.USER_REGULAR,
      TEST_IDS.TENANT_A,
      'listing',
      'manage'
    );
    expect(regularUserManageListing).toBe(false);
  });

  // Test cross-tenant permission checks
  test('should prevent cross-tenant permission checks', async () => {
    // Admin from tenant A should not have permissions in tenant B
    const adminACrossTenant = await RoleService.hasPermission(
      TEST_IDS.USER_ADMIN_A,
      TEST_IDS.TENANT_B,
      'listing',
      'manage'
    );
    expect(adminACrossTenant).toBe(false);
    
    // Admin from tenant B should not have permissions in tenant A
    const adminBCrossTenant = await RoleService.hasPermission(
      TEST_IDS.USER_ADMIN_B,
      TEST_IDS.TENANT_A,
      'listing',
      'manage'
    );
    expect(adminBCrossTenant).toBe(false);
  });

  // Test specific resource permissions
  test('should correctly validate permissions for specific resources', async () => {
    // Create a specific resource permission for the regular user
    const regularRoleId = TEST_IDS.ROLE_REGULAR;
    const specificListingId = 'specific-listing-123';
    
    // Modify role to add a specific resource permission
    const role = await RoleService.getRole(TEST_IDS.TENANT_A, regularRoleId);
    if (!role) {
      throw new Error('Regular role not found');
    }
    
    // Add specific resource permission
    const updatedRole = await RoleService.updateRole(
      TEST_IDS.TENANT_A,
      regularRoleId,
      {
        aclEntries: [
          ...role.aclEntries,
          {
            resource: {
              type: 'listing' as ResourceType,
              tenantId: TEST_IDS.TENANT_A,
              id: specificListingId
            },
            permission: 'update' as Permission
          }
        ]
      }
    );
    
    // Regular user should now have update permission for that specific listing
    const hasSpecificPermission = await RoleService.hasPermission(
      TEST_IDS.USER_REGULAR,
      TEST_IDS.TENANT_A,
      'listing',
      'update',
      specificListingId
    );
    expect(hasSpecificPermission).toBe(true);
    
    // But still not have update permission for other listings
    const hasGeneralUpdatePermission = await RoleService.hasPermission(
      TEST_IDS.USER_REGULAR,
      TEST_IDS.TENANT_A,
      'listing',
      'update',
      'other-listing-456'
    );
    expect(hasGeneralUpdatePermission).toBe(false);
  });
});
