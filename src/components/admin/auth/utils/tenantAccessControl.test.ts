import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  hasPermissionInTenant,
  hasAnyPermissionInTenant,
  hasAllPermissionsInTenant,
  getAccessibleResourcesInTenant,
  hasGlobalPermissionInTenant
} from './tenantAccessControl';
import { TenantMembershipService } from '@/lib/tenant-membership-service';
import { RoleService } from '@/lib/role-service';
import { Role } from './roles';
import { ResourceType, Permission } from './accessControl';

// Mock dependencies
vi.mock('@/lib/tenant-membership-service', () => ({
  TenantMembershipService: {
    isTenantMember: vi.fn()
  }
}));

vi.mock('@/lib/role-service', () => ({
  RoleService: {
    hasPermission: vi.fn(),
    getUserRoles: vi.fn()
  }
}));

describe('Tenant Access Control', () => {
  const userId = 'user123';
  const tenantId = 'tenant456';
  const resourceType: ResourceType = 'category';
  const permission: Permission = 'read';
  const resourceId = 'resource789';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('hasPermissionInTenant', () => {
    it('should return false if user is not a tenant member', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(false);
      
      // Execute
      const result = await hasPermissionInTenant(userId, tenantId, resourceType, permission);
      
      // Verify
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should check permissions using RoleService if user is a tenant member', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(true);
      vi.mocked(RoleService.hasPermission).mockResolvedValue(true);
      
      // Execute
      const result = await hasPermissionInTenant(userId, tenantId, resourceType, permission, resourceId);
      
      // Verify
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        userId, tenantId, resourceType, permission, resourceId
      );
      expect(result).toBe(true);
    });

    it('should handle errors and return false', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockRejectedValue(new Error('Test error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Execute
      const result = await hasPermissionInTenant(userId, tenantId, resourceType, permission);
      
      // Verify
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBe(false);
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('hasAnyPermissionInTenant', () => {
    it('should return false if user is not a tenant member', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(false);
      
      // Execute
      const result = await hasAnyPermissionInTenant(
        userId, tenantId, resourceType, ['read', 'update']
      );
      
      // Verify
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return true if user has at least one permission', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(true);
      vi.mocked(RoleService.hasPermission)
        .mockResolvedValueOnce(false)  // First permission check fails
        .mockResolvedValueOnce(true);  // Second permission check succeeds
      
      // Execute
      const result = await hasAnyPermissionInTenant(
        userId, tenantId, resourceType, ['create', 'read']
      );
      
      // Verify
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(true);
      vi.mocked(RoleService.hasPermission).mockResolvedValue(false);
      
      // Execute
      const result = await hasAnyPermissionInTenant(
        userId, tenantId, resourceType, ['create', 'update']
      );
      
      // Verify
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissionsInTenant', () => {
    it('should return false if user is not a tenant member', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(false);
      
      // Execute
      const result = await hasAllPermissionsInTenant(
        userId, tenantId, resourceType, ['read', 'update']
      );
      
      // Verify
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return true if user has all permissions', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(true);
      vi.mocked(RoleService.hasPermission).mockResolvedValue(true);
      
      // Execute
      const result = await hasAllPermissionsInTenant(
        userId, tenantId, resourceType, ['create', 'read']
      );
      
      // Verify
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });

    it('should return false if user is missing any permission', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(true);
      vi.mocked(RoleService.hasPermission)
        .mockResolvedValueOnce(true)   // First permission check succeeds
        .mockResolvedValueOnce(false); // Second permission check fails
      
      // Execute
      const result = await hasAllPermissionsInTenant(
        userId, tenantId, resourceType, ['create', 'update']
      );
      
      // Verify
      expect(RoleService.hasPermission).toHaveBeenCalledTimes(2);
      expect(result).toBe(false);
    });
  });

  describe('getAccessibleResourcesInTenant', () => {
    it('should return empty array if user is not a tenant member', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(false);
      
      // Execute
      const result = await getAccessibleResourcesInTenant(userId, tenantId, resourceType, permission);
      
      // Verify
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.getUserRoles).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return resources from matching ACL entries', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(true);
      
      // Create mock roles with ACL entries
      const mockRoles: Role[] = [
        {
          id: 'role1',
          name: 'Role 1',
          description: 'Test role 1',
          tenantId,
          isGlobal: false,
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: 'resource1',
                tenantId
              },
              permission
            },
            {
              resource: {
                type: resourceType,
                id: 'resource2',
                tenantId
              },
              permission
            }
          ],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        },
        {
          id: 'role2',
          name: 'Role 2',
          description: 'Test role 2',
          tenantId,
          isGlobal: false,
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: 'resource2', // Duplicate to test deduplication
                tenantId
              },
              permission
            },
            {
              resource: {
                type: resourceType,
                id: 'resource3',
                tenantId
              },
              permission
            },
            {
              resource: {
                type: 'listing', // Different resource type
                id: 'listing1',
                tenantId
              },
              permission
            }
          ],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        }
      ];
      
      vi.mocked(RoleService.getUserRoles).mockResolvedValue(mockRoles);
      
      // Execute
      const result = await getAccessibleResourcesInTenant(userId, tenantId, resourceType, permission);
      
      // Verify
      expect(RoleService.getUserRoles).toHaveBeenCalledWith(userId, tenantId);
      expect(result).toHaveLength(3);
      expect(result).toContain('resource1');
      expect(result).toContain('resource2');
      expect(result).toContain('resource3');
      expect(result).not.toContain('listing1');
    });
  });

  describe('hasGlobalPermissionInTenant', () => {
    it('should return false if user is not a tenant member', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(false);
      
      // Execute
      const result = await hasGlobalPermissionInTenant(userId, tenantId, resourceType, permission);
      
      // Verify
      expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenantId);
      expect(RoleService.getUserRoles).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return true if user has global permission', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(true);
      
      // Create mock roles with ACL entries
      const mockRoles: Role[] = [
        {
          id: 'role1',
          name: 'Role 1',
          description: 'Test role 1',
          tenantId,
          isGlobal: false,
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: 'resource1', // Specific resource
                tenantId
              },
              permission
            }
          ],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        },
        {
          id: 'role2',
          name: 'Role 2',
          description: 'Test role 2',
          tenantId,
          isGlobal: false,
          aclEntries: [
            {
              resource: {
                type: resourceType,
                tenantId // No resource ID = global permission
              },
              permission
            }
          ],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        }
      ];
      
      vi.mocked(RoleService.getUserRoles).mockResolvedValue(mockRoles);
      
      // Execute
      const result = await hasGlobalPermissionInTenant(userId, tenantId, resourceType, permission);
      
      // Verify
      expect(RoleService.getUserRoles).toHaveBeenCalledWith(userId, tenantId);
      expect(result).toBe(true);
    });

    it('should return false if user has no global permission', async () => {
      // Setup
      vi.mocked(TenantMembershipService.isTenantMember).mockResolvedValue(true);
      
      // Create mock roles with only specific resource permissions
      const mockRoles: Role[] = [
        {
          id: 'role1',
          name: 'Role 1',
          description: 'Test role 1',
          tenantId,
          isGlobal: false,
          aclEntries: [
            {
              resource: {
                type: resourceType,
                id: 'resource1', // Specific resource
                tenantId
              },
              permission
            }
          ],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        }
      ];
      
      vi.mocked(RoleService.getUserRoles).mockResolvedValue(mockRoles);
      
      // Execute
      const result = await hasGlobalPermissionInTenant(userId, tenantId, resourceType, permission);
      
      // Verify
      expect(RoleService.getUserRoles).toHaveBeenCalledWith(userId, tenantId);
      expect(result).toBe(false);
    });
  });
});
