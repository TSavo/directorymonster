# Global Roles Functionality

This document provides guidance on using the Global Roles functionality in DirectoryMonster, which allows certain roles to operate across tenant boundaries while maintaining proper tenant isolation.

## Overview

Global roles are roles that have permissions to perform operations across multiple tenants. Unlike normal tenant-specific roles, global roles allow administrative access across tenant boundaries. However, global roles still require explicit tenant context for operations to maintain proper tenant isolation.

## Key Concepts

### 1. Global Role Properties

- Global roles have the `isGlobal: true` property
- Global roles are always associated with the 'system' tenant (`tenantId: 'system'`)
- Global roles can grant permissions across tenant boundaries
- Global roles still require explicit tenant context for operations
- Global roles are stored separately from tenant-specific roles

### 2. Global Role Permissions

Global roles can grant permissions to:
- Manage tenant configuration
- Perform operations within specific tenants
- Access cross-tenant data (with explicit tenant context)

Global roles **cannot**:
- Bypass tenant isolation (each operation still requires explicit tenant context)
- Access data without proper permission checks

## Usage Patterns

### Creating a Global Role

```typescript
// Using the createGlobalRole helper
const globalRole = await RoleService.createGlobalRole({
  name: 'Global Administrator',
  description: 'Administrator with cross-tenant access',
  aclEntries: [
    // Tenant management permission (global)
    {
      resource: {
        type: 'tenant',
        tenantId: 'system'
      },
      permission: 'manage'
    },
    // User management permission (applies to all tenants)
    {
      resource: {
        type: 'user',
        tenantId: 'system'
      },
      permission: 'manage'
    }
  ]
});
```

### Assigning a Global Role to a User

```typescript
// Global roles must be assigned within a tenant context
// This creates the necessary tenant-role mapping
await RoleService.assignRoleToUser(
  userId,     // User ID
  tenantId,   // Context tenant (where the role will be active)
  globalRoleId // The global role ID
);
```

### Checking Global Role Permissions

```typescript
// Check if user has a specific global permission
const canManageTenants = await RoleService.hasGlobalPermission(
  userId,     // User ID
  'tenant',   // Resource type
  'manage',   // Permission
  tenantId    // Optional tenant context
);

// Check if user has any global role
const hasGlobalRole = await RoleService.hasGlobalRole(userId);

// Get all global roles for a user
const globalRoles = await RoleService.getUserGlobalRoles(userId);
```

## Security Best Practices

1. **Limit Global Role Assignment**
   - Only assign global roles to trusted administrative users
   - Regularly audit global role assignments using the `getUsersWithGlobalRole` method

2. **Maintain Explicit Tenant Context**
   - Always provide explicit tenant context for operations, even with global roles
   - Use `hasPermission` with specific tenant IDs rather than bypassing permission checks

3. **Audit Global Role Operations**
   - All global role operations are automatically logged via the AuditService
   - Regularly review audit logs for global role operations

4. **Use Narrow Permissions**
   - Grant the minimum required permissions in global roles
   - Use resource-specific permissions rather than broad tenant-wide permissions

## Implementation Details

### Global Role Storage

Global roles are stored in Redis with a different prefix from tenant-specific roles:
- Tenant roles: `role:{tenantId}:{roleId}`
- Global roles: `role:global:{roleId}`

This separation ensures efficient lookup and prevents conflicts.

### Global Role Indexing

To optimize performance, global roles use additional Redis indexes:
- `global:roles` - Set of all global role IDs
- `global:role:users` - Set of all user IDs with global roles

### Cross-Tenant Permission Evaluation

Permission evaluation for global roles follows these steps:
1. Check if the user has the role in the specified tenant context
2. For global roles, check if the role grants the requested permission
3. Enforce tenant context validation even for global permissions

## Common Issues

### Global Role Not Working Across Tenants

If a global role doesn't seem to work across tenants, check:
- The role has `isGlobal: true` and `tenantId: 'system'`
- The role has been properly assigned to the user in each tenant where it should be active
- The role's ACL entries include the required permissions

### Permission Denied Despite Global Role

If a user with a global role receives "Permission Denied", check:
- The operation is being performed with explicit tenant context
- The global role includes the specific permission being requested
- The user still has the global role assignment (use `getUserGlobalRoles` to verify)

## API Reference

The RoleService provides the following methods for working with global roles:

| Method | Description |
|--------|-------------|
| `createGlobalRole` | Creates a new global role with system tenant and isGlobal flag |
| `getGlobalRole` | Gets a specific global role by ID |
| `getGlobalRoles` | Gets all global roles in the system |
| `getUserGlobalRoles` | Gets all global roles for a specific user |
| `hasGlobalPermission` | Checks if a user has a specific global permission |
| `hasGlobalPermissionAnyTenant` | Checks if a user has a permission across any tenant |
| `hasGlobalRole` | Checks if a user has any global role |
| `getUsersWithGlobalRole` | Gets all users with a specific global role |
