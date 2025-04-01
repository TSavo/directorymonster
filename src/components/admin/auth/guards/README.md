# TenantGuard Component

The TenantGuard component provides UI-level access control for multi-tenant applications, restricting content based on tenant membership and permissions.

## Features

- **Tenant Membership Checking**: Verifies that a user has access to the current tenant
- **Permission-Based Access Control**: Supports checking specific permissions by resource type
- **Multiple Permission Modes**: Can require either any or all permissions from a list
- **Resource-Specific Permissions**: Supports both global and resource-specific permission checks
- **Customizable Fallback**: Allows for customized "access denied" experiences

## Usage Examples

### Basic Tenant Membership Check

```tsx
import { TenantGuard } from '@/components/admin/auth/guards';

function MyProtectedPage() {
  return (
    <TenantGuard>
      <h1>Welcome to Tenant Dashboard</h1>
      {/* Only visible to tenant members */}
    </TenantGuard>
  );
}
```

### Checking Specific Permission

```tsx
import { TenantGuard } from '@/components/admin/auth/guards';

function ListingEditor() {
  return (
    <TenantGuard 
      resourceType="listing"
      permission="update"
      fallback={<p>You don't have permission to edit listings</p>}
    >
      <h1>Edit Listing</h1>
      {/* Only visible to users with update permission for listings */}
    </TenantGuard>
  );
}
```

### Checking Multiple Permissions (Any)

```tsx
import { TenantGuard } from '@/components/admin/auth/guards';

function CategoryManagement() {
  return (
    <TenantGuard 
      resourceType="category"
      permissions={['create', 'update']}
      requireAll={false}
      fallback={<p>You need create or update permission for categories</p>}
    >
      <h1>Category Management</h1>
      {/* Visible with either create or update permission */}
    </TenantGuard>
  );
}
```

### Checking Multiple Permissions (All)

```tsx
import { TenantGuard } from '@/components/admin/auth/guards';

function UserManager() {
  return (
    <TenantGuard 
      resourceType="user"
      permissions={['read', 'update']}
      requireAll={true}
      fallback={<p>You need both read and update permissions for users</p>}
    >
      <h1>User Management</h1>
      {/* Only visible with both read and update permissions */}
    </TenantGuard>
  );
}
```

### Resource-Specific Permission

```tsx
import { TenantGuard } from '@/components/admin/auth/guards';

function EditSpecificListing({ listingId }) {
  return (
    <TenantGuard 
      resourceType="listing"
      permission="update"
      resourceId={listingId}
      fallback={<p>You don't have permission to edit this specific listing</p>}
    >
      <h1>Edit Listing {listingId}</h1>
      {/* Only visible with update permission for this specific listing */}
    </TenantGuard>
  );
}
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `children` | `ReactNode` | Protected content to render if access is granted | Required |
| `fallback` | `ReactNode` | Content to render if access is denied | `<AccessDenied />` |
| `resourceType` | `ResourceType` | Type of resource to check permission for | Optional |
| `permission` | `Permission` | Specific permission to check | Optional |
| `permissions` | `Permission[]` | Multiple permissions to check | Optional |
| `resourceId` | `string` | ID of specific resource to check | Optional |
| `requireAll` | `boolean` | Whether all permissions are required (true) or any permission (false) | `false` |
| `showLoading` | `boolean` | Whether to show loading indicator while checking | `true` |

## Related Components and Hooks

- **useTenantPermission**: Hook for programmatic permission checking
- **PermissionGuard**: Simpler component for checking single permissions
- **RoleGuard**: Component for role-based access control