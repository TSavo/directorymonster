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

## Improved Approach: Roles as ACL Collections

After analyzing the system, we've identified a more elegant approach to authorization that would simplify multi-tenant permission management:

### 1. Unified Permission Model

- **Roles as ACL Collections**: Define roles as named bundles of ACL entries
- **Single Source of Truth**: Use ACL as the fundamental permission system
- **Dynamic Role Updates**: When a role is modified, all users with that role get updated permissions

### 2. Implementation Model

```typescript
// Define a role type
interface Role {
  id: string;
  name: string;
  description: string;
  aclEntries: ACE[];  // The permissions this role grants
  tenantId?: string;  // Optional tenant scope for the role
}

// User-role relationship
interface UserRole {
  userId: string;
  roleId: string;
  tenantId?: string;  // Which tenant this role applies to
}
```

### 3. Benefits

- **Simplified Administration**: Assign roles instead of individual permissions
- **Consistent Permissions**: Users in the same role have identical permissions
- **Efficient Updates**: Changing a role updates permissions for all users with that role
- **Clear Tenant Boundaries**: Roles can be scoped to specific tenants
- **Flexible Access Control**: Users can have different roles in different tenants

## Implementation Recommendations

### 1. Create Role Management System

```typescript
// Service for managing roles
class RoleService {
  // Create a new role
  static async createRole(roleName: string, description: string, aclEntries: ACE[], tenantId?: string): Promise<Role> {
    // Implementation
  }
  
  // Update a role's permissions
  static async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    // Implementation - this would update permissions for all users with this role
  }
  
  // Assign a role to a user
  static async assignRoleToUser(userId: string, roleId: string, tenantId?: string): Promise<void> {
    // Implementation
  }
  
  // Get all roles for a user in a tenant
  static async getUserRoles(userId: string, tenantId?: string): Promise<Role[]> {
    // Implementation
  }
}
```

### 2. Enhance TenantService

```typescript
// Add methods to TenantService
static async getUserTenants(userId: string): Promise<TenantConfig[]> {
  // Return all tenants a user has access to via their roles
}

static async checkUserHasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  // Check if a user has any roles in this tenant
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
  
  // Check if user has access to this tenant via any role
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

Add middleware to validate tenant access based on roles:

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
  
  // Check if user has any roles in this tenant
  const hasAccess = await TenantService.checkUserHasTenantAccess(decoded.userId, tenantId);
  
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  
  return handler(req);
}
```

## Testing Recommendations

Develop comprehensive tests to validate the new role-based ACL system:

1. **Unit tests**:
   - Test role creation and updates
   - Verify permission propagation when roles change
   - Test tenant-specific role assignments

2. **Integration tests**:
   - Verify role-based tenant access controls
   - Test cross-tenant access for users with roles in multiple tenants
   - Validate tenant isolation with the new role system

3. **End-to-end tests**:
   - Test role management UI for administrators
   - Verify proper permission application with different roles
   - Test tenant isolation in UI components

## Next Steps

1. Create GitHub issues for implementing the roles as ACL collections approach
2. Develop a migration strategy from the current dual system to the unified approach
3. Implement and test the enhanced multi-tenant ACL system
4. Update documentation to reflect the new permission model

This improved approach should significantly simplify the administration of multi-tenant permissions while maintaining fine-grained control over resource access.
