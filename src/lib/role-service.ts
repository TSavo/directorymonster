/**
 * RoleService provides methods for managing roles and user-role assignments
 * with tenant isolation for multi-tenancy support.
 * Enhanced with global roles functionality that works across tenant boundaries.
 */

import { redis, kv } from '@/lib/redis-client';
import { 
  Role, 
  UserRole, 
  getRoleKey, 
  getUserRolesKey, 
  getTenantUsersKey,
  hasPermissionInTenant,
  createSuperAdminRole
} from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { AuditService } from '@/lib/audit/audit-service';

// Redis keys for global role management
const GLOBAL_ROLES_KEY = 'global:roles';
const GLOBAL_ROLE_USERS_KEY = 'global:role:users';
const GLOBAL_ROLE_KEY_PREFIX = 'role:global:';

/**
 * Creates a key for storing a global role in Redis
 */
function getGlobalRoleKey(roleId: string): string {
  return `${GLOBAL_ROLE_KEY_PREFIX}${roleId}`;
}

// Helper function to generate UUID that works in both Node.js and browser environments
function generateUUID(): string {
  // Use crypto.randomUUID if available (Node.js 14.17.0+ and modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for testing environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
      // Validate tenant context for global roles
      if (role.isGlobal && role.tenantId !== 'system') {
        throw new Error('Global roles must use the system tenant ID');
      }
      
      // Generate a new role ID
      const id = generateUUID();
      
      // Add timestamps
      const now = new Date().toISOString();
      const completeRole: Role = {
        ...role,
        id,
        createdAt: now,
        updatedAt: now,
      };
      
      // Store role in Redis
      if (role.isGlobal) {
        // Store global role with different prefix and add to global roles index
        const key = getGlobalRoleKey(id);
        await kv.set(key, completeRole);
        await redis.sadd(GLOBAL_ROLES_KEY, id);
        
        // Audit the global role creation
        await AuditService.logEvent({
          action: 'global_role_created',
          resourceType: 'role',
          resourceId: id,
          tenantId: 'system',
          details: {
            roleName: role.name,
            isGlobal: true
          }
        });
      } else {
        // Store regular tenant role
        const key = getRoleKey(role.tenantId, id);
        await kv.set(key, completeRole);
      }
      
      return completeRole;
    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error('Failed to create role');
    }
  }
  
  /**
   * Create a global role
   * Helper method to simplify global role creation with proper validation
   * 
   * @param role Global role definition (without id, tenantId, and timestamps)
   * @returns Created global role with ID and timestamps
   */
  static async createGlobalRole(
    role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'isGlobal'>
  ): Promise<Role> {
    try {
      // Use the system tenant ID for global roles
      const globalRole: Omit<Role, 'id' | 'createdAt' | 'updatedAt'> = {
        ...role,
        tenantId: 'system',
        isGlobal: true
      };
      
      return await this.createRole(globalRole);
    } catch (error) {
      console.error('Error creating global role:', error);
      throw new Error('Failed to create global role');
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
      // First try to get the role as a tenant role
      const tenantKey = getRoleKey(tenantId, roleId);
      const tenantRole = await kv.get<Role>(tenantKey);
      
      if (tenantRole) {
        return tenantRole;
      }
      
      // If not found and tenantId is 'system', try to get it as a global role
      if (tenantId === 'system') {
        const globalKey = getGlobalRoleKey(roleId);
        return await kv.get<Role>(globalKey);
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting role ${roleId}:`, error);
      return null;
    }
  }
  
  /**
   * Get a global role by ID
   * @param roleId Global role ID
   * @returns Global role or null if not found
   */
  static async getGlobalRole(roleId: string): Promise<Role | null> {
    try {
      const key = getGlobalRoleKey(roleId);
      const role = await kv.get<Role>(key);
      
      // Validate that it's actually a global role
      if (role && role.isGlobal) {
        return role;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting global role ${roleId}:`, error);
      return null;
    }
  }
  
  /**
   * Get all global roles in the system
   * @returns Array of global roles
   */
  static async getGlobalRoles(): Promise<Role[]> {
    try {
      // Get all global role IDs
      const roleIds = await redis.smembers(GLOBAL_ROLES_KEY);
      
      // Get each global role
      const roles: Role[] = [];
      for (const roleId of roleIds) {
        const role = await this.getGlobalRole(roleId);
        if (role) {
          roles.push(role);
        }
      }
      
      return roles;
    } catch (error) {
      console.error('Error getting global roles:', error);
      return [];
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
      
      // Prevent changing isGlobal flag
      if (updates.isGlobal !== undefined && updates.isGlobal !== currentRole.isGlobal) {
        throw new Error('Cannot change the global status of an existing role');
      }
      
      // Update the role
      const updatedRole: Role = {
        ...currentRole,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // Ensure ID, tenantId, isGlobal, and createdAt are not modified
      updatedRole.id = currentRole.id;
      updatedRole.tenantId = currentRole.tenantId;
      updatedRole.isGlobal = currentRole.isGlobal;
      updatedRole.createdAt = currentRole.createdAt;
      
      // Store updated role
      if (currentRole.isGlobal) {
        const key = getGlobalRoleKey(roleId);
        await kv.set(key, updatedRole);
        
        // Audit the global role update
        await AuditService.logEvent({
          action: 'global_role_updated',
          resourceType: 'role',
          resourceId: roleId,
          tenantId: 'system',
          details: {
            roleName: updatedRole.name,
            updates: Object.keys(updates)
          }
        });
      } else {
        const key = getRoleKey(tenantId, roleId);
        await kv.set(key, updatedRole);
      }
      
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
      // Get the role to check if it's global
      const role = await this.getRole(tenantId, roleId);
      if (!role) {
        return false;
      }
      
      if (role.isGlobal) {
        // For global roles, we need to find all users in all tenants who have this role
        const pattern = `user:roles:*`;
        const userRoleKeys = await this.scanKeys(pattern);
        
        // Check each key for the role
        for (const key of userRoleKeys) {
          const hasRole = await redis.sismember(key, roleId);
          if (hasRole) {
            // Remove the role from this user
            await redis.srem(key, roleId);
            
            // Format: user:roles:{userId}:{tenantId}
            const parts = key.split(':');
            const userId = parts[2];
            const userTenantId = parts[3];
            
            // Audit the role removal
            await AuditService.logEvent({
              action: 'global_role_removed_from_user',
              resourceType: 'user',
              resourceId: userId,
              tenantId: userTenantId,
              details: {
                roleId,
                roleName: role.name
              }
            });
          }
        }
        
        // Delete the global role and remove from index
        const key = getGlobalRoleKey(roleId);
        await kv.del(key);
        await redis.srem(GLOBAL_ROLES_KEY, roleId);
        
        // Audit the global role deletion
        await AuditService.logEvent({
          action: 'global_role_deleted',
          resourceType: 'role',
          resourceId: roleId,
          tenantId: 'system',
          details: {
            roleName: role.name
          }
        });
      } else {
        // For tenant roles, we only need to remove from users in this tenant
        const tenantUsersKey = getTenantUsersKey(tenantId);
        const userIds = await redis.smembers(tenantUsersKey);
        
        // Remove role from all users in this tenant
        for (const userId of userIds) {
          await this.removeRoleFromUser(userId, tenantId, roleId);
        }
        
        // Delete the role
        const key = getRoleKey(tenantId, roleId);
        await kv.del(key);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting role ${roleId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all roles for a tenant, including applicable global roles
   * @param tenantId Tenant ID
   * @param includeGlobalRoles Whether to include global roles (default: true)
   * @returns Array of roles
   */
  static async getRolesByTenant(
    tenantId: string,
    includeGlobalRoles = true
  ): Promise<Role[]> {
    try {
      // Use Redis scan to find all tenant-specific role keys
      const pattern = `${getRoleKey(tenantId, '')}*`;
      const keys = await this.scanKeys(pattern);
      
      // Fetch all tenant roles
      const roles: Role[] = [];
      for (const key of keys) {
        const role = await kv.get<Role>(key);
        if (role) {
          roles.push(role);
        }
      }
      
      // Include global roles if requested
      if (includeGlobalRoles) {
        const globalRoles = await this.getGlobalRoles();
        roles.push(...globalRoles);
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
      // First verify the role exists
      const role = await this.getRole(tenantId, roleId);
      
      // For global roles, also check the global role storage
      if (!role) {
        const globalRole = await this.getGlobalRole(roleId);
        if (!globalRole) {
          throw new Error(`Role ${roleId} not found in tenant ${tenantId} or global roles`);
        }
        
        // Verify the assignee has permission to assign global roles
        // TODO: Add permission check here for global role assignment
      }
      
      // For global roles, add to the global role users index
      if (role && role.isGlobal) {
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
            roleName: role.name,
            isGlobal: true
          }
        });
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
      // Check if this is a global role
      const role = await this.getGlobalRole(roleId);
      
      // For global roles, update the global role users index
      if (role && role.isGlobal) {
        // Check if the user has this global role in any other tenant
        const pattern = `user:roles:${userId}:*`;
        const keys = await this.scanKeys(pattern);
        
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
        // Try to get as a tenant role first
        let role = await this.getRole(tenantId, roleId);
        
        // If not found, try as a global role
        if (!role) {
          role = await this.getGlobalRole(roleId);
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
   * Get all global roles assigned to a user across all tenants
   * @param userId User ID
   * @returns Array of global roles
   */
  static async getUserGlobalRoles(userId: string): Promise<Role[]> {
    try {
      // Check if user has any global roles
      const hasGlobalRoles = await redis.sismember(GLOBAL_ROLE_USERS_KEY, userId);
      
      if (!hasGlobalRoles) {
        return [];
      }
      
      // Look for all tenants where the user has roles
      const pattern = `user:roles:${userId}:*`;
      const keys = await this.scanKeys(pattern);
      
      // Get unique global role IDs across all tenants
      const globalRoleIds = new Set<string>();
      for (const key of keys) {
        const roleIds = await redis.smembers(key);
        
        for (const roleId of roleIds) {
          const role = await this.getGlobalRole(roleId);
          if (role) {
            globalRoleIds.add(roleId);
          }
        }
      }
      
      // Get the complete role objects
      const roles: Role[] = [];
      for (const roleId of globalRoleIds) {
        const role = await this.getGlobalRole(roleId);
        if (role) {
          roles.push(role);
        }
      }
      
      return roles;
    } catch (error) {
      console.error(`Error getting global roles for user ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Check if a user has a specific permission in a tenant
   * This method checks both tenant-specific roles and global roles
   * 
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
      const hasPermission = hasPermissionInTenant(
        roles,
        resourceType,
        permission,
        tenantId,
        resourceId
      );
      
      return hasPermission;
    } catch (error) {
      console.error(`Error checking permission for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Check if a user has a specific global permission
   * This checks if the user has a global role with the specified permission
   * 
   * @param userId User ID
   * @param resourceType Resource type
   * @param permission Permission to check
   * @param tenantId Optional tenant context for the permission check
   * @param resourceId Optional specific resource ID
   * @returns true if user has the global permission
   */
  static async hasGlobalPermission(
    userId: string,
    resourceType: ResourceType,
    permission: Permission,
    tenantId?: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      // Check if user has any global roles
      const globalRoles = await this.getUserGlobalRoles(userId);
      
      if (globalRoles.length === 0) {
        return false;
      }
      
      // For global permission checks without a tenant context, use system tenant
      const effectiveTenantId = tenantId || 'system';
      
      // Check if any global role grants this permission in the tenant context
      return hasPermissionInTenant(
        globalRoles,
        resourceType,
        permission,
        effectiveTenantId,
        resourceId
      );
    } catch (error) {
      console.error(`Error checking global permission for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Check if a user has any role in a tenant
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns true if user has any role
   */
  static async hasRoleInTenant(
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
  static async hasSpecificRole(
    userId: string,
    tenantId: string,
    roleId: string
  ): Promise<boolean> {
    try {
      const userRolesKey = getUserRolesKey(userId, tenantId);
      const roleIds = await redis.smembers(userRolesKey);
      return roleIds.includes(roleId);
    } catch (error) {
      console.error(`Error checking specific role for user ${userId} in tenant ${tenantId}:`, error);
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
      // Check if this is a global role
      const globalRole = await this.getGlobalRole(roleId);
      
      if (globalRole && globalRole.isGlobal) {
        // For global roles, we need a different approach
        return this.getUsersWithGlobalRole(roleId);
      }
      
      // For tenant roles, we can use the existing approach
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
   * Get all users with a specific global role across all tenants
   * @param roleId Global role ID
   * @returns Array of user IDs
   */
  static async getUsersWithGlobalRole(roleId: string): Promise<string[]> {
    try {
      // Verify this is a global role
      const globalRole = await this.getGlobalRole(roleId);
      if (!globalRole || !globalRole.isGlobal) {
        throw new Error(`Role ${roleId} is not a global role`);
      }
      
      // Get all users who have global roles
      const allGlobalRoleUsers = await redis.smembers(GLOBAL_ROLE_USERS_KEY);
      
      // Filter users who have this specific global role
      const usersWithRole: string[] = [];
      for (const userId of allGlobalRoleUsers) {
        // Check each tenant where the user has roles
        const pattern = `user:roles:${userId}:*`;
        const keys = await this.scanKeys(pattern);
        
        // Check if the user has this role in any tenant
        for (const key of keys) {
          const hasRole = await redis.sismember(key, roleId);
          if (hasRole) {
            usersWithRole.push(userId);
            break; // Found in one tenant, no need to check others
          }
        }
      }
      
      return usersWithRole;
    } catch (error) {
      console.error(`Error getting users with global role ${roleId}:`, error);
      return [];
    }
  }
  
  /**
   * Check if a user has any global role
   * @param userId User ID
   * @returns true if user has any global role
   */
  static async hasGlobalRole(userId: string): Promise<boolean> {
    try {
      // First, check if user is in the global role users index
      const isInGlobalRoleIndex = await redis.sismember(GLOBAL_ROLE_USERS_KEY, userId);
      
      if (!isInGlobalRoleIndex) {
        return false;
      }
      
      // Verify by checking actual global role assignments
      const globalRoles = await this.getUserGlobalRoles(userId);
      return globalRoles.length > 0;
    } catch (error) {
      console.error(`Error checking global roles for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Check if a user has a specific global permission in any tenant
   * This is a specialized version of hasGlobalPermission that checks across all tenants
   * 
   * @param userId User ID
   * @param resourceType Resource type
   * @param permission Permission to check
   * @returns true if user has the global permission in any tenant
   */
  static async hasGlobalPermissionAnyTenant(
    userId: string,
    resourceType: ResourceType,
    permission: Permission
  ): Promise<boolean> {
    try {
      // Get all global roles for this user
      const globalRoles = await this.getUserGlobalRoles(userId);
      
      if (globalRoles.length === 0) {
        return false;
      }
      
      // Check if any role grants this permission for the resource type
      // across any tenant (tenantId doesn't matter for this check)
      return globalRoles.some(role => 
        role.aclEntries.some(entry => 
          entry.resource.type === resourceType && 
          entry.permission === permission
        )
      );
    } catch (error) {
      console.error(`Error checking global permission for user ${userId}:`, error);
      return false;
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
