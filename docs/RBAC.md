# Role-Based Access Control (RBAC)

This document describes the Role-Based Access Control (RBAC) system implemented in DirectoryMonster.

## Overview

The RBAC system provides a flexible and secure way to control access to resources in the application. It is based on the following concepts:

- **Resources**: The objects that users can access (e.g., sites, categories, listings)
- **Permissions**: The actions that users can perform on resources (e.g., create, read, update, delete, manage)
- **Roles**: Named collections of permissions that can be assigned to users
- **Tenants**: Isolated environments that contain their own resources and users
- **Sites**: Individual directory sites within a tenant

## Predefined Roles

The system includes two types of predefined roles:

1. **Tenant-wide roles**: Apply across all sites within a tenant
2. **Site-specific roles**: Apply only to a specific site within a tenant

### Tenant-wide Roles

#### Tenant Admin Role

The Tenant Admin role has full administrative access to all resources across all sites within a tenant. Tenant Admins can:

- Create, read, update, delete, and manage all resource types across all sites
- Manage user roles and permissions
- Configure tenant settings
- Create and manage sites

#### Tenant Editor Role

The Tenant Editor role is designed for content managers who need to create and edit content across all sites. Tenant Editors can:

- Create, read, and update categories and listings across all sites
- Read other resource types (users, sites, settings, audit logs, roles)

#### Tenant Author Role

The Tenant Author role is for content creators who need to create and edit their own content across all sites. Tenant Authors can:

- Create, read, and update listings across all sites
- Read all other resource types

#### Tenant Viewer Role

The Tenant Viewer role provides read-only access to all resources across all sites. Tenant Viewers can:

- Read all resource types across all sites
- Cannot create, update, or delete any resources

### Site-specific Roles

#### Site Admin Role

The Site Admin role has administrative access to a specific site. Site Admins can:

- Create, read, update, delete, and manage categories and listings for a specific site
- Read other resource types (users, sites, settings, audit logs, roles)

#### Site Editor Role

The Site Editor role is designed for content managers who need to create and edit content for a specific site. Site Editors can:

- Create, read, and update categories and listings for a specific site
- Read other resource types (users, sites, settings, audit logs, roles)

#### Site Author Role

The Site Author role is for content creators who need to create and edit their own content for a specific site. Site Authors can:

- Create, read, and update listings for a specific site
- Read all other resource types

#### Site Viewer Role

The Site Viewer role provides read-only access to a specific site. Site Viewers can:

- Read categories and listings for a specific site
- Read other resource types (users, sites, settings, audit logs, roles)

## Resource Types

The following resource types are defined in the system:

- `user`: User accounts
- `site`: Directory sites
- `category`: Content categories
- `listing`: Directory listings
- `setting`: System and tenant settings
- `audit`: Audit logs
- `role`: User roles

## Permissions

The following permissions are defined in the system:

- `create`: Ability to create new resources
- `read`: Ability to view resources
- `update`: Ability to modify existing resources
- `delete`: Ability to remove resources
- `manage`: Full control over resources (implies all other permissions)

## Implementation

### Creating Predefined Roles

You can create predefined roles in a tenant using the following methods:

#### Command Line

```bash
# Initialize tenant-wide roles only
npx ts-node src/scripts/init-tenant-roles.ts <tenantId>

# Initialize both tenant-wide and site-specific roles
npx ts-node src/scripts/init-tenant-roles.ts <tenantId> <siteId>

# Initialize site-specific roles only
npx ts-node src/scripts/init-tenant-roles.ts <tenantId> <siteId> --site-only
```

#### API

```typescript
// Create tenant-wide roles
const tenantRoles = await fetch(`/api/tenants/${tenantId}/roles/predefined`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'tenant' })
});

// Create site-specific roles
const siteRoles = await fetch(`/api/tenants/${tenantId}/roles/predefined`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'site', siteId })
});

// Create both tenant-wide and site-specific roles
const allRoles = await fetch(`/api/tenants/${tenantId}/roles/predefined`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ siteId })
});

// Create a specific tenant-wide role
const tenantAdminRole = await fetch(`/api/tenants/${tenantId}/roles/predefined/Tenant Admin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

