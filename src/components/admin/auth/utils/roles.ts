/**
 * Role-based Access Control system for DirectoryMonster
 * Roles serve as collections of ACL entries with tenant context
 */

import { ResourceType, Permission, ACE } from './accessControl';

/**
 * Extended Resource interface with required tenant context
 */
export interface TenantResource {
  type: ResourceType;
  id?: string;        // Specific resource ID (if null, applies to all resources of this type)
  tenantId: string;   // The tenant this resource belongs to
}

/**
 * ACE with tenant context
 */
export interface TenantACE {
  resource: TenantResource;
  permission: Permission;
}

/**
 * Role definition
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string;         // The tenant this role belongs to (null for system-wide roles)
  isGlobal: boolean;        // Whether this role applies across all tenants
  aclEntries: TenantACE[];  // The permissions this role grants
  createdAt: string;
  updatedAt: string;
}

/**
 * User-Role assignment
 */
export interface UserRole {
  userId: string;
  roleId: string;
  tenantId: string;  // The tenant context for this role assignment
  assignedAt: string;
}

/**
 * User's tenant membership
 */
export interface TenantMembership {
  userId: string;
  tenantId: string;
  roles: string[];   // Array of role IDs
  joinedAt: string;
}

/**
 * Redis key patterns for role storage
 */
export const ROLE_KEY_PREFIX = 'role:';
export const USER_ROLES_KEY_PREFIX = 'user:roles:';
export const TENANT_USERS_KEY_PREFIX = 'tenant:users:';

/**
 * Create a role key for Redis
 */
export function getRoleKey(tenantId: string, roleId: string): string {
  return `${ROLE_KEY_PREFIX}${tenantId}:${roleId}`;
}

/**
 * Create a user roles key for Redis
 */
export function getUserRolesKey(userId: string, tenantId: string): string {
  return `${USER_ROLES_KEY_PREFIX}${userId}:${tenantId}`;
}

/**
 * Create a tenant users key for Redis
 */
export function getTenantUsersKey(tenantId: string): string {
  return `${TENANT_USERS_KEY_PREFIX}${tenantId}`;
}

/**
 * Convert legacy ACL to new tenant ACL
 */
export function convertToTenantACL(acl: ACE[], tenantId: string): TenantACE[] {
  return acl.map(ace => ({
    resource: {
      ...ace.resource,
      tenantId
    },
    permission: ace.permission
  }));
}

/**
 * Check if user has a specific permission in a tenant
 */
export function hasPermissionInTenant(
  roles: Role[],
  resourceType: ResourceType,
  permission: Permission,
  tenantId: string,
  resourceId?: string
): boolean {
  // Check if any role grants this permission
  return roles.some(role => {
    // Only consider roles for this tenant or global roles
    if (role.tenantId !== tenantId && !role.isGlobal) {
      return false;
    }
    
    // Check for exact resource match first
    const hasExactPermission = role.aclEntries.some(entry => 
      entry.resource.type === resourceType &&
      entry.permission === permission &&
      entry.resource.id === resourceId &&
      entry.resource.tenantId === tenantId
    );
    
    if (hasExactPermission) return true;
    
    // Check for global permission for this resource type in this tenant
    const hasTenantTypePermission = role.aclEntries.some(entry => 
      entry.resource.type === resourceType &&
      entry.permission === permission &&
      !entry.resource.id &&
      entry.resource.tenantId === tenantId
    );
    
    return hasTenantTypePermission;
  });
}

/**
 * Create a default tenant admin role
 */
export function createTenantAdminRole(
  tenantId: string, 
  name = 'Tenant Admin',
  description = 'Administrator for this tenant with full access to all resources'
): Omit<Role, 'id' | 'createdAt' | 'updatedAt'> {
  // Resource types to grant permissions for
  const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting'];
  
  // Permissions to grant
  const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
  
  // Create ACL entries
  const aclEntries: TenantACE[] = [];
  
  // Grant all permissions for all resource types in this tenant
  resourceTypes.forEach(type => {
    permissions.forEach(permission => {
      aclEntries.push({
        resource: {
          type,
          tenantId
        },
        permission
      });
    });
  });
  
  // Return the role (without id and timestamps)
  return {
    name,
    description,
    tenantId,
    isGlobal: false,
    aclEntries
  };
}

/**
 * Create a global super admin role
 */
export function createSuperAdminRole(
  name = 'Super Admin',
  description = 'Global administrator with access to all tenants and resources'
): Omit<Role, 'id' | 'createdAt' | 'updatedAt'> {
  // Empty tenant ID for the global role itself
  const tenantId = 'system';
  
  // Resource types to grant permissions for
  const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting'];
  const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
  
  // Create ACL entries
  const aclEntries: TenantACE[] = [];
  
  // Add special 'tenant' resource type for managing tenants
  aclEntries.push({
    resource: {
      type: 'tenant' as ResourceType,
      tenantId
    },
    permission: 'manage'
  });
  
  // Grant all permissions for all resource types globally
  resourceTypes.forEach(type => {
    permissions.forEach(permission => {
      aclEntries.push({
        resource: {
          type,
          tenantId
        },
        permission
      });
    });
  });
  
  // Return the global role (without id and timestamps)
  return {
    name,
    description,
    tenantId,
    isGlobal: true,
    aclEntries
  };
}
