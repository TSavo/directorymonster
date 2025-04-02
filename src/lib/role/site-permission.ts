/**
 * Site-specific permission management functions
 */

import { ResourceType, Permission } from '@/lib/role/types';
import { getUserRoles } from './user-role-management';

/**
 * Check if a user has permission to access a specific site
 * 
 * @param userId - The user ID
 * @param tenantId - The tenant ID
 * @param siteId - The site ID (null for tenant-wide access)
 * @param permission - The permission to check
 * @returns True if the user has the permission, false otherwise
 */
export async function hasSitePermission(
  userId: string,
  tenantId: string,
  siteId: string | null,
  permission: Permission
): Promise<boolean> {
  try {
    // Get user's roles in this tenant
    const roles = await getUserRoles(userId, tenantId);
    
    if (roles.length === 0) {
      return false;
    }
    
    // Check if any role grants site permission
    return roles.some(role => {
      // Check for tenant-wide site permission first
      const hasTenantWideSitePermission = role.aclEntries.some(entry => 
        entry.resource.type === 'site' &&
        !entry.resource.id && // No specific site ID means all sites
        entry.permission === permission
      );
      
      if (hasTenantWideSitePermission) {
        return true;
      }
      
      // If checking for a specific site, check for that site permission
      if (siteId) {
        return role.aclEntries.some(entry => 
          entry.resource.type === 'site' &&
          entry.resource.id === siteId &&
          entry.permission === permission
        );
      }
      
      return false;
    });
  } catch (error) {
    console.error(`Error checking site permission for user ${userId}:`, error);
    return false;
  }
}
