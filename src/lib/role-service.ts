/**
 * RoleService provides methods for managing roles and user-role assignments
 * with tenant isolation for multi-tenancy support.
 */

import { redis, kv } from '@/lib/redis-client';
import { 
  Role, 
  UserRole, 
  getRoleKey, 
  getUserRolesKey, 
  getTenantUsersKey,
  hasPermissionInTenant
} from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

export class RoleService {
  /**
   * Create a new role in a tenant
   * @param role Role definition (without id and timestamps)
   * @returns Created role with ID and timestamps
   */
  static async createRole(
    role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Role> {
    try {
      // Generate a new role ID
      const id = crypto.randomUUID();
      
      // Add timestamps
      const now = new Date().toISOString();
      const completeRole: Role = {
        ...role,
        id,
        createdAt: now,
        updatedAt: now,
      };
      
      // Store role in Redis
      const key = getRoleKey(role.tenantId, id);
      await kv.set(key, completeRole);
      
      return completeRole;
    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error('Failed to create role');
    }
  }
  
  /**
   * Get a role by ID
   * @param tenantId Tenant ID
   * @param roleId Role ID
   * @returns Role or null if not found
   */
  static async getRole(
    tenantId: string,
    roleId: string
  ): Promise<Role | null> {
    try {
      const key = getRoleKey(tenantId, roleId);
      return await kv.get<Role>(key);
    } catch (error) {
      console.error(`Error getting role ${roleId}:`, error);
      return null;
    }
  }
  
  /**
   * Update an existing role
   * @param tenantId Tenant ID
   * @param roleId Role ID
   * @param updates Partial role updates
   * @returns Updated role or null if not found
   */
  static async updateRole(
    tenantId: string,
    roleId: string,
    updates: Partial<Role>
  ): Promise<Role | null> {
    try {
      // Get the current role
      const currentRole = await this.getRole(tenantId, roleId);
      if (!currentRole) {
        return null;
      }
      
      // Update the role
      const updatedRole: Role = {
        ...currentRole,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // Ensure ID, tenantId, and createdAt are not modified
      updatedRole.id = currentRole.id;
      updatedRole.tenantId = currentRole.tenantId;
      updatedRole.createdAt = currentRole.createdAt;
      
      // Store updated role
      const key = getRoleKey(tenantId, roleId);
      await kv.set(key, updatedRole);
      
      return updatedRole;
    } catch (error) {
      console.error(`Error updating role ${roleId}:`, error);
      return null;
    }
  }
  
  /**
   * Delete a role
   * @param tenantId Tenant ID
   * @param roleId Role ID
   * @returns true if deleted, false otherwise
   */
  static async deleteRole(
    tenantId: string,
    roleId: string
  ): Promise<boolean> {
    try {
      // Get all tenant users
      const tenantUsersKey = getTenantUsersKey(tenantId);
      const userIds = await redis.smembers(tenantUsersKey);
      
      // Remove role from all users in this tenant
      for (const userId of userIds) {
        await this.removeRoleFromUser(userId, tenantId, roleId);
      }
      
      // Delete the role
      const key = getRoleKey(tenantId, roleId);
      await kv.del(key);
      
      return true;
    } catch (error) {
      console.error(`Error deleting role ${roleId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all roles for a tenant
   * @param tenantId Tenant ID
   * @returns Array of roles
   */
  static async getRolesByTenant(tenantId: string): Promise<Role[]> {
    try {
      // Use Redis scan to find all keys matching the pattern
      const pattern = `${getRoleKey(tenantId, '')}*`;
      const keys = await this.scanKeys(pattern);
      
      // Fetch all roles
      const roles: Role[] = [];
      for (const key of keys) {
        const role = await kv.get<Role>(key);
        if (role) {
          roles.push(role);
        }
      }
      
      return roles;
    } catch (error) {
      console.error(`Error getting roles for tenant ${tenantId}:`, error);
      return [];
    }
  }
  
  /**
   * Assign a role to a user in a tenant
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param roleId Role ID
   * @returns true if successful
   */
  static async assignRoleToUser(
    userId: string,
    tenantId: string,
    roleId: string
  ): Promise<boolean> {
    try {
      // Verify the role exists
      const role = await this.getRole(tenantId, roleId);
      if (!role) {
        throw new Error(`Role ${roleId} not found in tenant ${tenantId}`);
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
  static async removeRoleFromUser(
    userId: string,
    tenantId: string,
    roleId: string
  ): Promise<boolean> {
    try {
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
  static async getUserRoles(
    userId: string,
    tenantId: string
  ): Promise<Role[]> {
    try {
      // Get role IDs for this user in this tenant
      const userRolesKey = getUserRolesKey(userId, tenantId);
      const roleIds = await redis.smembers(userRolesKey);
      
      // Get each role
      const roles: Role[] = [];
      for (const roleId of roleIds) {
        const role = await this.getRole(tenantId, roleId);
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
   * Check if a user has a specific permission in a tenant
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param resourceType Resource type
   * @param permission Permission to check
   * @param resourceId Optional specific resource ID
   * @returns true if user has permission
   */
  static async hasPermission(
    userId: string,
    tenantId: string,
    resourceType: ResourceType,
    permission: Permission,
    resourceId?: string
  ): Promise<boolean> {
    try {
      // Get user's roles in this tenant
      const roles = await this.getUserRoles(userId, tenantId);
      
      // Check if any role grants this permission
      return hasPermissionInTenant(
        roles,
        resourceType,
        permission,
        tenantId,
        resourceId
      );
    } catch (error) {
      console.error(`Error checking permission for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all users with a specific role in a tenant
   * @param tenantId Tenant ID
   * @param roleId Role ID
   * @returns Array of user IDs
   */
  static async getUsersWithRole(
    tenantId: string,
    roleId: string
  ): Promise<string[]> {
    try {
      // Get all users in tenant
      const tenantUsersKey = getTenantUsersKey(tenantId);
      const userIds = await redis.smembers(tenantUsersKey);
      
      // Filter users with this role
      const usersWithRole: string[] = [];
      for (const userId of userIds) {
        const userRolesKey = getUserRolesKey(userId, tenantId);
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

export default RoleService;
