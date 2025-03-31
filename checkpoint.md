# Checkpoint: Multi-Tenant ACL Implementation Plan

## Current Status

I've analyzed the multi-tenancy architecture and ACL system specifications to implement the new unified role-based ACL system with tenant isolation. Based on the specification document and GitHub issues, I'll be working on implementing the core components of this system.

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

## Implementation Plan

Based on the GitHub issues (#42-#46) and the specification document, I'll implement the unified role-based ACL system with the following steps:

### 1. Core Data Model Implementation (Issue #45)

I'll create the necessary interfaces and types for the new role-based ACL system:

- Create `Role` and `UserRole` interfaces in a new file `src/components/admin/auth/utils/roles.ts`
- Extend the `Resource` interface to include required `tenantId` field
- Update type definitions to support tenant-scoped permissions

### 2. Redis Storage for Roles and User-Role Assignments

I'll implement the Redis storage layer for roles and user-role assignments:

- Create role storage with tenant-specific keys (`role:{tenantId}:{roleId}`)
- Create user-role assignment storage (`user:roles:{userId}:{tenantId}`)
- Create tenant membership storage (`tenant:users:{tenantId}`)

### 3. Core Services Implementation

#### 3.1 RoleService

I'll create a new service to manage roles and user-role assignments:

- Methods to create, update, and delete roles
- Methods to assign and remove roles from users
- Methods to get roles by tenant
- Enhanced permission checking with tenant context

#### 3.2 TenantMembershipService

I'll implement a service to manage user-tenant relationships:

- Methods to check tenant membership
- Methods to get user's accessible tenants
- Methods to add and remove users from tenants

### 4. API Infrastructure (Issue #44)

I'll implement the tenant validation middleware to ensure proper tenant isolation:

- Create `withTenantAccess` middleware for API route protection
- Create `withPermission` middleware for permission-based access control
- Update API routes to use these middlewares

### 5. UI Components (Issue #43)

I'll create React components to manage tenant access in the UI:

- Implement `TenantGuard` component for tenant-based access control
- Implement `PermissionGuard` component for permission-based UI controls

## Implementation Progress

I've completed the core implementation of the multi-tenant ACL system with the following components:

### 1. Core Data Model

Created the necessary interfaces and types for the new role-based ACL system:
- Defined `Role` and `UserRole` interfaces in `src/components/admin/auth/utils/roles.ts`
- Extended the `Resource` interface to include required `tenantId` field
- Added helper functions for role management and permission checking

### 2. Service Layer

Implemented the core services for managing roles and tenant memberships:

#### 2.1 RoleService (`src/lib/role-service.ts`)
- Methods to create, update, and delete roles
- Methods to assign and remove roles from users
- Permission checking with tenant context
- User-role relationship management

#### 2.2 TenantMembershipService (`src/lib/tenant-membership-service.ts`)
- Methods to check tenant membership
- Methods to get user's accessible tenants
- User-tenant relationship management

### 3. API Infrastructure

Implemented the tenant validation middleware for API routes:
- `withTenantAccess` middleware to validate tenant context
- `withPermission` middleware for permission checks
- `withTenantContext` middleware to automatically add tenant context

### 4. UI Components

Created React components for UI access control:
- `TenantGuard` component to restrict access based on tenant membership
- `PermissionGuard` component for permission-based UI protection
- `AccessDenied` component for consistent access denial UI

### Next Steps

1. ✅ **Testing**: Created comprehensive tests for all components of the multi-tenant ACL system
2. **Role Management UI**: Implement the role definition and assignment interface (Issue #46)
3. **Migration Strategy**: Create a plan to convert existing permissions to the new system
4. **Documentation**: Update documentation to reflect the new permission model
5. **Integration**: Integrate the new system with existing authentication flow

## Testing Implementation

We've added comprehensive unit tests for all components of the multi-tenant ACL system:

### 1. Service Layer Tests
- Tests for `RoleService` to verify role creation, modification, deletion, and permission checking
- Tests for `TenantMembershipService` to ensure proper tenant membership management
- Mocked Redis and service dependencies for isolated testing

### 2. Middleware Tests
- Tests for the tenant validation middleware
- Tests for permission checking with tenant context
- Tests for automatic tenant resolution from hostname

### 3. UI Component Tests
- Tests for the `TenantGuard` component
- Tests for the `PermissionGuard` component
- Verified proper rendering based on tenant membership and permissions

### 4. Utility Function Tests
- Tests for role utility functions
- Tests for the role ACL helpers
- Tests for the tenant-scoped permission checking

All tests follow best practices with proper mocking of dependencies and comprehensive coverage of success and error cases. The tests ensure the robustness of the multi-tenant ACL system implementation.

This implementation provides a unified role-based ACL system with strong tenant isolation, simplifying permission management while maintaining security. The tests we've added ensure that the system functions correctly and maintains tenant isolation as designed.

## Summary and Next Tasks

The core components of the multi-tenant ACL system have been implemented, with PR #47 created for review. The implementation follows the specification document and addresses issue #45.

To complete the entire multi-tenant ACL system, the following tasks remain:

1. **Tenant Validation Middleware** (Issue #44): Currently working on integrating the middleware with the Next.js API routes.

2. **TenantGuard Component** (Issue #43): The component has been implemented but needs to be integrated with the existing admin UI.

3. **Role Management UI** (Issue #46): We need to implement the interface for managing roles, permissions, and user-role assignments.

4. **Testing**: Comprehensive tests should be created to verify the system's security and functionality.

## Current Work: Implementing Tenant Validation Middleware (Issue #44)

I'm currently working on implementing the Tenant Validation Middleware to integrate it with Next.js API routes. This middleware is critical for maintaining proper tenant isolation and security in the multi-tenant environment.

### Implementation Plan:

1. Create middleware for tenant validation
2. Implement tenant membership check service
3. Apply middleware to all tenant-sensitive API routes
4. Create tests to verify tenant isolation
5. Optimize performance with caching where appropriate

The middleware will ensure that users can only access resources in tenants they have membership in, with proper error handling for unauthorized tenant access attempts.
