/**
 * Tenant-scoped Access Control system for DirectoryMonster
 * Extends the base ACL system with tenant isolation
 */

import { ResourceType, Permission } from './accessControl';
import { TenantMembershipService } from '@/lib/tenant-membership-service';
import { RoleService } from '@/lib/role-service';

/**
 * Check if a user has permission for a resource in a specific tenant context
 * 
 * @param userId User ID to check permissions for
 * @param tenantId Tenant ID context
 * @param resourceType Type of resource to check access for
 * @param permission Permission to check
 * @param resourceId Optional specific resource ID
 * @returns Promise resolving to boolean indicating if user has permission
 */
export async function hasPermissionInTenant(
  userId: string,
  tenantId: string,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string
): Promise<boolean> {
  try {
    // 1. Check if user is a member of the tenant
    const isMember = await TenantMembershipService.isTenantMember(userId, tenantId);
    if (!isMember) {
      return false;
    }

    // 2. Check if user has the required permission in this tenant context
    // Use the RoleService since it's already tenant-aware
    return await RoleService.hasPermission(
      userId,
      tenantId,
      resourceType,
      permission,
      resourceId
    );
  } catch (error) {
    console.error(
      `Error checking permission for user ${userId} in tenant ${tenantId}:`,
      error
    );
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions in a tenant
 * 
 * @param userId User ID to check permissions for
 * @param tenantId Tenant ID context
 * @param resourceType Type of resource to check access for
 * @param permissions Array of permissions to check (any match = true)
 * @param resourceId Optional specific resource ID
 * @returns Promise resolving to boolean indicating if user has any permission
 */
export async function hasAnyPermissionInTenant(
  userId: string,
  tenantId: string,
  resourceType: ResourceType,
  permissions: Permission[],
  resourceId?: string
): Promise<boolean> {
  try {
    // Check if user is a member of the tenant first
    const isMember = await TenantMembershipService.isTenantMember(userId, tenantId);
    if (!isMember) {
      return false;
    }

    // Check each permission
    for (const permission of permissions) {
      const hasPermission = await RoleService.hasPermission(
        userId,
        tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      if (hasPermission) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(
      `Error checking permissions for user ${userId} in tenant ${tenantId}:`,
      error
    );
    return false;
  }
}

/**
 * Check if a user has all of the specified permissions in a tenant
 * 
 * @param userId User ID to check permissions for
 * @param tenantId Tenant ID context
 * @param resourceType Type of resource to check access for
 * @param permissions Array of permissions to check (all must match = true)
 * @param resourceId Optional specific resource ID
 * @returns Promise resolving to boolean indicating if user has all permissions
 */
export async function hasAllPermissionsInTenant(
  userId: string,
  tenantId: string,
  resourceType: ResourceType,
  permissions: Permission[],
  resourceId?: string
): Promise<boolean> {
  try {
    // Check if user is a member of the tenant first
    const isMember = await TenantMembershipService.isTenantMember(userId, tenantId);
    if (!isMember) {
      return false;
    }

    // Check each permission
    for (const permission of permissions) {
      const hasPermission = await RoleService.hasPermission(
        userId,
        tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      if (!hasPermission) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(
      `Error checking permissions for user ${userId} in tenant ${tenantId}:`,
      error
    );
    return false;
  }
}

/**
 * Get all resources of a type that a user has a specific permission for in a tenant
 * 
 * @param userId User ID to check permissions for
 * @param tenantId Tenant ID context
 * @param resourceType Type of resources to check
 * @param permission Permission to check
 * @returns Promise resolving to array of resource IDs user has permission for
 */
export async function getAccessibleResourcesInTenant(
  userId: string,
  tenantId: string,
  resourceType: ResourceType,
  permission: Permission
): Promise<string[]> {
  try {
    // Check if user is a member of the tenant first
    const isMember = await TenantMembershipService.isTenantMember(userId, tenantId);
    if (!isMember) {
      return [];
    }

    // Get user's roles in this tenant
    const roles = await RoleService.getUserRoles(userId, tenantId);
    
    // Extract unique resource IDs from ACL entries that match criteria
    const resourceIds = new Set<string>();
    
    for (const role of roles) {
      // Filter ACL entries matching resourceType and permission
      const matchingEntries = role.aclEntries.filter(entry => 
        entry.resource.type === resourceType &&
        entry.permission === permission &&
        entry.resource.id && // Only consider entries with specific resource IDs
        (role.isGlobal || entry.resource.tenantId === tenantId)
      );
      
      // Add matching resource IDs to the set
      for (const entry of matchingEntries) {
        if (entry.resource.id) {
          resourceIds.add(entry.resource.id);
        }
      }
    }
    
    return Array.from(resourceIds);
  } catch (error) {
    console.error(
      `Error getting accessible resources for user ${userId} in tenant ${tenantId}:`,
      error
    );
    return [];
  }
}

/**
 * Check if a user can access any resource of a type in a tenant
 * 
 * @param userId User ID to check permissions for
 * @param tenantId Tenant ID context
 * @param resourceType Type of resources to check
 * @param permission Permission to check
 * @returns Promise resolving to boolean indicating if user has global permission
 */
export async function hasGlobalPermissionInTenant(
  userId: string,
  tenantId: string,
  resourceType: ResourceType,
  permission: Permission
): Promise<boolean> {
  try {
    // Check if user is a member of the tenant first
    const isMember = await TenantMembershipService.isTenantMember(userId, tenantId);
    if (!isMember) {
      return false;
    }

    // Get user's roles in this tenant
    const roles = await RoleService.getUserRoles(userId, tenantId);
    
    // Check if any role grants global permission for this resource type
    for (const role of roles) {
      const hasGlobalPermission = role.aclEntries.some(entry => 
        entry.resource.type === resourceType &&
        entry.permission === permission &&
        !entry.resource.id && // No specific resource ID means global permission
        (role.isGlobal || entry.resource.tenantId === tenantId)
      );
      
      if (hasGlobalPermission) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(
      `Error checking global permission for user ${userId} in tenant ${tenantId}:`,
      error
    );
    return false;
  }
}
