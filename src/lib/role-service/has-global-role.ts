/**
 * Check if a user has any global role
 * Global roles can perform cross-tenant operations
 * 
 * This is extracted from RoleService for better modularity
 */

import { RoleService } from '../role-service';

/**
 * Check if a user has any global role across all tenants
 * @param userId User ID to check
 * @returns true if user has any global role
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