// Create a specific site-specific role
const siteEditorRole = await fetch(`/api/tenants/${tenantId}/roles/predefined/Site Editor`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ siteId })
});
```

#### Programmatically

```typescript
import { PredefinedRoles } from '@/lib/role/predefined-roles';

// Create tenant-wide roles
const tenantRoles = await PredefinedRoles.createTenantRoles(tenantId);

// Create site-specific roles
const siteRoles = await PredefinedRoles.createSiteRoles(tenantId, siteId);

// Create both tenant-wide and site-specific roles
const allRoles = await PredefinedRoles.createAllRoles(tenantId, siteId);

// Create a specific tenant-wide role
const tenantAdminRole = await PredefinedRoles.createPredefinedRole(tenantId, 'Tenant Admin');

// Create a specific site-specific role
const siteEditorRole = await PredefinedRoles.createPredefinedRole(tenantId, 'Site Editor', siteId);
```

### Assigning Roles to Users

You can assign roles to users using the RoleAssignment component:

```tsx
import { RoleAssignment } from '@/components/admin/auth/RoleAssignment';

// For tenant-wide roles only
function UserManagement({ userId }) {
  return (
    <div>
      <h1>User Management</h1>
      <RoleAssignment userId={userId} />
    </div>
  );
}

// For both tenant-wide and site-specific roles
function SiteUserManagement({ userId, siteId }) {
  return (
    <div>
      <h1>Site User Management</h1>
      <RoleAssignment userId={userId} siteId={siteId} />
    </div>
  );
}
```

### Checking Permissions

You can check if a user has a specific permission using the following methods:

#### API Middleware

```typescript
import { withAuth } from '@/middleware/withAuth';

// For tenant-wide permissions
export const GET = withRedis(
  withAuth(
    async (request, { params }) => {
      // Handler implementation
    },
    { requiredPermission: 'read:category' }
  )
);

// For site-specific permissions, check in the handler
export const GET = withRedis(
  withAuth(
    async (request, { params }) => {
      const { siteId } = params;
      const resourceType = 'category';
      const permission = 'read';

      // Check if user has permission for this specific site
      const hasPermission = await checkSitePermission(request.auth.userId, siteId, resourceType, permission);

      if (!hasPermission) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      // Handler implementation
    },
    { requiredPermission: 'read:category' } // Fallback to tenant-wide permission
  )
);
```

#### React Components

```tsx
import { PermissionGuard } from '@/components/admin/auth/guards/PermissionGuard';

// For tenant-wide permissions
function ProtectedComponent() {
  return (
    <PermissionGuard resourceType="category" permission="create">
      <div>This content is only visible to users with create:category permission</div>
    </PermissionGuard>
  );
}

// For site-specific permissions
function SiteProtectedComponent({ siteId }) {
  return (
    <PermissionGuard resourceType="category" permission="create" resourceId={siteId}>
      <div>This content is only visible to users with create:category permission for this site</div>
    </PermissionGuard>
  );
}
```

#### React Hooks

```tsx
import { usePermission } from '@/components/admin/auth/hooks/usePermission';

// For tenant-wide permissions
function TenantComponent() {
  const canCreateCategory = usePermission({
    resourceType: 'category',
    permission: 'create'
  });

  return (
    <div>
      {canCreateCategory ? (
        <button>Create Category</button>
      ) : (
        <p>You don't have permission to create categories</p>
      )}
    </div>
  );
}

// For site-specific permissions
function SiteComponent({ siteId }) {
  const canCreateCategory = usePermission({
    resourceType: 'category',
    permission: 'create',
    resourceId: siteId
  });

  return (
    <div>
      {canCreateCategory ? (
        <button>Create Category for this Site</button>
      ) : (
        <p>You don't have permission to create categories for this site</p>
      )}
    </div>
  );
}
```

## Best Practices

1. **Use tenant-wide roles** for users who need access across all sites
2. **Use site-specific roles** for users who only need access to specific sites
3. **Follow the principle of least privilege** by granting only the permissions needed
4. **Regularly audit role assignments** to ensure users have appropriate access
5. **Use PermissionGuard components** to protect sensitive UI elements
6. **Use withAuth middleware** to protect API endpoints
7. **Consider role hierarchies** when designing your permission system
8. **Document role requirements** for different user types in your application
