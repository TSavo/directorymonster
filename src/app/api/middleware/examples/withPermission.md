# withPermission Middleware

This middleware provides authorization controls for API routes, ensuring users have the required permissions to access resources within a tenant context.

## Features

- **Permission Checking**: Validate that users have specific permissions for resource types
- **Resource-Specific Permissions**: Control access to individual resources by ID
- **Multiple Permission Options**: Check for any permission, all permissions, or specific permissions
- **Resource ID Extraction**: Automatically extract resource IDs from URL or request body
- **Audit Logging**: Log permission access and denial events for security monitoring
- **Tenant Integration**: Built on top of tenant access controls for complete multi-tenant security

## Usage

### Basic Permission Check

```typescript
import { withPermission } from '@/app/api/middleware';

export async function GET(req: NextRequest) {
  return withPermission(
    req,
    'category',  // Resource type
    'read',      // Permission
    async (validatedReq) => {
      // Handler only runs if permission check passes
      return NextResponse.json({ data: [...] });
    }
  );
}
```

### Check Permission for Specific Resource

```typescript
import { withPermission } from '@/app/api/middleware';

export async function PUT(req: NextRequest) {
  return withPermission(
    req,
    'category',     // Resource type
    'update',       // Permission
    async (validatedReq) => {
      // Process the update
      return NextResponse.json({ success: true });
    },
    'category-123'  // Resource ID
  );
}
```

### Check for Any of Multiple Permissions

```typescript
import { withAnyPermission } from '@/app/api/middleware';

export async function POST(req: NextRequest) {
  return withAnyPermission(
    req,
    'listing',             // Resource type
    ['create', 'update'],  // Any of these permissions
    async (validatedReq) => {
      // Handler runs if user has either permission
      return NextResponse.json({ success: true });
    }
  );
}
```

### Require Multiple Permissions

```typescript
import { withAllPermissions } from '@/app/api/middleware';

export async function DELETE(req: NextRequest) {
  return withAllPermissions(
    req,
    'category',            // Resource type
    ['delete', 'manage'],  // All of these permissions
    async (validatedReq) => {
      // Handler runs only if user has both permissions
      return NextResponse.json({ success: true });
    }
  );
}
```

### Automatic Resource ID Extraction

```typescript
import { withResourcePermission } from '@/app/api/middleware';

export async function PUT(req: NextRequest) {
  return withResourcePermission(
    req,
    'listing',    // Resource type
    'update',     // Permission
    async (validatedReq) => {
      // Resource ID is extracted from URL or request body
      return NextResponse.json({ success: true });
    },
    'listingId'   // Parameter name in URL or body (default: 'id')
  );
}
```

### Audited Permission Checks

```typescript
import { withAuditedPermission } from '@/app/api/middleware';

export async function POST(req: NextRequest) {
  return withAuditedPermission(
    req,
    'setting',    // Resource type
    'update',     // Permission
    async (validatedReq) => {
      // Access is logged for audit purposes
      return NextResponse.json({ success: true });
    }
  );
}
```

## Error Responses

The middleware returns structured error responses:

- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: User lacks required permission
- **500 Internal Server Error**: Unexpected error during validation

Example error response:

```json
{
  "error": "Permission denied",
  "message": "Required 'update' permission for category with ID category-123",
  "details": {
    "resourceType": "category",
    "permission": "update",
    "resourceId": "category-123"
  }
}
```

## Best Practices

1. **Use Specific Resource Types**: Be as specific as possible with resource types.
2. **Specify Resource IDs**: When operating on a specific resource, always include its ID.
3. **Combine with withTenantAccess**: For routes that don't check permissions but need tenant access.
4. **Use Audit Middleware**: For sensitive operations, use `withAuditedPermission` to log access.
5. **Handle Errors Gracefully**: Add try/catch blocks for custom error handling.

## Examples

See the [withPermissionExample.ts](./withPermissionExample.ts) file for complete examples showing all middleware variants.
