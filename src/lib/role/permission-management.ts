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
 * Check if a user has a specific permission in a tenant
 * This method checks both tenant-specific roles and global roles
 * 
 * @param userId User ID
 * @param tenantId Tenant ID
 * @param resourceType Resource type
 * @param permission Permission to check
 * @param resourceId Optional specific resource ID
 * @returns true if user has permission
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
 * Get all global roles assigned to a user across all tenants
 * @param userId User ID
 * @returns Array of global roles
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
 * Check if a user has a specific global permission
 * This checks if the user has a global role with the specified permission
 * 
 * @param userId User ID
 * @param resourceType Resource type
 * @param permission Permission to check
 * @param tenantId Optional tenant context for the permission check
 * @param resourceId Optional specific resource ID
 * @returns true if user has the global permission
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
 * Check if a user has any global role
 * @param userId User ID
 * @returns true if user has any global role
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
 * Check if a user has a specific global permission in any tenant
 * This is a specialized version of hasGlobalPermission that checks across all tenants
 * 
 * @param userId User ID
 * @param resourceType Resource type
 * @param permission Permission to check
 * @returns true if user has the global permission in any tenant
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
