/**
 * Tenant-specific role operations
 */

import { redis, kv } from '@/lib/redis-client';
import { getRoleKey } from '@/components/admin/auth/utils/roles';
import { scanKeys } from './utils';
import { getGlobalRoles } from './role-operations';

/**
 * Get all roles for a tenant, including applicable global roles
 * @param tenantId Tenant ID
 * @param includeGlobalRoles Whether to include global roles (default: true)
 * @returns Array of roles
 */
export async function getRolesByTenant(
  tenantId: string,
  includeGlobalRoles = true
): Promise<any[]> {
  try {
    // Use Redis scan to find all tenant-specific role keys
    const pattern = `${getRoleKey(tenantId, '')}*`;
    const keys = await scanKeys(redis, pattern);
    
    // Fetch all tenant roles
    const roles: any[] = [];
    for (const key of keys) {
      const role = await kv.get<any>(key);
      if (role) {
        roles.push(role);
      }
    }
    
    // Include global roles if requested
    if (includeGlobalRoles) {
      const globalRoles = await getGlobalRoles();
      roles.push(...globalRoles);
    }
    
    return roles;
  } catch (error) {
    console.error(`Error getting roles for tenant ${tenantId}:`, error);
    return [];
  }
}
