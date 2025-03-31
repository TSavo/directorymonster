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
  tenantId: string; // The tenant this resource belongs to
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
 * Check if user has permission for a specific resource within a tenant
 */
export function hasPermission(
  acl: ACL,
  resourceType: ResourceType,
  permission: Permission,
  tenantId: string,
  resourceId?: string,
  siteId?: string
): boolean {
  // Check for exact resource match first
  const hasExactPermission = acl.entries.some(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    entry.resource.tenantId === tenantId &&
    entry.resource.id === resourceId &&
    entry.resource.siteId === siteId
  );
  
  if (hasExactPermission) return true;
  
  // Check for specific resource type with site-wide permission
  const hasSiteWidePermission = siteId && acl.entries.some(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    entry.resource.tenantId === tenantId &&
    !entry.resource.id &&
    entry.resource.siteId === siteId
  );
  
  if (hasSiteWidePermission) return true;
  
  // Check for tenant-wide permission for this resource type
  const hasTenantWidePermission = acl.entries.some(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    entry.resource.tenantId === tenantId &&
    !entry.resource.id &&
    !entry.resource.siteId
  );
  
  return hasTenantWidePermission;
}

/**
 * Grant permission to a user
 */
export function grantPermission(
  acl: ACL,
  resourceType: ResourceType,
  permission: Permission,
  tenantId: string,
  resourceId?: string,
  siteId?: string
): ACL {
  // Create a new Resource object
  const resource: Resource = {
    type: resourceType,
    tenantId: tenantId,
    id: resourceId,
    siteId: siteId
  };
  
  // Check if permission already exists
  const permissionExists = acl.entries.some(entry => 
    entry.resource.type === resource.type &&
    entry.permission === permission &&
    entry.resource.tenantId === resource.tenantId &&
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
  tenantId: string,
  resourceId?: string,
  siteId?: string
): ACL {
  return {
    ...acl,
    entries: acl.entries.filter(entry => 
      !(entry.resource.type === resourceType &&
        entry.permission === permission &&
        entry.resource.tenantId === tenantId &&
        entry.resource.id === resourceId &&
        entry.resource.siteId === siteId)
    )
  };
}

/**
 * Create admin ACL for a specific site within a tenant
 */
export function createSiteAdminACL(userId: string, tenantId: string, siteId: string): ACL {
  const acl: ACL = { userId, entries: [] };
  
  // Site management permissions
  acl.entries.push({ 
    resource: { type: 'site', id: siteId, tenantId },
    permission: 'manage'
  });
  
  // Category management for this site
  acl.entries.push({ 
    resource: { type: 'category', siteId, tenantId },
    permission: 'create'
  });
  acl.entries.push({ 
    resource: { type: 'category', siteId, tenantId },
    permission: 'read'
  });
  acl.entries.push({ 
    resource: { type: 'category', siteId, tenantId },
    permission: 'update'
  });
  acl.entries.push({ 
    resource: { type: 'category', siteId, tenantId },
    permission: 'delete'
  });
  
  // Listing management for this site
  acl.entries.push({ 
    resource: { type: 'listing', siteId, tenantId },
    permission: 'create'
  });
  acl.entries.push({ 
    resource: { type: 'listing', siteId, tenantId },
    permission: 'read'
  });
  acl.entries.push({ 
    resource: { type: 'listing', siteId, tenantId },
    permission: 'update'
  });
  acl.entries.push({ 
    resource: { type: 'listing', siteId, tenantId },
    permission: 'delete'
  });
  
  // User management for this site
  acl.entries.push({ 
    resource: { type: 'user', siteId, tenantId },
    permission: 'create'
  });
  acl.entries.push({ 
    resource: { type: 'user', siteId, tenantId },
    permission: 'read'
  });
  acl.entries.push({ 
    resource: { type: 'user', siteId, tenantId },
    permission: 'update'
  });
  acl.entries.push({ 
    resource: { type: 'user', siteId, tenantId },
    permission: 'delete'
  });
  
  return acl;
}

/**
 * Create super admin ACL with global permissions across a specific tenant
 */
export function createTenantAdminACL(userId: string, tenantId: string): ACL {
  const acl: ACL = { userId, entries: [] };
  
  // Tenant-wide permissions for all resource types
  const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting', 'audit', 'role'];
  const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
  
  resourceTypes.forEach(type => {
    permissions.forEach(permission => {
      acl.entries.push({
        resource: { type, tenantId },
        permission
      });
    });
  });
  
  return acl;
}

/**
 * Create super admin ACL with global permissions across all tenants
 * This is a system-level role with highest privileges
 */
export function createSuperAdminACL(userId: string): ACL {
  const acl: ACL = { userId, entries: [] };
  
  // System tenant ID for global permissions
  const systemTenantId = 'system';
  
  // Global permissions for all resource types
  const resourceTypes: ResourceType[] = ['user', 'site', 'category', 'listing', 'setting', 'audit', 'role'];
  const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
  
  // Add tenant management permission (special case for super admin)
  acl.entries.push({
    resource: { type: 'tenant' as ResourceType, tenantId: systemTenantId },
    permission: 'manage'
  });
  
  resourceTypes.forEach(type => {
    permissions.forEach(permission => {
      acl.entries.push({
        resource: { type, tenantId: systemTenantId },
        permission
      });
    });
  });
  
  return acl;
}

/**
 * Check for cross-tenant access attempts
 * Returns true if an unauthorized cross-tenant access is detected
 */
export function detectCrossTenantAccess(
  acl: ACL,
  tenantId: string
): boolean {
  // Only check ACLs that have entries
  if (!acl.entries.length) return false;
  
  // Check if any ACL entry references a different tenant
  return acl.entries.some(entry => 
    entry.resource.tenantId !== tenantId && 
    entry.resource.tenantId !== 'system' // System tenant is allowed for super admins
  );
}

/**
 * Get all tenant IDs referenced in an ACL
 * Useful for auditing and security monitoring
 */
export function getReferencedTenants(acl: ACL): string[] {
  const tenantIds = new Set<string>();
  
  acl.entries.forEach(entry => {
    tenantIds.add(entry.resource.tenantId);
  });
  
  return Array.from(tenantIds);
}
