# Admin Permission Middleware Specification

## Overview

This specification defines the standard approach for applying permission middleware to admin routes in DirectoryMonster. It ensures consistent security patterns across all administrative endpoints, maintaining proper tenant isolation and permission enforcement.

## Core Security Requirements

All admin routes must enforce:

1. **Tenant Context Validation** - Verify the request includes valid tenant context and the user belongs to that tenant
2. **Permission Verification** - Check that the user has the required permission for the requested operation
3. **Resource-Specific Access Control** - For operations on specific resources, verify the user has permission for that specific resource

## Standard Permission Middleware Pattern

### Route Handler Pattern

All admin route handlers should follow this pattern:

```typescript
// For collection-level operations (list, create)
export async function handler(req: NextRequest) {
  return withTenantAccess(
    req,
    withPermission(
      req,
      'resourceType',
      'permission',
      async (req) => {
        // Route implementation
        return NextResponse.json({ data });
      }
    )
  );
}

// For resource-specific operations (get, update, delete)
export async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  return withTenantAccess(
    req,
    withResourcePermission(
      req,
      'resourceType',
      'permission',
      async (req) => {
        // Route implementation
        return NextResponse.json({ data });
      }
    )
  );
}
```

### Permission Mapping

Standard permission mapping by HTTP method:

| Method | Operation | Permission | Middleware |
|--------|-----------|------------|------------|
| GET (collection) | List resources | read | withPermission |
| POST | Create resource | create | withPermission |
| GET (resource) | Get specific resource | read | withResourcePermission |
| PUT | Update resource | update | withResourcePermission |
| PATCH | Partial update | update | withResourcePermission |
| DELETE | Delete resource | delete | withResourcePermission |

For special operations that don't fit this pattern, document the exception with rationale.

## Route-Permission Mapping

### Sites Admin Routes

| Route | HTTP Method | Resource Type | Permission | Middleware |
|-------|-------------|---------------|------------|------------|
| /api/admin/sites | GET | site | read | withPermission |
| /api/admin/sites | POST | site | create | withPermission |
| /api/admin/sites/:id | GET | site | read | withResourcePermission |
| /api/admin/sites/:id | PUT | site | update | withResourcePermission |
| /api/admin/sites/:id | DELETE | site | delete | withResourcePermission |
| /api/admin/sites/:id/settings | GET | site | read | withResourcePermission |
| /api/admin/sites/:id/settings | PUT | site | update | withResourcePermission |
| /api/admin/sites/:id/publish | POST | site | manage | withResourcePermission |

### Categories Admin Routes

| Route | HTTP Method | Resource Type | Permission | Middleware |
|-------|-------------|---------------|------------|------------|
| /api/admin/categories | GET | category | read | withPermission |
| /api/admin/categories | POST | category | create | withPermission |
| /api/admin/categories/:id | GET | category | read | withResourcePermission |
| /api/admin/categories/:id | PUT | category | update | withResourcePermission |
| /api/admin/categories/:id | DELETE | category | delete | withResourcePermission |
| /api/admin/categories/reorder | POST | category | update | withPermission |

### Listings Admin Routes

| Route | HTTP Method | Resource Type | Permission | Middleware |
|-------|-------------|---------------|------------|------------|
| /api/admin/listings | GET | listing | read | withPermission |
| /api/admin/listings | POST | listing | create | withPermission |
| /api/admin/listings/:id | GET | listing | read | withResourcePermission |
| /api/admin/listings/:id | PUT | listing | update | withResourcePermission |
| /api/admin/listings/:id | DELETE | listing | delete | withResourcePermission |
| /api/admin/listings/:id/feature | POST | listing | manage | withResourcePermission |
| /api/admin/listings/:id/images | POST | listing | update | withResourcePermission |
| /api/admin/listings/:id/verify | POST | listing | manage | withResourcePermission |

### Users Admin Routes

