# RoleService Enhancements

This directory contains enhancements to the RoleService to improve audit logging and ACL management.

## Overview

The enhancements include:

1. **Tenant Role Audit Logging**: Adding audit logging for tenant role updates and deletions
2. **ACL Operations**: Specialized methods for ACL operations with dedicated audit events
3. **Enhanced Audit Details**: More detailed audit events for ACL changes

## Integration Guide

To integrate these enhancements into the main RoleService, follow these steps:

### 1. Add Tenant Role Audit Logging

In the `updateRole` method, add the following code after updating a tenant role:

```typescript
// After line 283 in role-service.ts
if (!currentRole.isGlobal) {
  const key = getRoleKey(tenantId, roleId);
  await kv.set(key, updatedRole);
  
  // Audit the tenant role update
  await AuditService.logEvent({
    action: 'role_updated',
    resourceType: 'role',
    resourceId: roleId,
    tenantId: tenantId,
    details: {
      roleName: updatedRole.name,
      updates: Object.keys(updates)
    }
  });
}
```

In the `deleteRole` method, add the following code before deleting a tenant role:

```typescript
// Before line 368 in role-service.ts
// Delete the role
const key = getRoleKey(tenantId, roleId);

// Audit the tenant role deletion
await AuditService.logEvent({
  action: 'role_deleted',
  resourceType: 'role',
  resourceId: roleId,
  tenantId: tenantId,
  details: {
    roleName: role.name
  }
});

await kv.del(key);
```

### 2. Add ACL-Specific Methods

Add the following methods to the RoleService class:

```typescript
/**
 * Add an ACL entry to a role
 */
static async addACLEntry(
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
    
    return await addACLEntry(tenantId, roleId, aclEntry, role);
  } catch (error) {
    console.error(`Error adding ACL entry to role ${roleId}:`, error);
    return false;
  }
}

/**
 * Remove an ACL entry from a role
 */
static async removeACLEntry(
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
    
    return await removeACLEntry(tenantId, roleId, resourceType, permission, role, resourceId);
  } catch (error) {
    console.error(`Error removing ACL entry from role ${roleId}:`, error);
    return false;
  }
}

/**
 * Update all ACL entries for a role
 */
static async updateRoleACL(
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
    
    return await updateRoleACL(tenantId, roleId, aclEntries, role);
  } catch (error) {
    console.error(`Error updating ACL entries for role ${roleId}:`, error);
    return null;
  }
}

/**
 * Check if a role has a specific ACL entry
 */
static async hasACLEntry(
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
    
    return hasACLEntry(role, resourceType, permission, resourceId);
  } catch (error) {
    console.error(`Error checking ACL entry for role ${roleId}:`, error);
    return false;
  }
}
```

### 3. Import the Required Functions

Add the following imports at the top of the file:

```typescript
import { 
  auditTenantRoleUpdate, 
  auditTenantRoleDelete,
  addACLEntry,
  removeACLEntry,
  updateRoleACL,
  hasACLEntry
} from './role-service/role-service-patch';
```

## Testing

After integrating these changes, run the tests to ensure everything is working correctly:

```bash
npx jest tests/unit/lib/role-service/audit-permissions.test.ts
```

## Benefits

These enhancements provide:

1. Complete audit logging for all role operations (global and tenant)
2. Specialized methods for ACL management with detailed audit events
3. Enhanced security tracking for permission changes
4. Better debugging capabilities for permission-related issues