/**
 * Access Control List system for DirectoryMonster
 */

// Resource types in the system
export type ResourceType = 'user' | 'site' | 'category' | 'listing' | 'setting' | 'audit' | 'role';

// Available permissions
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Resource identifier
export interface Resource {
  type: ResourceType;
  id?: string; // Optional specific resource ID, if undefined applies to all resources of this type
  siteId?: string; // Optional site scope, if undefined applies across all sites
}

// Access control entry
export interface ACE {
  resource: Resource;
  permission: Permission;
}

// User access control list
export interface ACL {
  userId: string;
  entries: ACE[];
}

/**
 * Check if user has permission for a specific resource
 */
export function hasPermission(
  acl: ACL,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string,
  siteId?: string
): boolean {
  // Check for exact resource match first
  const hasExactPermission = acl.entries.some(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    entry.resource.id === resourceId &&
    entry.resource.siteId === siteId
  );
  
  if (hasExactPermission) return true;
  
  // Check for specific resource type with site-wide permission
  const hasSiteWidePermission = siteId && acl.entries.some(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    !entry.resource.id &&
    entry.resource.siteId === siteId
  );
  
  if (hasSiteWidePermission) return true;
  
  // Check for global permission for this resource type
  const hasGlobalPermission = acl.entries.some(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    !entry.resource.id &&
    !entry.resource.siteId
  );
  
  return hasGlobalPermission;
}

/**
 * Grant permission to a user
 */
export function grantPermission(
  acl: ACL,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string,
  siteId?: string
): ACL {
  // Create a new Resource object
  const resource: Resource = {
    type: resourceType,
    id: resourceId,
    siteId: siteId
  };
  
  // Check if permission already exists
  const permissionExists = acl.entries.some(entry => 
    entry.resource.type === resource.type &&
    entry.permission === permission &&
    entry.resource.id === resource.id &&
    entry.resource.siteId === resource.siteId
  );
  
  if (permissionExists) {
    return acl;
  }
  
  // Add new permission
  return {
    ...acl,
    entries: [...acl.entries, { resource, permission }]
  };
}

/**
 * Revoke permission from a user
 */
export function revokePermission(
  acl: ACL,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string,
  siteId?: string
): ACL {
  return {
    ...acl,
    entries: acl.entries.filter(entry => 
      !(entry.resource.type === resourceType &&
        entry.permission === permission &&
        entry.resource.id === resourceId &&
        entry.resource.siteId === siteId)
    )
  };
}

/**
 * Create admin ACL for a specific site
 */
export function createSiteAdminACL(userId: string, siteId: string): ACL {
  const acl: ACL = { userId, entries: [] };
  
  // Site management permissions
  acl.entries.push({ 
    resource: { type: 'site', id: siteId },
    permission: 'manage'
  });
  
  // Category management for this site
  acl.entries.push({ 
    resource: { type: 'category', siteId },
    permission: 'create'
  });
  acl.entries.push({ 
    resource: { type: 'category', siteId },
    permission: 'read'
  });
  acl.entries.push({ 
    resource: { type: 'category', siteId },
    permission: 'update'
  });
  acl.entries.push({ 
    resource: { type: 'category', siteId },
    permission: 'delete'
  });
  
  // Listing management for this site
  acl.entries.push({ 
    resource: { type: 'listing', siteId },
    permission: 'create'
  });
  acl.entries.push({ 
    resource: { type: 'listing', siteId },
    permission: 'read'
  });
  acl.entries.push({ 
    resource: { type: 'listing', siteId },
    permission: 'update'
  });
  acl.entries.push({ 
    resource: { type: 'listing', siteId },
    permission: 'delete'
  });
  
  // User management for this site
  acl.entries.push({ 
    resource: { type: 'user', siteId },
    permission: 'create'
  });
  acl.entries.push({ 
    resource: { type: 'user', siteId },
    permission: 'read'
  });
  acl.entries.push({ 
    resource: { type: 'user', siteId },
    permission: 'update'
  });
  acl.entries.push({ 
    resource: { type: 'user', siteId },
    permission: 'delete'
  });
  
  return acl;
}

/**
 * Create super admin ACL with global permissions
 */
export function createSuperAdminACL(userId: string): ACL {
  const acl: ACL = { userId, entries: [] };
  
  // Global permissions for all resource types
  const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting', 'audit', 'role'];
  const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
  
  resourceTypes.forEach(type => {
    permissions.forEach(permission => {
      acl.entries.push({
        resource: { type },
        permission
      });
    });
  });
  
  return acl;
}
