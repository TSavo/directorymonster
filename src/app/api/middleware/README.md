# API Middleware for Multi-Tenant Applications

This directory contains middleware functions for securing API routes in a multi-tenant environment.

## Overview

The middleware in this directory provides:

1. **Tenant Access Validation**: Ensures users only access resources in tenants they are members of
2. **Permission Checking**: Validates specific permissions for resource operations
3. **Authentication Verification**: Validates JWT tokens and user identity
4. **Tenant Context**: Adds tenant information to request context

## Available Middleware

### `withTenantAccess`

Validates that the authenticated user has access to the requested tenant.

```typescript
import { withTenantAccess } from '@/app/api/middleware';

export async function GET(req: NextRequest) {
  return withTenantAccess(req, async (validatedReq) => {
    // This handler only runs if tenant access is valid
    const tenantId = validatedReq.headers.get('x-tenant-id');
    
    return NextResponse.json({ success: true });
  });
}
```

### `withPermission`

Validates both tenant access and specific permission for a resource type.

```typescript
import { withPermission } from '@/app/api/middleware';

export async function POST(req: NextRequest) {
  return withPermission(
    req,
    'category',  // Resource type
    'create',    // Permission
    async (validatedReq) => {
      // This handler only runs if permission check passes
      const tenantId = validatedReq.headers.get('x-tenant-id');
      
      return NextResponse.json({ success: true });
    }
  );
}
```

### `withAuthentication`

Validates JWT token and provides user ID to the handler.

```typescript
import { withAuthentication } from '@/app/api/middleware';

export async function GET(req: NextRequest) {
  return withAuthentication(req, async (validatedReq, userId) => {
    // This handler only runs if authentication is valid
    return NextResponse.json({ userId, success: true });
  });
}
```

### `withTenantContext`

Adds tenant context to the request headers.

```typescript
import { withTenantContext } from '@/app/api/middleware';

export async function GET(req: NextRequest) {
  return withTenantContext(req, async (reqWithTenant) => {
    // This handler gets a request with tenant context
    const tenantId = reqWithTenant.headers.get('x-tenant-id');
    
    return NextResponse.json({ success: true });
  });
}
```

## Best Practices

1. **Always Use Tenant Validation**: For any tenant-specific data, always use `withTenantAccess` or `withPermission` middleware.
2. **Be Specific with Permissions**: Use the most specific permission required for each operation.
3. **Handle Errors Appropriately**: The middleware returns appropriate error responses, but you can customize error handling inside your route handlers.
4. **Combine with Authentication**: For routes that require both authentication and tenant validation, nest the middleware:

```typescript
import { withAuthentication, withTenantAccess } from '@/app/api/middleware';

export async function GET(req: NextRequest) {
  return withAuthentication(req, async (validatedReq, userId) => {
    return withTenantAccess(validatedReq, async (tenantValidatedReq) => {
      // Both authentication and tenant access are valid
      return NextResponse.json({ success: true });
    });
  });
}
```

## Testing

Middleware can be tested both:

1. In isolation, mocking the required dependencies
2. As part of API route tests, mocking the middleware itself

See the test files in `tests/api/middleware` for examples.
