/**
 * Permission management functions for checking permissions
 */

import { redis } from '@/lib/redis-client';
import { hasPermissionInTenant } from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { GLOBAL_ROLE_USERS_KEY, SYSTEM_TENANT_ID } from './constants';
import { scanKeys } from './utils';
import { getGlobalRole } from './role-operations';
import { getUserRoles } from './user-role-management';

/**
 * Determines whether a user possesses a specific permission within a tenant.
 *
 * The function retrieves the user's roles for the given tenant and checks if any role grants the specified permission on the target resource type and (optionally) a particular resource. If an error occurs during processing, the function logs the error and returns false.
 *
 * @param userId - The identifier of the user.
 * @param tenantId - The identifier of the tenant.
 * @param resourceType - The type of resource to check.
 * @param permission - The permission to verify.
 * @param resourceId - An optional identifier for a specific resource.
 * @returns A promise that resolves to true if the permission is granted; otherwise, false.
 */
export async function hasPermission(
  userId: string,
  tenantId: string,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string
): Promise<boolean> {
  try {
    // Get user's roles in this tenant
    const roles = await getUserRoles(userId, tenantId);
    
    // Check if any role grants this permission
    const permissionResult = hasPermissionInTenant(
      roles,
      resourceType,
      permission,
      tenantId,
      resourceId
    );
    
    return permissionResult;
  } catch (error) {
    console.error(`Error checking permission for user ${userId}:`, error);
    return false;
  }
}

/**
 * Retrieves all global role objects assigned to a user across all tenants.
 *
 * This function checks whether the user is listed among global role users in Redis. If so, it scans for tenant-specific role keys,
 * collects unique global role IDs, and fetches the complete role objects for each ID. If the user has no global roles or if an error occurs,
 * the function returns an empty array.
 *
 * @param userId The unique identifier of the user.
 * @returns A Promise that resolves to an array of global role objects.
 */
export async function getUserGlobalRoles(userId: string): Promise<any[]> {
  try {
    // Check if user has any global roles
    const hasGlobalRoles = await redis.sismember(GLOBAL_ROLE_USERS_KEY, userId);
    
    if (!hasGlobalRoles) {
      return [];
    }
    
    // Look for all tenants where the user has roles
    const pattern = `user:roles:${userId}:*`;
    const keys = await scanKeys(redis, pattern);
    
    // Get unique global role IDs across all tenants
    const globalRoleIds = new Set<string>();
    for (const key of keys) {
      const roleIds = await redis.smembers(key);
      
      for (const roleId of roleIds) {
        const role = await getGlobalRole(roleId);
        if (role) {
          globalRoleIds.add(roleId);
        }
      }
    }
    
    // Get the complete role objects
    const roles: any[] = [];
    for (const roleId of globalRoleIds) {
      const role = await getGlobalRole(roleId);
      if (role) {
        roles.push(role);
      }
    }
    
    return roles;
  } catch (error) {
    console.error(`Error getting global roles for user ${userId}:`, error);
    return [];
  }
}

/**
 * Determines whether a user possesses a specific global permission.
 *
 * This function retrieves all global roles assigned to the user and checks if any role grants the
 * specified permission for the given resource type. If no tenant is provided, the check defaults to
 * a system tenant context. The function returns false when the user has no global roles or if an
 * error is encountered during the process.
 *
 * @param userId The unique identifier of the user.
 * @param resourceType The type of resource to check the permission against.
 * @param permission The permission to verify.
 * @param tenantId (Optional) The tenant identifier providing context for the permission check.
 * @param resourceId (Optional) A specific resource identifier for a more granular check.
 * @returns True if the user has the specified global permission; otherwise, false.
 */
export async function hasGlobalPermission(
  userId: string,
  resourceType: ResourceType,
  permission: Permission,
  tenantId?: string,
  resourceId?: string
): Promise<boolean> {
  try {
    // Check if user has any global roles
    const globalRoles = await getUserGlobalRoles(userId);
    
    if (globalRoles.length === 0) {
      return false;
    }
    
    // For global permission checks without a tenant context, use system tenant
    const effectiveTenantId = tenantId || SYSTEM_TENANT_ID;
    
    // Check if any global role grants this permission in the tenant context
    return hasPermissionInTenant(
      globalRoles,
      resourceType,
      permission,
      effectiveTenantId,
      resourceId
    );
  } catch (error) {
    console.error(`Error checking global permission for user ${userId}:`, error);
    return false;
  }
}

/**
 * Determines if the specified user holds any global role.
 *
 * The function checks if the user is present in the global role users index and verifies that they have at least one global role
 * assigned. If either the index check fails or no roles are found, the function returns false.
 *
 * @param userId - The identifier of the user.
 * @returns A Promise that resolves to true if the user has any global role, otherwise false.
 */
export async function hasGlobalRole(userId: string): Promise<boolean> {
  try {
    // First, check if user is in the global role users index
    const isInGlobalRoleIndex = await redis.sismember(GLOBAL_ROLE_USERS_KEY, userId);
    
    if (!isInGlobalRoleIndex) {
      return false;
    }
    
    // Verify by checking actual global role assignments
    const globalRoles = await getUserGlobalRoles(userId);
    return globalRoles.length > 0;
  } catch (error) {
    console.error(`Error checking global roles for user ${userId}:`, error);
    return false;
  }
}

/**
 * Checks if the specified user has the given global permission across any tenant.
 *
 * This function retrieves the user's global roles and examines their access control entries to determine
 * whether any entry grants the specified permission for the provided resource type. It returns false if the
 * user has no global roles or if an error occurs during the checking process.
 *
 * @param userId - The identifier of the user.
 * @param resourceType - The type of resource for which the permission is verified.
 * @param permission - The global permission to assess.
 * @returns True if the user has the designated global permission in any tenant; otherwise, false.
 */
export async function hasGlobalPermissionAnyTenant(
  userId: string,
  resourceType: ResourceType,
  permission: Permission
): Promise<boolean> {
  try {
    // Get all global roles for this user
    const globalRoles = await getUserGlobalRoles(userId);
    
    if (globalRoles.length === 0) {
      return false;
    }
    
    // Check if any role grants this permission for the resource type
    // across any tenant (tenantId doesn't matter for this check)
    return globalRoles.some(role => 
      role.aclEntries.some((entry: any) => 
        entry?.resource?.type === resourceType && 
        entry?.permission === permission
      )
    );
  } catch (error) {
    console.error(`Error checking global permission for user ${userId}:`, error);
    return false;
  }
}
