/**
 * Tenant-specific role operations
 */

import { redis, kv } from '@/lib/redis-client';
import { getRoleKey } from '@/components/admin/auth/utils/roles';
import { scanKeys } from './utils';
import { getGlobalRoles } from './role-operations';

/**
 * Retrieves all roles associated with a tenant.
 *
 * This function returns a promise that resolves to an array containing tenant-specific roles and, if requested,
 * global roles as well. If an error occurs during retrieval, the function logs the error and returns an empty array.
 *
 * @param tenantId - The identifier of the tenant.
 * @param includeGlobalRoles - Whether to include global roles; defaults to true.
 * @returns A promise that resolves to an array of roles.
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