| Route | HTTP Method | Resource Type | Permission | Middleware |
|-------|-------------|---------------|------------|------------|
| /api/admin/users | GET | user | read | withPermission |
| /api/admin/users | POST | user | create | withPermission |
| /api/admin/users/:id | GET | user | read | withResourcePermission |
| /api/admin/users/:id | PUT | user | update | withResourcePermission |
| /api/admin/users/:id | DELETE | user | delete | withResourcePermission |
| /api/admin/users/:id/roles | GET | user | read | withResourcePermission |
| /api/admin/users/:id/roles | POST | user | manage | withResourcePermission |
| /api/admin/users/:id/roles/:roleId | DELETE | user | manage | withResourcePermission |

### Roles Admin Routes

| Route | HTTP Method | Resource Type | Permission | Middleware |
|-------|-------------|---------------|------------|------------|
| /api/admin/roles | GET | role | read | withPermission |
| /api/admin/roles | POST | role | create | withPermission |
| /api/admin/roles/:id | GET | role | read | withResourcePermission |
| /api/admin/roles/:id | PUT | role | update | withResourcePermission |
| /api/admin/roles/:id | DELETE | role | delete | withResourcePermission |
| /api/admin/roles/:id/permissions | GET | role | read | withResourcePermission |
| /api/admin/roles/:id/permissions | PUT | role | update | withResourcePermission |
| /api/admin/roles/:id/users | GET | role | read | withResourcePermission |

### Settings Admin Routes

| Route | HTTP Method | Resource Type | Permission | Middleware |
|-------|-------------|---------------|------------|------------|
| /api/admin/settings | GET | setting | read | withPermission |
| /api/admin/settings | PUT | setting | update | withPermission |
| /api/admin/settings/:key | GET | setting | read | withResourcePermission |
| /api/admin/settings/:key | PUT | setting | update | withResourcePermission |
| /api/admin/settings/tenant | GET | tenant | read | withPermission |
| /api/admin/settings/tenant | PUT | tenant | manage | withPermission |

### Audit Admin Routes

| Route | HTTP Method | Resource Type | Permission | Middleware |
|-------|-------------|---------------|------------|------------|
| /api/admin/audit | GET | audit | read | withPermission |
| /api/admin/audit/:id | GET | audit | read | withResourcePermission |
| /api/admin/audit/export | POST | audit | read | withPermission |

### Dashboard Admin Routes

| Route | HTTP Method | Resource Type | Permission | Middleware |
|-------|-------------|---------------|------------|------------|
| /api/admin/dashboard/stats | GET | setting | read | withPermission |
| /api/admin/dashboard/activity | GET | audit | read | withPermission |

## Special Permission Cases

### Multiple Permissions

Some operations may require multiple permissions. Use the `withAllPermissions` middleware:

```typescript
return withTenantAccess(
  req,
  withAllPermissions(
    req,
    'resourceType',
    ['permission1', 'permission2'],
    async (req) => {
      // Route implementation
      return NextResponse.json({ data });
    },
    resourceId // optional
  )
);
```

### Alternative Permissions

Some operations may be allowed with any of several permissions. Use the `withAnyPermission` middleware:

```typescript
return withTenantAccess(
  req,
  withAnyPermission(
    req,
    'resourceType',
    ['permission1', 'permission2'],
    async (req) => {
      // Route implementation
      return NextResponse.json({ data });
    },
    resourceId // optional
  )
);
```

## Error Handling

Permission middleware should return standardized error responses:

```javascript
// 401 Unauthorized - Missing or invalid authentication
{
  "error": "Authentication required",
  "message": "Valid authentication is required for this operation"
}

// 403 Forbidden - Valid authentication but insufficient permissions
{
  "error": "Permission denied",
  "message": "Required '{permission}' permission for {resourceType}",
  "details": {
    "resourceType": "resourceType",
    "permission": "permission",
    "resourceId": "resourceId" // if applicable
  }
}
```

## Testing Requirements

Each secured route must have integration tests that verify:

1. Access is allowed with proper permissions
2. Access is denied without required permissions
3. Access is denied for resources in other tenants
4. Proper error messages are returned for different authorization failures

## Implementation Approach

1. Apply middleware to each route according to the mapping
2. Create helper functions to standardize middleware application
3. Add integration tests for each secured route
4. Verify error messages match the standard format
5. Document any exceptions to the standard pattern

## Conclusion

This specification ensures consistent application of permission middleware across all admin routes. Adhering to these standards maintains proper tenant isolation and authorization checking throughout the administrative interface.
