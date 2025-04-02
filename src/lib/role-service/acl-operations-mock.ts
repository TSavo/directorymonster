/**
 * Mock implementation of ACL Operations for testing
 * 
 * This file contains mock implementations of the ACL operations
 * that can be used in tests without relying on the real implementation.
 */

import { Role, TenantACE } from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import AuditService from '@/lib/audit/audit-service';
import { kv } from '@/lib/redis-client';

/**
 * Add an ACL entry to a role
 */
export async function addACLEntry(
  tenantId: string,
  roleId: string,
  aclEntry: TenantACE,
  role: Role
): Promise<boolean> {
  // Check if the ACL entry already exists
  const entryExists = role.aclEntries.some(entry => 
    entry.resource.type === aclEntry.resource.type &&
    entry.permission === aclEntry.permission &&
    entry.resource.id === aclEntry.resource.id
  );
  
  if (entryExists) {
    return true; // Entry already exists, no need to add
  }
  
  // Add the ACL entry
  role.aclEntries.push(aclEntry);
  role.updatedAt = new Date().toISOString();
  
  // Store updated role
  if (role.isGlobal) {
    await kv.set(`role:global:${roleId}`, role);
    
    // Audit the global permission grant
    await AuditService.logEvent({
      action: 'global_permission_granted',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: 'system',
      details: {
        roleName: role.name,
        resourceType: aclEntry.resource.type,
        permission: aclEntry.permission,
        resourceId: aclEntry.resource.id || 'all'
      }
    });
  } else {
    await kv.set(`role:${tenantId}:${roleId}`, role);
    
    // Audit the tenant permission grant
    await AuditService.logEvent({
      action: 'permission_granted',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: tenantId,
      details: {
        roleName: role.name,
        resourceType: aclEntry.resource.type,
        permission: aclEntry.permission,
        resourceId: aclEntry.resource.id || 'all'
      }
    });
  }
  
  return true;
}

/**
 * Remove an ACL entry from a role
 */
export async function removeACLEntry(
  tenantId: string,
  roleId: string,
  resourceType: ResourceType,
  permission: Permission,
  role: Role,
  resourceId?: string
): Promise<boolean> {
  // Find the index of the ACL entry to remove
  const entryIndex = role.aclEntries.findIndex(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    (resourceId ? entry.resource.id === resourceId : !entry.resource.id)
  );
  
  if (entryIndex === -1) {
    return false; // Entry doesn't exist
  }
  
  // Store the entry for audit logging
  const removedEntry = role.aclEntries[entryIndex];
  
  // Remove the ACL entry
  role.aclEntries.splice(entryIndex, 1);
  role.updatedAt = new Date().toISOString();
  
  // Store updated role
  if (role.isGlobal) {
    await kv.set(`role:global:${roleId}`, role);
    
    // Audit the global permission revocation
    await AuditService.logEvent({
      action: 'global_permission_revoked',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: 'system',
      details: {
        roleName: role.name,
        resourceType: removedEntry.resource.type,
        permission: removedEntry.permission,
        resourceId: removedEntry.resource.id || 'all'
      }
    });
  } else {
    await kv.set(`role:${tenantId}:${roleId}`, role);
    
    // Audit the tenant permission revocation
    await AuditService.logEvent({
      action: 'permission_revoked',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: tenantId,
      details: {
        roleName: role.name,
        resourceType: removedEntry.resource.type,
        permission: removedEntry.permission,
        resourceId: removedEntry.resource.id || 'all'
      }
    });
  }
  
  return true;
}

/**
 * Update all ACL entries for a role
 */
export async function updateRoleACL(
  tenantId: string,
  roleId: string,
  aclEntries: TenantACE[],
  role: Role
): Promise<Role | null> {
  // Store the previous ACL entries for audit logging
  const previousACL = [...role.aclEntries];
  
  // Update the ACL entries
  role.aclEntries = aclEntries;
  role.updatedAt = new Date().toISOString();
  
  // Analyze changes for detailed audit logging
  const addedEntries = aclEntries.filter(newEntry => 
    !previousACL.some(oldEntry => 
      oldEntry.resource.type === newEntry.resource.type &&
      oldEntry.permission === newEntry.permission &&
      oldEntry.resource.id === newEntry.resource.id
    )
  );
  
  const removedEntries = previousACL.filter(oldEntry => 
    !aclEntries.some(newEntry => 
      newEntry.resource.type === oldEntry.resource.type &&
      newEntry.permission === oldEntry.permission &&
      newEntry.resource.id === oldEntry.resource.id
    )
  );
  
  // Store updated role
  if (role.isGlobal) {
    await kv.set(`role:global:${roleId}`, role);
    
    // Audit the global role ACL update
    await AuditService.logEvent({
      action: 'global_role_acl_updated',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: 'system',
      details: {
        roleName: role.name,
        previousACL: previousACL.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        newACL: aclEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        added: addedEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        removed: removedEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        }))
      }
    });
  } else {
    await kv.set(`role:${tenantId}:${roleId}`, role);
    
    // Audit the tenant role ACL update
    await AuditService.logEvent({
      action: 'role_acl_updated',
      resourceType: 'role',
      resourceId: roleId,
      tenantId: tenantId,
      details: {
        roleName: role.name,
        previousACL: previousACL.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        newACL: aclEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        added: addedEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        })),
        removed: removedEntries.map(entry => ({
          resourceType: entry.resource.type,
          permission: entry.permission,
          resourceId: entry.resource.id || 'all'
        }))
      }
    });
  }
  
  return role;
}

/**
 * Check if a role has a specific ACL entry
 */
export function hasACLEntry(
  role: Role,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string
): boolean {
  return role.aclEntries.some(entry => 
    entry.resource.type === resourceType &&
    entry.permission === permission &&
    (resourceId ? entry.resource.id === resourceId : !entry.resource.id)
  );
}