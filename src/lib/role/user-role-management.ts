/**
 * User-role management functions for assigning, removing, and checking roles
 */

import { redis } from '@/lib/redis-client';
import { 
  getUserRolesKey, 
  getTenantUsersKey
} from '@/components/admin/auth/utils/roles';
import AuditService from '@/lib/audit/audit-service';
import { scanKeys } from './utils';
import { GLOBAL_ROLE_USERS_KEY } from './constants';
import { getRole, getGlobalRole } from './role-operations';

/**
 * Assign a role to a user in a tenant
 * @param userId User ID
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @returns true if successful
 */
export async function assignRoleToUser(
  userId: string,
  tenantId: string,
  roleId: string
): Promise<boolean> {
  try {
    // First verify the role exists
    const role = await getRole(tenantId, roleId);
    let globalRole = null;

    // For global roles, also check the global role storage
    if (!role) {
      globalRole = await getGlobalRole(roleId);
      if (!globalRole) {
        throw new Error(`Role ${roleId} not found in tenant ${tenantId} or global roles`);
      }

      // Verify the assignee has permission to assign global roles
      // TODO: Add permission check here for global role assignment
    }

    // For global roles, add to the global role users index
    const isGlobalRole = (role && role.isGlobal) || (globalRole && globalRole.isGlobal);
    if (isGlobalRole) {
      // Map from user ID to role ID for all global role assignments
      await redis.sadd(GLOBAL_ROLE_USERS_KEY, userId);

      // Audit the global role assignment
      await AuditService.logEvent({
        action: 'global_role_assigned',
        resourceType: 'user',
        resourceId: userId,
        tenantId: tenantId,
        details: {
          roleId,
          roleName: role ? role.name : (globalRole ? globalRole.name : 'Unknown'),
          isGlobal: true
        }
      });
    } else {
      // Audit regular role assignment
      await AuditService.logRoleEvent(
        'system', // This should be replaced with actual user ID in production
        tenantId,
        'role_assigned',
        roleId,
        {
          userId,
          roleName: role ? role.name : 'Unknown'
        }
      );
    }

    // Add role to user's roles in this tenant
    const userRolesKey = getUserRolesKey(userId, tenantId);
    await redis.sadd(userRolesKey, roleId);

    // Add user to tenant users if not already there
    const tenantUsersKey = getTenantUsersKey(tenantId);
    await redis.sadd(tenantUsersKey, userId);

    return true;
  } catch (error) {
    console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
    return false;
  }
}

/**
 * Remove a role from a user in a tenant
 * @param userId User ID
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @returns true if successful
 */
export async function removeRoleFromUser(
  userId: string,
  tenantId: string,
  roleId: string
): Promise<boolean> {
  try {
    // Check if this is a global role
    const role = await getGlobalRole(roleId);
    
    // For global roles, update the global role users index
    if (role && role.isGlobal) {
      // Check if the user has this global role in any other tenant
      const pattern = `user:roles:${userId}:*`;
      const keys = await scanKeys(redis, pattern);
      
      let hasRoleInOtherTenants = false;
      for (const key of keys) {
        // Skip the current tenant
        if (key === getUserRolesKey(userId, tenantId)) {
          continue;
        }
        
        const hasRole = await redis.sismember(key, roleId);
        if (hasRole) {
          hasRoleInOtherTenants = true;
          break;
        }
      }
      
      // If the user no longer has this global role in any tenant,
      // remove them from the global role users index
      if (!hasRoleInOtherTenants) {
        await redis.srem(GLOBAL_ROLE_USERS_KEY, userId);
      }
      
      // Audit the global role removal
      await AuditService.logEvent({
        action: 'global_role_removed',
        resourceType: 'user',
        resourceId: userId,
        tenantId: tenantId,
        details: {
          roleId,
          roleName: role.name,
          isGlobal: true
        }
      });
    } else {
      // Audit regular role removal
      const localRole = await getRole(tenantId, roleId);
      if (localRole) {
        await AuditService.logRoleEvent(
          'system', // This should be replaced with actual user ID in production
          tenantId,
          'role_removed',
          roleId,
          {
            userId,
            roleName: localRole.name
          }
        );
      }
    }
    
    // Remove role from user's roles in this tenant
    const userRolesKey = getUserRolesKey(userId, tenantId);
    await redis.srem(userRolesKey, roleId);
    
    return true;
  } catch (error) {
    console.error(`Error removing role ${roleId} from user ${userId}:`, error);
    return false;
  }
}

/**
 * Get all roles assigned to a user in a tenant
 * @param userId User ID
 * @param tenantId Tenant ID
 * @returns Array of roles
 */
export async function getUserRoles(
  userId: string,
  tenantId: string
): Promise<any[]> {
  try {
    // Get role IDs for this user in this tenant
    const userRolesKey = getUserRolesKey(userId, tenantId);
    const roleIds = await redis.smembers(userRolesKey);
    
    // Get each role
    const roles: any[] = [];
    for (const roleId of roleIds) {
      // Try to get as a tenant role first
      let role = await getRole(tenantId, roleId);
      
      // If not found, try as a global role
      if (!role) {
        role = await getGlobalRole(roleId);
      }
      
      if (role) {
        roles.push(role);
      }
    }
    
    return roles;
  } catch (error) {
    console.error(`Error getting roles for user ${userId} in tenant ${tenantId}:`, error);
    return [];
  }
}

/**
 * Check if a user has any role in a tenant
 * @param userId User ID
 * @param tenantId Tenant ID
 * @returns true if user has any role
 */
export async function hasRoleInTenant(
  userId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const userRolesKey = getUserRolesKey(userId, tenantId);
    const roleIds = await redis.smembers(userRolesKey);
    return roleIds.length > 0;
  } catch (error) {
    console.error(`Error checking roles for user ${userId} in tenant ${tenantId}:`, error);
    return false;
  }
}

/**
 * Check if a user has a specific role in a tenant
 * @param userId User ID
 * @param tenantId Tenant ID
 * @param roleId Role ID to check
 * @returns true if user has the role
 */
export async function hasSpecificRole(
  userId: string,
  tenantId: string,
  roleId: string
): Promise<boolean> {
  try {
    const userRolesKey = getUserRolesKey(userId, tenantId);
    const roleIds = await redis.smembers(userRolesKey);
    
    // Use includes() to check if the roleId exists in the user's roles
    return Array.isArray(roleIds) && roleIds.includes(roleId);
  } catch (error) {
    console.error(`Error checking specific role for user ${userId} in tenant ${tenantId}:`, error);
    return false;
  }
}
