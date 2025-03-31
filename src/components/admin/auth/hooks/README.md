# Authentication and Permission Hooks

This directory contains React hooks for authentication and permission checking in the DirectoryMonster application.

## Available Hooks

### `useAuth`

Provides authentication state and functions.

### `useTenantPermission`

Provides tenant-specific permission checking for multi-tenant environments.

## useTenantPermission

The `useTenantPermission` hook provides a convenient way to check permissions in tenant context.

### Usage

```tsx
import { useTenantPermission } from '@/components/admin/auth/hooks';

function MyComponent() {
  const { 
    isLoading,
    isMember,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkGlobalPermission,
    getAccessibleResources
  } = useTenantPermission();

  // Example usage
  useEffect(() => {
    async function checkAccess() {
      const canManageListings = await checkPermission('listing', 'manage');
      
      if (canManageListings) {
        // User can manage listings
      }
    }
    
    if (!isLoading && isMember) {
      checkAccess();
    }
  }, [isLoading, isMember, checkPermission]);
  
  // Render based on tenant membership
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isMember) {
    return <div>You don't have access to this tenant</div>;
  }
  
  return <div>Tenant member content</div>;
}
```

### Return Values

| Name | Type | Description |
|------|------|-------------|
| `isLoading` | `boolean` | True while checking tenant membership |
| `isMember` | `boolean` | Whether user is a member of the current tenant |
| `checkPermission` | `(resourceType, permission, resourceId?) => Promise<boolean>` | Check a single permission |
| `checkAnyPermission` | `(resourceType, permissions[], resourceId?) => Promise<boolean>` | Check if user has any of the permissions |
| `checkAllPermissions` | `(resourceType, permissions[], resourceId?) => Promise<boolean>` | Check if user has all of the permissions |
| `checkGlobalPermission` | `(resourceType, permission) => Promise<boolean>` | Check global permission for a resource type |
| `getAccessibleResources` | `(resourceType, permission) => Promise<string[]>` | Get all resource IDs user has permission for |

### Example: Conditionally Rendering UI Elements

```tsx
import { useTenantPermission } from '@/components/admin/auth/hooks';
import { useState, useEffect } from 'react';

function ListingManagement() {
  const { checkPermission, checkGlobalPermission } = useTenantPermission();
  const [canCreate, setCanCreate] = useState(false);
  const [canManageAll, setCanManageAll] = useState(false);
  
  useEffect(() => {
    async function checkPermissions() {
      const hasCreatePermission = await checkPermission('listing', 'create');
      setCanCreate(hasCreatePermission);
      
      const hasGlobalManagePermission = await checkGlobalPermission('listing', 'manage');
      setCanManageAll(hasGlobalManagePermission);
    }
    
    checkPermissions();
  }, [checkPermission, checkGlobalPermission]);
  
  return (
    <div>
      <h1>Listing Management</h1>
      
      {canCreate && (
        <button>Create New Listing</button>
      )}
      
      {canManageAll && (
        <button>Bulk Edit All Listings</button>
      )}
    </div>
  );
}
```

### Example: Checking Multiple Permissions

```tsx
import { useTenantPermission } from '@/components/admin/auth/hooks';
import { useState, useEffect } from 'react';

function UserEditor({ userId }) {
  const { checkAllPermissions } = useTenantPermission();
  const [canEditUserRoles, setCanEditUserRoles] = useState(false);
  
  useEffect(() => {
    async function checkPermissions() {
      // Check if user can both read and update user roles
      const hasPermissions = await checkAllPermissions(
        'user', 
        ['read', 'update'], 
        userId
      );
      
      setCanEditUserRoles(hasPermissions);
    }
    
    checkPermissions();
  }, [userId, checkAllPermissions]);
  
  return (
    <div>
      <h1>Edit User</h1>
      
      {canEditUserRoles ? (
        <div>
          <h2>Role Management</h2>
          {/* Role editing UI */}
        </div>
      ) : (
        <p>You don't have permission to edit roles for this user</p>
      )}
    </div>
  );
}
```