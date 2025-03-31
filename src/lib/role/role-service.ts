import { v4 as uuidv4 } from 'uuid';
import { redis, kv } from '@/lib/redis-client';
import { roleKeys } from '@/lib/tenant/redis-keys';
import { Role, ACE, ResourceType, Permission, UserRole } from './types';

/**
 * RoleService manages role definitions and user-role assignments
 * for the multi-tenant access control system.
 */
export class RoleService {
  /**
   * Create a new role within a tenant
   */
  static async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const newRole: Role = {
      ...role,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    // Store role by ID
    const roleKey = roleKeys.byId(role.tenantId, id);
    await redis.set(roleKey, JSON.stringify(newRole));
    
    // Index by name for looking up roles by name
    const roleNameKey = roleKeys.byName(role.tenantId, role.name);
    await redis.set(roleNameKey, id);
    
    return newRole;
  }
  
  /**
   * Update an existing role
   */
  static async updateRole(tenantId: string, roleId: string, updates: Partial<Omit<Role, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<Role> {
    const roleKey = roleKeys.byId(tenantId, roleId);
    const roleData = await redis.get(roleKey);
    
    if (!roleData) {
      throw new Error(`Role with ID ${roleId} not found in tenant ${tenantId}`);
    }
    
    const role: Role = JSON.parse(roleData);
    
    // If name is changing, update the name index
    if (updates.name && updates.name !== role.name) {
      // Delete old name index
      const oldNameKey = roleKeys.byName(tenantId, role.name);
      await redis.del(oldNameKey);
      
      // Create new name index
      const newNameKey = roleKeys.byName(tenantId, updates.name);
      await redis.set(newNameKey, roleId);
    }
    
    // Update role
    const updatedRole: Role = {
      ...role,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await redis.set(roleKey, JSON.stringify(updatedRole));
    
    return updatedRole;
  }
  
  /**
   * Delete a role (and remove all assignments)
   */
  static async deleteRole(tenantId: string, roleId: string): Promise<boolean> {
    const roleKey = roleKeys.byId(tenantId, roleId);
    const roleData = await redis.get(roleKey);
    
    if (!roleData) {
      return false;
    }
    
    const role: Role = JSON.parse(roleData);
    
    // Delete name index
    const nameKey = roleKeys.byName(tenantId, role.name);
    await redis.del(nameKey);
    
    // Delete role data
    await redis.del(roleKey);
    
    // Get users with this role
    const roleUsersKey = roleKeys.roleUsers(tenantId, roleId);
    const userIds = await redis.smembers(roleUsersKey);
    
    // Remove role from all users who have it
    for (const userId of userIds) {
      await this.removeRoleFromUser(userId, tenantId, roleId);
    }
    
    // Delete role users set
    await redis.del(roleUsersKey);
    
    return true;
  }
  
  /**
   * Get a role by ID
   */
  static async getRoleById(tenantId: string, roleId: string): Promise<Role | null> {
    const roleKey = roleKeys.byId(tenantId, roleId);
    const roleData = await redis.get(roleKey);
    
    if (!roleData) {
      return null;
    }
    
    return JSON.parse(roleData);
  }
  
  /**
   * Get a role by name
   */
  static async getRoleByName(tenantId: string, name: string): Promise<Role | null> {
    const nameKey = roleKeys.byName(tenantId, name);
    const roleId = await redis.get(nameKey);
    
    if (!roleId) {
      return null;
    }
    
    return this.getRoleById(tenantId, roleId);
  }
  
  /**
   * Get all roles in a tenant
   */
  static async getRolesByTenant(tenantId: string): Promise<Role[]> {
    const pattern = roleKeys.allForTenant(tenantId);
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      return [];
    }
    
    // Filter to only get ID-based keys and not name index keys
    const roleIdKeys = keys.filter(key => !key.includes('name:'));
    
    if (roleIdKeys.length === 0) {
      return [];
    }
    
    const roleDatas = await redis.mget(...roleIdKeys);
    
    return roleDatas
      .filter(data => data !== null)
      .map(data => JSON.parse(data!));
  }
  
  /**
   * Assign role to user
   */
  static async assignRoleToUser(userId: string, tenantId: string, roleId: string): Promise<void> {
    // Verify role exists
    const role = await this.getRoleById(tenantId, roleId);
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found in tenant ${tenantId}`);
    }
    
    // Add role to user's roles in this tenant
    const userRolesKey = roleKeys.userRoles(userId, tenantId);
    await redis.sadd(userRolesKey, roleId);
    
    // Add user to tenant's users
    const tenantUsersKey = roleKeys.tenantUsers(tenantId);
    await redis.sadd(tenantUsersKey, userId);
    
    // Add user to role's users
    const roleUsersKey = roleKeys.roleUsers(tenantId, roleId);
    await redis.sadd(roleUsersKey, userId);
    
    // Store assignment metadata
    const assignmentData: UserRole = {
      userId,
      roleId,
      tenantId,
      assignedAt: new Date().toISOString()
    };
    
    const assignmentKey = `user:role:${userId}:${tenantId}:${roleId}`;
    await redis.set(assignmentKey, JSON.stringify(assignmentData));
  }
  
  /**
   * Remove role from user
   */
  static async removeRoleFromUser(userId: string, tenantId: string, roleId: string): Promise<void> {
    // Remove role from user's roles in this tenant
    const userRolesKey = roleKeys.userRoles(userId, tenantId);
    await redis.srem(userRolesKey, roleId);
    
    // Remove user from role's users
    const roleUsersKey = roleKeys.roleUsers(tenantId, roleId);
    await redis.srem(roleUsersKey, userId);
    
    // Delete assignment metadata
    const assignmentKey = `user:role:${userId}:${tenantId}:${roleId}`;
    await redis.del(assignmentKey);
    
    // Check if user still has any roles in this tenant
    const remainingRoles = await redis.smembers(userRolesKey);
    if (remainingRoles.length === 0) {
      // If no more roles, remove user from tenant's users
      const tenantUsersKey = roleKeys.tenantUsers(tenantId);
      await redis.srem(tenantUsersKey, userId);
    }
  }
  
  /**
   * Get all roles assigned to a user in a tenant
   */
  static async getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
    const userRolesKey = roleKeys.userRoles(userId, tenantId);
    const roleIds = await redis.smembers(userRolesKey);
    
    if (roleIds.length === 0) {
      return [];
    }
    
    const roles: Role[] = [];
    
    for (const roleId of roleIds) {
      const role = await this.getRoleById(tenantId, roleId);
      if (role) {
        roles.push(role);
      }
    }
    
    return roles;
  }
  
  /**
   * Get all tenants a user belongs to
   */
  static async getUserTenants(userId: string): Promise<string[]> {
    const pattern = roleKeys.allUserRoles(userId);
    const keys = await redis.keys(pattern);
    
    return keys.map(key => {
      // Extract tenantId from the key pattern user:roles:userId:tenantId
      const parts = key.split(':');
      return parts[3];
    });
  }
  
  /**
   * Get all users with a specific role in a tenant
   */
  static async getUsersWithRole(tenantId: string, roleId: string): Promise<string[]> {
    const roleUsersKey = roleKeys.roleUsers(tenantId, roleId);
    return redis.smembers(roleUsersKey);
  }
  
  /**
   * Get all users in a tenant
   */
  static async getTenantUsers(tenantId: string): Promise<string[]> {
    const tenantUsersKey = roleKeys.tenantUsers(tenantId);
    return redis.smembers(tenantUsersKey);
  }
  
  /**
   * Check if user has a specific permission for a resource in a tenant
   */
  static async hasPermission(
    userId: string,
    tenantId: string,
    resourceType: ResourceType,
    permission: Permission,
    resourceId?: string
  ): Promise<boolean> {
    // Get all roles the user has in this tenant
    const roles = await this.getUserRoles(userId, tenantId);
    
    if (roles.length === 0) {
      return false;
    }
    
    // Check each role for the required permission
    for (const role of roles) {
      const hasPermission = this.roleHasPermission(role, resourceType, permission, resourceId);
      if (hasPermission) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a specific role has a permission
   */
  private static roleHasPermission(
    role: Role,
    resourceType: ResourceType,
    permission: Permission,
    resourceId?: string
  ): boolean {
    return role.aclEntries.some(entry => {
      // Check if the entry matches the resource type and permission
      if (entry.resource.type !== resourceType || entry.permission !== permission) {
        return false;
      }
      
      // If no specific resourceId is required, or entry doesn't specify an ID, it's a match
      if (!resourceId || !entry.resource.id) {
        return true;
      }
      
      // Otherwise, the entry must match the specific resourceId
      return entry.resource.id === resourceId;
    });
  }
  
  /**
   * Get all resource IDs of a type that a user has a specific permission for
   */
  static async getAccessibleResources(
    userId: string,
    tenantId: string,
    resourceType: ResourceType,
    permission: Permission
  ): Promise<string[]> {
    // Get all roles the user has in this tenant
    const roles = await this.getUserRoles(userId, tenantId);
    
    if (roles.length === 0) {
      return [];
    }
    
    const resourceIds = new Set<string>();
    let hasGlobalPermission = false;
    
    // Check each role for the required permission
    for (const role of roles) {
      for (const entry of role.aclEntries) {
        // If entry matches resource type and permission
        if (entry.resource.type === resourceType && entry.permission === permission) {
          // If no resource ID specified, user has global permission for this type
          if (!entry.resource.id) {
            hasGlobalPermission = true;
            break;
          }
          
          // Otherwise, add the specific resource ID
          if (entry.resource.id) {
            resourceIds.add(entry.resource.id);
          }
        }
      }
      
      if (hasGlobalPermission) {
        break;
      }
    }
    
    if (hasGlobalPermission) {
      // If user has global permission, get all resources of this type
      // This would typically be handled by your resource service
      // For now, return a special marker indicating global access
      return ['*'];
    }
    
    return Array.from(resourceIds);
  }
}

export default RoleService;