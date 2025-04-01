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
 * Assigns a specified role to a user within a tenant.
 *
 * The function verifies that the role exists either as a tenant-specific role or as a global role. If the role is global, it updates the global role users index and logs a global assignment event; otherwise, it logs a standard role assignment event. It then adds the role to the user's set of roles for the tenant and ensures the user is part of the tenant's user list.
 *
 * @param userId - Identifier of the user.
 * @param tenantId - Identifier of the tenant.
 * @param roleId - Identifier of the role to assign.
 * @returns A promise that resolves to true if the assignment is successful; otherwise, false.
 *
 * @remarks If the role is not found in both tenant-specific and global roles, or if an error occurs during the assignment, the error is logged and the function returns false.
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
 * Removes a role from a user within a tenant.
 *
 * This function handles both global and tenant-specific roles. For global roles,
 * it checks whether the user holds the role in other tenants. If not, the user is
 * removed from the global role index and a global role removal event is audited.
 * For tenant-specific roles, a local role removal event is audited before the role
 * is removed from the user's assigned roles in the tenant.
 *
 * @param userId - Unique identifier of the user.
 * @param tenantId - Identifier of the tenant from which the role is being removed.
 * @param roleId - Unique identifier of the role to remove.
 * @returns A boolean indicating whether the role removal was successful.
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
 * Retrieves all roles assigned to a user within a tenant.
 *
 * This asynchronous function fetches role IDs from Redis for the specified user and tenant,
 * then attempts to resolve each role ID to a role object by first checking tenant-specific roles and,
 * if not found, falling back to global roles. In case of an error during retrieval, it logs the error
 * and returns an empty array.
 *
 * @param userId - The unique identifier of the user.
 * @param tenantId - The tenant identifier from which roles are being retrieved.
 * @returns A promise that resolves to an array of role objects, or an empty array if retrieval fails.
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
 * Determines whether a user has any roles assigned within a specific tenant.
 *
 * This function retrieves the roles associated with the user in the tenant and returns true if one or more roles are found.
 * If an error occurs (such as issues accessing the role store), the error is logged and the function returns false.
 *
 * @param userId Unique identifier of the user.
 * @param tenantId Unique identifier of the tenant.
 * @returns True if the user has at least one role in the tenant, otherwise false.
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
 * Determines whether a specified role is assigned to a user within a tenant.
 *
 * Retrieves the user’s role identifiers for the given tenant and checks for the presence of the specified role.
 * Returns false if the role is not found or if an error occurs during the operation.
 *
 * @param userId - The identifier of the user.
 * @param tenantId - The identifier of the tenant.
 * @param roleId - The identifier of the role to check.
 * @returns True if the user has the specified role in the tenant; otherwise, false.
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
