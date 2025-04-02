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
 * Determines whether an access control list (ACL) grants a specified permission on a resource within a tenant context.
 *
 * This function evaluates the provided ACL to verify if the user has the required permission for a resource,
 * checking across different scopes. It first searches for an exact match using the resource's unique ID and
 * site ID (if provided). If no exact match is found, the function then checks for a site-wide permission (when a
 * site ID is provided) and finally for a tenant-wide permission. It returns true if any matching permission is found.
 *
 * @param acl - The access control list containing permission entries.
 * @param resourceType - The type of resource to check permissions for.
 * @param permission - The permission to verify.
 * @param tenantId - The tenant identifier associated with the resource.
 * @param resourceId - Optional unique identifier of the resource.
 * @param siteId - Optional site identifier for site-scoped permissions.
 * @returns True if the ACL grants the specified permission at the resource, site, or tenant level; otherwise, false.
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
 * Adds a permission entry for a resource to a user's ACL if it does not already exist.
 *
 * This function creates a resource object using the specified type, tenant ID, and optional resource and site IDs.
 * It then checks the ACL for an existing entry that exactly matches the resource and permission.
 * If no matching entry is found, the function appends the new permission entry and returns the updated ACL.
 *
 * @param acl - The user's access control list to update.
 * @param resourceType - The type of resource for which permission is being granted.
 * @param permission - The specific permission to grant.
 * @param tenantId - The tenant identifier associated with the resource.
 * @param resourceId - An optional identifier for the resource.
 * @param siteId - An optional site identifier associated with the resource.
 * @returns The updated access control list containing the new permission entry, or the original ACL if the permission already exists.
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
 * Revokes a specified permission from an access control list.
 *
 * Returns a new ACL with entries removed that exactly match the provided resource type,
 * permission, tenant ID, and, if specified, resource and site identifiers.
 *
 * @param acl - The original access control list.
 * @param resourceType - The type of resource whose permission should be revoked.
 * @param permission - The permission to revoke.
 * @param tenantId - The tenant identifier associated with the resource.
 * @param resourceId - Optional resource identifier; if provided, only entries with this ID are targeted.
 * @param siteId - Optional site identifier; if provided, only entries with this ID are targeted.
 * @returns A new ACL with the specified permission entries removed.
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
 * Creates an access control list (ACL) for a site administrator within a tenant.
 *
 * The returned ACL grants management permission for the specified site and provides
 * create, read, update, and delete permissions on category, listing, and user resources
 * associated with that site.
 *
 * @param userId - The identifier for the site administrator.
 * @param tenantId - The tenant identifier where the site resides.
 * @param siteId - The identifier of the site to be administered.
 * @returns An ACL object containing permission entries for managing the site and its related resources.
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
 * Creates an ACL for a tenant administrator with full permissions across all managed resource types within a specific tenant.
 *
 * This ACL grants comprehensive rights by including all permissions—create, read, update, delete, and manage—for each resource type
 * (user, site, category, listing, setting, audit, and role) associated with the tenant.
 *
 * @param userId - Identifier of the user to whom the tenant admin permissions are assigned.
 * @param tenantId - Identifier of the tenant for which the ACL is created.
 * @returns An ACL object granting full tenant-wide permissions.
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
 * Generates an access control list (ACL) for a super administrator.
 *
 * The returned ACL grants global permissions by assigning all available actions (create, read, update, delete, and manage)
 * for each resource type—including a dedicated management permission for tenant resources—using the system-defined tenant.
 *
 * @param userId - Identifier of the super admin user.
 * @returns The ACL with system-wide permissions for super administrative access.
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
 * Checks the provided ACL for unauthorized access to resources of a different tenant.
 *
 * This function checks if the ACL has at least one entry for the specified tenant
 * or the system tenant. It returns false if such an entry exists (indicating that
 * access to the tenant is authorized), and true otherwise (indicating unauthorized access).
 *
 * @param acl - The access control list to inspect.
 * @param tenantId - The tenant ID that the ACL is expected to be associated with.
 * @returns True if there's no authorized access for the specified tenant; otherwise, false.
 */
export function detectCrossTenantAccess(
  acl: ACL,
  tenantId: string
): boolean {
  // Only check ACLs that have entries
  if (!acl.entries.length) return false;
  
  // Get all unique tenant IDs referenced in the ACL
  const referencedTenantIds = new Set<string>();
  acl.entries.forEach(entry => {
    referencedTenantIds.add(entry.resource.tenantId);
  });
  
  // Filter out the specified tenant and the system tenant (which is allowed)
  referencedTenantIds.delete(tenantId);
  referencedTenantIds.delete('system');
  
  // If there are any remaining tenant IDs, this indicates cross-tenant access
  return referencedTenantIds.size > 0;
}

/**
 * Retrieves a list of unique tenant IDs from the provided Access Control List (ACL).
 *
 * This function iterates over each entry in the ACL and extracts the tenant ID from the resource,
 * returning an array of unique tenant IDs. This is useful for auditing and security monitoring purposes.
 *
 * @param acl - The ACL containing access control entries with associated tenant IDs.
 * @returns An array of unique tenant IDs referenced within the ACL.
 */
export function getReferencedTenants(acl: ACL): string[] {
  const tenantIds = new Set<string>();
  
  acl.entries.forEach(entry => {
    tenantIds.add(entry.resource.tenantId);
  });
  
  return Array.from(tenantIds);
}
