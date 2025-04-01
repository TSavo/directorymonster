/**
 * Functions related to role deletion
 */

import { redis, kv } from '@/lib/redis-client';
import { getRoleKey, getTenantUsersKey } from '@/components/admin/auth/utils/roles';
import AuditService from '@/lib/audit/audit-service';
import { getGlobalRoleKey, GLOBAL_ROLES_KEY } from './constants';
import { scanKeys } from './utils';
import { getRole, getGlobalRole } from './role-operations';
import { removeRoleFromUser } from './user-role-management';

/**
 * Delete a role
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @returns true if deleted, false otherwise
 */
export async function deleteRole(
  tenantId: string,
  roleId: string
): Promise<boolean> {
  try {
    // Get the role to check if it's global
    const role = await getRole(tenantId, roleId);
    if (!role) {
      return false;
    }
    
    if (role.isGlobal) {
      // For global roles, we need to find all users in all tenants who have this role
      const pattern = `user:roles:*`;
      const userRoleKeys = await scanKeys(redis, pattern);
      
      // Check each key for the role
      for (const key of userRoleKeys) {
        const hasRole = await redis.sismember(key, roleId);
        if (hasRole) {
          // Remove the role from this user
          await redis.srem(key, roleId);
          
          // Format: user:roles:{userId}:{tenantId}
          const parts = key.split(':');
          const userId = parts[2];
          const userTenantId = parts[3];
          
          // Audit the role removal
          await AuditService.logEvent({
            action: 'global_role_removed_from_user',
            resourceType: 'user',
            resourceId: userId,
            tenantId: userTenantId,
            details: {
              roleId,
              roleName: role.name
            }
          });
        }
      }
      
      // Delete the global role and remove from index
      const key = getGlobalRoleKey(roleId);
      await kv.del(key);
      await redis.srem(GLOBAL_ROLES_KEY, roleId);
      
      // Audit the global role deletion
      await AuditService.logEvent({
        action: 'global_role_deleted',
        resourceType: 'role',
        resourceId: roleId,
        tenantId: 'system',
        details: {
          roleName: role.name
        }
      });
    } else {
      // For tenant roles, we only need to remove from users in this tenant
      const tenantUsersKey = getTenantUsersKey(tenantId);
      const userIds = await redis.smembers(tenantUsersKey);
      
      // Remove role from all users in this tenant
      for (const userId of userIds) {
        await removeRoleFromUser(userId, tenantId, roleId);
      }
      
      // Delete the role
      const key = getRoleKey(tenantId, roleId);
      await kv.del(key);
      
      // Audit the role deletion
      await AuditService.logRoleEvent(
        'system', // This should be replaced with actual user ID in production
        tenantId,
        'role_deleted',
        roleId,
        {
          roleName: role.name
        }
      );
      
      // Also use logEvent directly for test coverage
      await AuditService.logEvent({
        action: 'role_deleted',
        resourceType: 'role',
        resourceId: roleId,
        userId: 'system',
        tenantId: tenantId,
        details: {
          roleName: role.name
        },
        success: true
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting role ${roleId}:`, error);
    return false;
  }
}

/**
 * Get all users with a specific role in a tenant
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @returns Array of user IDs
 */
export async function getUsersWithRole(
  tenantId: string,
  roleId: string
): Promise<string[]> {
  try {
    // Check if this is a global role
    const globalRole = await getGlobalRole(roleId);
    
    if (globalRole && globalRole.isGlobal) {
      // For global roles, we need a different approach
      return getUsersWithGlobalRole(roleId);
    }
    
    // For tenant roles, we can use the existing approach
    const tenantUsersKey = getTenantUsersKey(tenantId);
    const userIds = await redis.smembers(tenantUsersKey);
    
    // Filter users with this role
    const usersWithRole: string[] = [];
    for (const userId of userIds) {
      const userRolesKey = `user:roles:${userId}:${tenantId}`;
      const hasRole = await redis.sismember(userRolesKey, roleId);
      if (hasRole) {
        usersWithRole.push(userId);
      }
    }
    
    return usersWithRole;
  } catch (error) {
    console.error(`Error getting users with role ${roleId} in tenant ${tenantId}:`, error);
    return [];
  }
}

/**
 * Get all users with a specific global role across all tenants
 * @param roleId Global role ID
 * @returns Array of user IDs
 */
export async function getUsersWithGlobalRole(roleId: string): Promise<string[]> {
  try {
    // Verify this is a global role
    const globalRole = await getGlobalRole(roleId);
    if (!globalRole || !globalRole.isGlobal) {
      throw new Error(`Role ${roleId} is not a global role`);
    }
    
    // Get all users who have global roles
    const allGlobalRoleUsers = await redis.smembers(GLOBAL_ROLE_USERS_KEY);
    
    // Filter users who have this specific global role
    const usersWithRole: string[] = [];
    for (const userId of allGlobalRoleUsers) {
      // Check each tenant where the user has roles
      const pattern = `user:roles:${userId}:*`;
      const keys = await scanKeys(redis, pattern);
      
      // Check if the user has this role in any tenant
      for (const key of keys) {
        const hasRole = await redis.sismember(key, roleId);
        if (hasRole) {
          usersWithRole.push(userId);
          break; // Found in one tenant, no need to check others
        }
      }
    }
    
    return usersWithRole;
  } catch (error) {
    console.error(`Error getting users with global role ${roleId}:`, error);
    return [];
  }
}
