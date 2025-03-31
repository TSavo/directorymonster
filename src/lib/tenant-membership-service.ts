/**
 * TenantMembershipService manages user-tenant relationships and permissions
 * across tenants for multi-tenant architecture.
 */

import { redis, kv } from '@/lib/redis-client';
import { getTenantUsersKey, getUserRolesKey } from '@/components/admin/auth/utils/roles';
import { TenantConfig } from '@/lib/tenant/tenant-service';
import TenantService from '@/lib/tenant/tenant-service';
import RoleService from '@/lib/role-service';
import { User } from '@/components/admin/users/hooks/useUsers';

export class TenantMembershipService {
  /**
   * Check if a user has permission for a resource in a tenant
   * Convenience method that uses the hasPermissionInTenant function
   * 
   * @param userId User ID to check
   * @param tenantId Tenant ID to check in
   * @param resourceType Type of resource
   * @param permission Permission to check
   * @param resourceId Optional specific resource ID
   * @returns true if user has permission, false otherwise
   */
  static async checkPermission(
    userId: string,
    tenantId: string,
    resourceType: string,
    permission: string,
    resourceId?: string
  ): Promise<boolean> {
    // Import here to avoid circular dependency
    const { hasPermissionInTenant } = await import('@/components/admin/auth/utils/tenantAccessControl');
    
    return hasPermissionInTenant(
      userId,
      tenantId,
      resourceType as any, // Type conversion since we can't import the exact types here
      permission as any,
      resourceId
    );
  }
  /**
   * Check if a user is a member of a tenant
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns true if user is a member
   */
  static async isTenantMember(
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      // Check if user is in the tenant's user set
      const tenantUsersKey = getTenantUsersKey(tenantId);
      return await redis.sismember(tenantUsersKey, userId);
    } catch (error) {
      console.error(`Error checking tenant membership for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get all tenants a user has access to
   * @param userId User ID
   * @returns Array of tenant configurations
   */
  static async getUserTenants(userId: string): Promise<TenantConfig[]> {
    try {
      // Scan for all user:roles keys for this user
      const pattern = `user:roles:${userId}:*`;
      const keys = await this.scanKeys(pattern);
      
      // Extract tenant IDs from the keys
      const tenantIds: string[] = keys.map(key => {
        const parts = key.split(':');
        return parts[parts.length - 1];
      });
      
      // Get tenant configs for each ID
      const tenants: TenantConfig[] = [];
      for (const tenantId of tenantIds) {
        const tenant = await TenantService.getTenantById(tenantId);
        if (tenant) {
          tenants.push(tenant);
        }
      }
      
      return tenants;
    } catch (error) {
      console.error(`Error getting tenants for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Add a user to a tenant with optional role
   * @param userId User ID to add
   * @param tenantId Tenant ID to add to
   * @param roleId Optional role ID to assign
   * @returns true if successful
   */
  static async addUserToTenant(
    userId: string,
    tenantId: string,
    roleId?: string
  ): Promise<boolean> {
    try {
      // Add user to tenant users
      const tenantUsersKey = getTenantUsersKey(tenantId);
      await redis.sadd(tenantUsersKey, userId);
      
      // If role ID is provided, assign that role
      if (roleId) {
        await RoleService.assignRoleToUser(userId, tenantId, roleId);
      }
      
      return true;
    } catch (error) {
      console.error(`Error adding user ${userId} to tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Remove a user from a tenant
   * @param userId User ID to remove
   * @param tenantId Tenant ID to remove from
   * @returns true if successful
   */
  static async removeUserFromTenant(
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      // Get user's roles in this tenant
      const userRolesKey = getUserRolesKey(userId, tenantId);
      const roleIds = await redis.smembers(userRolesKey);
      
      // Remove all roles from user in this tenant
      for (const roleId of roleIds) {
        await RoleService.removeRoleFromUser(userId, tenantId, roleId);
      }
      
      // Remove user from tenant users
      const tenantUsersKey = getTenantUsersKey(tenantId);
      await redis.srem(tenantUsersKey, userId);
      
      // Delete the user's roles key for this tenant
      await kv.del(userRolesKey);
      
      return true;
    } catch (error) {
      console.error(`Error removing user ${userId} from tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Get all users in a tenant
   * @param tenantId Tenant ID
   * @returns Array of users
   */
  static async getTenantUsers(tenantId: string): Promise<string[]> {
    try {
      // Get all user IDs in this tenant
      const tenantUsersKey = getTenantUsersKey(tenantId);
      return await redis.smembers(tenantUsersKey);
    } catch (error) {
      console.error(`Error getting users in tenant ${tenantId}:`, error);
      return [];
    }
  }

  /**
   * Get user's role assignments across all tenants
   * @param userId User ID
   * @returns Map of tenant IDs to role IDs
   */
  static async getUserRolesAllTenants(userId: string): Promise<Map<string, string[]>> {
    try {
      // Get all tenants user has access to
      const tenants = await this.getUserTenants(userId);
      
      // Get roles for each tenant
      const roleMap = new Map<string, string[]>();
      for (const tenant of tenants) {
        const userRolesKey = getUserRolesKey(userId, tenant.id);
        const roleIds = await redis.smembers(userRolesKey);
        roleMap.set(tenant.id, roleIds);
      }
      
      return roleMap;
    } catch (error) {
      console.error(`Error getting roles for user ${userId} across tenants:`, error);
      return new Map();
    }
  }

  /**
   * Helper method to scan Redis keys with a pattern
   */
  private static async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      // Scan with the current cursor
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
      cursor = result[0];
      const batch = result[1];
      
      // Add keys to the result
      keys.push(...batch);
      
      // Continue until cursor is 0
    } while (cursor !== '0');
    
    return keys;
  }
}

export default TenantMembershipService;
