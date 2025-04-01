/**
 * Patch for RoleService to add tenant role audit logging
 * 
 * This file contains the implementation of the changes needed to add
 * audit logging for tenant role operations.
 */

import { logTenantRoleUpdate, logTenantRoleDelete } from './tenant-role-audit';
import { 
  addACLEntry as addACLEntryImpl, 
  removeACLEntry as removeACLEntryImpl,
  updateRoleACL as updateRoleACLImpl,
  hasACLEntry as hasACLEntryImpl
} from './acl-operations';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { Role, TenantACE } from '@/components/admin/auth/utils/roles';

/**
 * Patch for RoleService.updateRole to add tenant role audit logging
 * 
 * This function should be called after updating a tenant role in Redis
 * but before returning the updated role.
 * 
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param updatedRole The updated role
 * @param updates The updates that were applied
 */
export async function auditTenantRoleUpdate(
  tenantId: string,
  roleId: string,
  updatedRole: Role,
  updates: Partial<Role>
): Promise<void> {
  // Only audit tenant roles (not global roles)
  if (!updatedRole.isGlobal) {
    await logTenantRoleUpdate(
      roleId,
      tenantId,
      updatedRole.name,
      Object.keys(updates)
    );
  }
}

/**
 * Patch for RoleService.deleteRole to add tenant role audit logging
 * 
 * This function should be called after removing a tenant role from all users
 * but before deleting the role from Redis.
 * 
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param role The role being deleted
 */
export async function auditTenantRoleDelete(
  tenantId: string,
  roleId: string,
  role: Role
): Promise<void> {
  // Only audit tenant roles (not global roles)
  if (!role.isGlobal) {
    await logTenantRoleDelete(
      roleId,
      tenantId,
      role.name
    );
  }
}

/**
 * Add an ACL entry to a role
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param aclEntry ACL entry to add
 * @param role The role object
 * @returns true if successful, false otherwise
 */
export async function addACLEntry(
  tenantId: string,
  roleId: string,
  aclEntry: TenantACE,
  role: Role
): Promise<boolean> {
  return addACLEntryImpl(tenantId, roleId, aclEntry, role);
}

/**
 * Remove an ACL entry from a role
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param resourceType Resource type
 * @param permission Permission
 * @param role The role object
 * @param resourceId Optional resource ID
 * @returns true if successful, false otherwise
 */
export async function removeACLEntry(
  tenantId: string,
  roleId: string,
  resourceType: ResourceType,
  permission: Permission,
  role: Role,
  resourceId?: string
): Promise<boolean> {
  return removeACLEntryImpl(tenantId, roleId, resourceType, permission, role, resourceId);
}

/**
 * Update all ACL entries for a role
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param aclEntries New ACL entries
 * @param role The role object
 * @returns Updated role or null if not found
 */
export async function updateRoleACL(
  tenantId: string,
  roleId: string,
  aclEntries: TenantACE[],
  role: Role
): Promise<Role | null> {
  return updateRoleACLImpl(tenantId, roleId, aclEntries, role);
}

/**
 * Check if a role has a specific ACL entry
 * @param role The role to check
 * @param resourceType Resource type
 * @param permission Permission
 * @param resourceId Optional resource ID
 * @returns true if the role has the ACL entry, false otherwise
 */
export function hasACLEntry(
  role: Role,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string
): boolean {
  return hasACLEntryImpl(role, resourceType, permission, resourceId);
}