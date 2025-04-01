/**
 * Compatibility layer for RoleService
 * 
 * This file provides implementations that are compatible with the existing tests
 * while using the new implementation from role-service-patch.ts.
 */

import { Role, TenantACE } from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { 
  addACLEntryImpl, 
  removeACLEntryImpl, 
  updateRoleACLImpl, 
  hasACLEntryImpl 
} from './role-service-patch';

/**
 * Add an ACL entry to a role
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param aclEntry ACL entry to add
 * @returns true if successful, false otherwise
 */
export async function addACLEntry(
  tenantId: string,
  roleId: string,
  aclEntry: TenantACE
): Promise<boolean> {
  try {
    // Get the current role
    const role = await this.getRole(tenantId, roleId);
    if (!role) {
      return false;
    }
    
    return await addACLEntryImpl(tenantId, roleId, aclEntry, role);
  } catch (error) {
    console.error(`Error adding ACL entry to role ${roleId}:`, error);
    return false;
  }
}

/**
 * Remove an ACL entry from a role
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param resourceType Resource type
 * @param permission Permission
 * @param resourceId Optional resource ID
 * @returns true if successful, false otherwise
 */
export async function removeACLEntry(
  tenantId: string,
  roleId: string,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string
): Promise<boolean> {
  try {
    // Get the current role
    const role = await this.getRole(tenantId, roleId);
    if (!role) {
      return false;
    }
    
    return await removeACLEntryImpl(tenantId, roleId, resourceType, permission, role, resourceId);
  } catch (error) {
    console.error(`Error removing ACL entry from role ${roleId}:`, error);
    return false;
  }
}

/**
 * Update all ACL entries for a role
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param aclEntries New ACL entries
 * @returns Updated role or null if not found
 */
export async function updateRoleACL(
  tenantId: string,
  roleId: string,
  aclEntries: TenantACE[]
): Promise<Role | null> {
  try {
    // Get the current role
    const role = await this.getRole(tenantId, roleId);
    if (!role) {
      return null;
    }
    
    return await updateRoleACLImpl(tenantId, roleId, aclEntries, role);
  } catch (error) {
    console.error(`Error updating ACL entries for role ${roleId}:`, error);
    return null;
  }
}

/**
 * Check if a role has a specific ACL entry
 * @param tenantId Tenant ID
 * @param roleId Role ID
 * @param resourceType Resource type
 * @param permission Permission
 * @param resourceId Optional resource ID
 * @returns true if the role has the ACL entry, false otherwise
 */
export async function hasACLEntry(
  tenantId: string,
  roleId: string,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string
): Promise<boolean> {
  try {
    // Get the role
    const role = await this.getRole(tenantId, roleId);
    if (!role) {
      return false;
    }
    
    return hasACLEntryImpl(role, resourceType, permission, resourceId);
  } catch (error) {
    console.error(`Error checking ACL entry for role ${roleId}:`, error);
    return false;
  }
}