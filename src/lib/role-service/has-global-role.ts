/**
 * Check if a user has any global role
 * Global roles can perform cross-tenant operations
 * 
 * This is extracted from RoleService for better modularity
 */

import { RoleService } from '../role-service';

/**
 * Checks whether the specified user has any global roles across all tenants.
 *
 * This asynchronous function scans the tenant-specific role keys associated with the user, retrieves the
 * roles for each tenant, and checks if any role is marked as global. It returns `true` immediately upon 
 * finding a global role. If no global roles are found or if an error occurs during the process, the function
 * returns `false` while logging the error.
 *
 * @param userId - The unique identifier of the user to check.
 * @returns A promise that resolves to `true` if the user has any global role; otherwise, `false`.
 */
export async function hasGlobalRole(userId: string): Promise<boolean> {
  try {
    // Look for any tenant where the user has roles
    const allRolesPattern = `user:roles:${userId}:*`;
    const roleKeys = await RoleService.scanKeys(allRolesPattern);
    
    // Check each tenant for the user's roles
    for (const key of roleKeys) {
      // Extract tenant ID from the key (format: user:roles:{userId}:{tenantId})
      const tenantId = key.split(':')[3];
      
      // Get roles for this user in this tenant
      const roles = await RoleService.getUserRoles(userId, tenantId);
      
      // Check if any role is global
      if (roles.some(role => role.isGlobal)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking global roles for user ${userId}:`, error);
    return false;
  }
}

// Only export as named export, avoiding default export for consistency
