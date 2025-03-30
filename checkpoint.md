# Checkpoint: Multi-Tenancy and ACL System Analysis

## Current Status

I've analyzed the multi-tenancy architecture and ACL system to understand the current implementation and identify potential improvements for better integration between these two systems.

## Multi-Tenancy Architecture

### 1. Current Implementation
- **TenantService**: Core service that manages tenant data in Redis
  - Handles tenant creation, retrieval, updates, and deletion
  - Manages hostname-to-tenant mapping
  - Provides normalization of hostnames for consistent lookup
- **Tenant Resolution**:
  - Tenants are identified by hostname through request headers
  - The system supports multiple hostnames per tenant with a primary hostname
  - A tenant can be resolved via middleware that injects tenant information into headers
- **Data Isolation**:
  - Each tenant appears to have its own isolated data space
  - Redis keys are prefixed to separate tenant data

### 2. ACL System

- **Permission Model**:
  - Fine-grained permissions based on resource types and operations
  - Supports specific resource IDs or applies to all resources of a type
  - Has site-scoped permissions with `siteId` parameter
- **Role-Based Access Control**:
  - The system has a hierarchical role system (admin, editor, viewer)
  - Roles are evaluated through the `canAccess` method
- **ACL Implementation**:
  - Each user has an ACL with an array of access control entries (ACEs)
  - Each ACE specifies a resource and permission
  - `hasPermission` function checks if a user has a specific permission

### 3. Current Integration Points

- **User Data**: User objects include both role and ACL properties
- **Site Scoping**: ACL entries can be scoped to specific sites via `siteId`
- **Component Guards**: 
  - `ACLGuard` for fine-grained permission checks
  - `RoleGuard` for role-based access control

## Potential Improvements for Multi-Tenant ACL

### 1. Tenant-Based Permission Scoping

The current system links permissions to sites via `siteId`, but there seems to be a missing explicit connection between tenants and sites. Consider the following improvements:

- Create a clear mapping between tenants and sites
- Add tenant-level permissions that apply to all resources under a tenant
- Ensure ACL checks always include the current tenant context

### 2. Cross-Tenant Access Control

There doesn't appear to be explicit handling for users who should have access across multiple tenants:

- Define permissions for managing tenants themselves
- Create super-admin roles that work across all tenants
- Implement tenant membership checks in auth flows

### 3. Tenant Isolation in APIs

The API endpoints don't consistently check for tenant context:

- Ensure all API endpoints validate the tenant context
- Add middleware to enforce tenant isolation
- Check tenant membership before allowing access to resources

### 4. Authentication Session Enhancement

The session management could be improved to handle tenant context:

- Store tenant information in auth tokens
- Include tenant context in auth checks
- Support tenant switching for users with access to multiple tenants

## Implementation Recommendations

### 1. Enhance TenantService

```typescript
// Add methods to TenantService
static async getUserTenants(userId: string): Promise<TenantConfig[]> {
  // Return all tenants a user has access to
}

static async checkUserHasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  // Check if a user has access to this tenant
}
```

### 2. Update ACL System

```typescript
// Extend Resource interface to include tenantId
export interface Resource {
  type: ResourceType;
  id?: string;
  siteId?: string;
  tenantId?: string; // Add explicit tenant ID
}

// Update hasPermission to check tenant context
export function hasPermission(
  acl: ACL,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string,
  siteId?: string,
  tenantId?: string
): boolean {
  // Add tenant-specific checks
}
```

### 3. Create TenantGuard Component

```typescript
// Create a new TenantGuard component
export function TenantGuard({
  children,
  tenantId,
  fallback = <AccessDenied />,
}: {
  children: ReactNode;
  tenantId: string;
  fallback?: ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  
  // Check if user has access to this tenant
  const [hasTenantAccess, setHasTenantAccess] = useState(false);
  
  useEffect(() => {
    async function checkAccess() {
      if (isAuthenticated && user) {
        const hasAccess = await TenantService.checkUserHasTenantAccess(user.id, tenantId);
        setHasTenantAccess(hasAccess);
      }
    }
    
    checkAccess();
  }, [isAuthenticated, user, tenantId]);
  
  if (!isAuthenticated || !user || !hasTenantAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
```

### 4. Enhance API Authentication

Add middleware to validate tenant context in all API requests:

```typescript
// Add tenant validation middleware
export async function withTenantAccess(
  req: NextRequest, 
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const tenantId = req.headers.get('x-tenant-id');
  const authHeader = req.headers.get('authorization');
  
  if (!tenantId || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Extract user ID from auth token
  const token = authHeader.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  
  // Check if user has access to this tenant
  const hasAccess = await TenantService.checkUserHasTenantAccess(decoded.userId, tenantId);
  
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  
  return handler(req);
}
```

## Testing Recommendations

Develop comprehensive tests to validate multi-tenant ACL behavior:

1. **Unit tests**:
   - Test tenant permission checks with and without tenant context
   - Verify role-based access controls respect tenant boundaries
   - Test tenant membership checks

2. **Integration tests**:
   - Verify API endpoints properly enforce tenant isolation
   - Test cross-tenant access with different user roles
   - Validate tenant switching for users with multiple tenants

3. **End-to-end tests**:
   - Test domain-based tenant identification with permission checks
   - Verify tenant isolation in UI components
   - Test admin workflows across tenants

## Next Steps

1. Review this analysis with the team
2. Prioritize the recommended improvements
3. Create GitHub issues for the agreed improvements
4. Implement and test the enhanced multi-tenant ACL system

This analysis should provide a good foundation for improving the integration between the multi-tenancy and ACL systems to ensure proper tenant isolation while supporting users who need access across tenants.
</function_results>

Now let's create some GitHub issues based on our analysis:

<function_calls>
<invoke name="execute_command">
<parameter name="command">cd C:\Users\T\directorymonster && gh issue create --title "[TASK] Enhance ACL System with Tenant Context" --body "Improve the ACL system to explicitly include tenant context in permission checks.\n\n**Steps:**\n1. Extend Resource interface to include tenantId\n2. Update hasPermission function to check tenant context\n3. Add tenant-specific permission helpers\n4. Update tests for tenant-scoped permissions\n\n**Acceptance Criteria:**\n- All permission checks include tenant context\n- Permissions can be scoped to specific tenants\n- Users can have different permissions in different tenants\n- Existing role-based permissions continue to work" --label "type:enhancement,priority:high,layer:security"