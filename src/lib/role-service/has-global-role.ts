import RoleService from '../role-service';

/**
 * Checks if a user has any global role
 * Global roles are roles with isGlobal=true property
 * 
 * @param userId User ID to check
 * @returns Promise<boolean> True if user has any global role
 */
export async function hasGlobalRole(userId: string): Promise<boolean> {
  try {
    // We need to check all tenants since global roles can exist in any tenant
    // This is a simple implementation - in production, you might want to
    // have a separate index for global roles to avoid this scan
    
    // For now, we'll check the 'global' special tenant (if it exists)
    const globalTenantRoles = await RoleService.getUserRoles(userId, 'global');
    
    // Check if any role is a global role
    for (const role of globalTenantRoles) {
      if (role.isGlobal) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking if user ${userId} has global role:`, error);
    return false;
  }
}

export default hasGlobalRole;
