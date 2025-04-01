# Multi-Tenant Access Control Specification

## Overview

This specification outlines the design and implementation of a unified multi-tenant access control system for DirectoryMonster. The system uses roles as collections of ACL entries to provide fine-grained permission management while maintaining strict tenant isolation even for users with cross-tenant access.

## Core Concepts

### 1. Multi-Tenancy Model

#### 1.1 Tenant Definition

A tenant represents a logical grouping of resources, users, and configuration settings. Each tenant:

- Has a unique identifier
- Can have multiple hostnames (domains) pointing to it
- Contains its own set of sites, categories, listings, and settings
- Has its own set of users and roles

#### 1.2 Tenant Resolution

Tenants are resolved through hostname mapping:

1. When a request arrives, the hostname is normalized and used to look up the tenant
2. All subsequent operations happen within the context of the resolved tenant
3. Tenant context is maintained throughout the request lifecycle
4. Debug overrides allow testing with different tenant contexts

#### 1.3 Cross-Tenant Access

While users can have access to multiple tenants, operations always occur within a single tenant context:

1. User requests arrive at a specific hostname
2. The hostname resolves to a specific tenant
3. All operations are executed in that tenant's context
4. Switching tenants requires a new request to a different hostname

### 2. Unified Role-ACL Model

#### 2.1 Resource Definition

Resources are the objects to which access is controlled:

```typescript
export type ResourceType = 'user' | 'site' | 'category' | 'listing' | 'setting' | 'tenant';

export interface Resource {
  type: ResourceType;
  id?: string;        // Specific resource ID (if null, applies to all resources of this type)
  tenantId: string;   // The tenant this resource belongs to
}
```

#### 2.2 Permission Definition

Permissions define what actions can be performed on resources:

```typescript
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface ACE {
  resource: Resource;
  permission: Permission;
}
```

#### 2.3 Role Definition

Roles are named collections of ACEs that can be assigned to users:

```typescript
export interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string;         // The tenant this role belongs to (null for global roles)
  isGlobal: boolean;        // Whether this role applies across all tenants
  aclEntries: ACE[];        // The permissions this role grants
}
```

#### 2.4 User-Role Assignment

Users are assigned roles within specific tenants:

```typescript
export interface UserRole {
  userId: string;
  roleId: string;
  tenantId: string;  // The tenant context for this role assignment
}
```

## Security Architecture

### 1. Tenant Isolation Principles

#### 1.1 Explicit Tenant Context

All operations must include explicit tenant context:

1. Resource definitions include mandatory `tenantId`
2. Permission checks require tenant context
3. API endpoints validate tenant membership
4. UI components verify tenant access

#### 1.2 Defense in Depth

Multiple security layers ensure tenant isolation:

1. **Layer 1: Authentication** - Verifies user identity
2. **Layer 2: Tenant Membership** - Verifies user belongs to the current tenant
3. **Layer 3: Permission Checking** - Verifies user has required permissions within tenant
4. **Layer 4: Data Access** - Uses tenant-prefixed Redis keys to maintain data isolation

#### 1.3 Zero Trust Principle

Each request is validated independently:

1. No assumptions about cross-request tenant context
2. Tenant context is explicitly validated on each request
3. No global permissions without explicit verification
4. Credentials and roles are validated on each request

### 2. Cross-Tenant Access Control

#### 2.1 Global Roles

Some roles can operate across tenants while maintaining isolation:

1. Global roles (like SuperAdmin) have `isGlobal: true`
2. Global roles still require explicit tenant context for operations
3. Global roles enable tenant management permissions
4. Operations always execute within a specific tenant context

#### 2.2 Tenant Switching

Users with access to multiple tenants can switch contexts:

1. User authenticates once
2. UI shows all accessible tenants
3. Switching tenants requires opening a different hostname
4. Each hostname operates in its own tenant context
5. Cross-tenant data transfer is explicitly controlled

#### 2.3 Tenant Management

Special permissions control tenant creation and configuration:

1. Tenant management is controlled by the `'tenant'` resource type
2. Only global roles can create/modify tenants
3. Tenant management operations are audited
4. Special validation ensures tenant isolation integrity

## Implementation Architecture

### 1. Data Layer

#### 1.1 Role Storage

Roles are stored in Redis with tenant-specific prefixes:

```
role:{tenantId}:{roleId} -> {role data}
```

#### 1.2 User-Role Assignment Storage

User-role assignments are stored in Redis with user and tenant indexes:

```
user:roles:{userId}:{tenantId} -> Set[roleId]
tenant:users:{tenantId} -> Set[userId]
```

#### 1.3 Session Management

Auth sessions include tenant context information:

```typescript
interface AuthSession {
  userId: string;
  username: string;
  currentTenantId: string;
  accessibleTenants: string[];
  // Other session data...
}
```

### 2. Service Layer

#### 2.1 RoleService

Manages role definitions and user-role assignments:

```typescript
class RoleService {
  // Create a role within a tenant
  static async createRole(role: Omit<Role, 'id'>): Promise<Role>;
  
  // Update an existing role
  static async updateRole(roleId: string, updates: Partial<Role>): Promise<Role>;
  
  // Delete a role (and remove all assignments)
  static async deleteRole(roleId: string): Promise<boolean>;
  
  // Get roles by tenant
  static async getRolesByTenant(tenantId: string): Promise<Role[]>;
  
  // Assign role to user
  static async assignRoleToUser(userId: string, roleId: string): Promise<void>;
  
  // Remove role from user
  static async removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  
  // Get user's roles in a tenant
  static async getUserRoles(userId: string, tenantId: string): Promise<Role[]>;
  
  // Check if user has specific permission in tenant
  static async hasPermission(
    userId: string, 
    tenantId: string,
    resourceType: ResourceType,
    permission: Permission,
    resourceId?: string
  ): Promise<boolean>;
}
```

#### 2.2 TenantMembershipService

Manages user-tenant relationships:

```typescript
class TenantMembershipService {
  // Check if user is member of tenant
  static async isTenantMember(userId: string, tenantId: string): Promise<boolean>;
  
  // Get all tenants a user has access to
  static async getUserTenants(userId: string): Promise<TenantConfig[]>;
  
  // Add user to tenant (with default role)
  static async addUserToTenant(userId: string, tenantId: string, roleId?: string): Promise<void>;
  
  // Remove user from tenant
  static async removeUserFromTenant(userId: string, tenantId: string): Promise<void>;
  
  // Get all users in a tenant
  static async getTenantUsers(tenantId: string): Promise<User[]>;
}
```

### 3. API Layer

#### 3.1 Tenant Validation Middleware

All API routes include tenant validation:

```typescript
// Tenant validation middleware
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
  
  // Check if user is a member of this tenant
  const isMember = await TenantMembershipService.isTenantMember(decoded.userId, tenantId);
  
  if (!isMember) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  
  return handler(req);
}
```

#### 3.2 Permission Middleware

API routes requiring specific permissions include permission checks:

```typescript
// Permission middleware
export async function withPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const tenantId = req.headers.get('x-tenant-id')!;
  const authHeader = req.headers.get('authorization')!;
  
  // Extract user ID from auth token
  const token = authHeader.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  
  // Check if user has required permission
  const hasPermission = await RoleService.hasPermission(
    decoded.userId,
    tenantId,
    resourceType,
    permission,
    resourceId
  );
  
  if (!hasPermission) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }
  
  return handler(req);
}
```

### 4. UI Layer

#### 4.1 TenantGuard Component

Restricts UI access based on tenant membership:

```tsx
export function TenantGuard({
  children,
  fallback = <AccessDenied />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const { tenant } = useTenant();
  const [hasTenantAccess, setHasTenantAccess] = useState<boolean>(false);
  
  useEffect(() => {
    async function checkAccess() {
      if (isAuthenticated && user && tenant) {
        const isMember = await TenantMembershipService.isTenantMember(
          user.id, tenant.id
        );
        setHasTenantAccess(isMember);
      }
    }
    
    checkAccess();
  }, [isAuthenticated, user, tenant]);
  
  if (!isAuthenticated || !user || !tenant || !hasTenantAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
```

#### 4.2 PermissionGuard Component

Restricts UI elements based on specific permissions:

```tsx
export function PermissionGuard({
  children,
  resourceType,
  permission,
  resourceId,
  fallback = null,
}: {
  children: ReactNode;
  resourceType: ResourceType;
  permission: Permission;
  resourceId?: string;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  
  useEffect(() => {
    async function checkPermission() {
      if (user && tenant) {
        const permitted = await RoleService.hasPermission(
          user.id,
          tenant.id,
          resourceType,
          permission,
          resourceId
        );
        setHasPermission(permitted);
      }
    }
    
    checkPermission();
  }, [user, tenant, resourceType, permission, resourceId]);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
```

## Security Considerations

### 1. Request Flow Security

When a request arrives:

1. **Hostname Resolution**: Maps hostname to tenant ID
2. **Authentication**: Verifies user identity via token
3. **Tenant Membership Check**: Verifies user has access to the resolved tenant
4. **Permission Check**: Verifies user has required permissions within the tenant
5. **Operation Execution**: Performs the requested operation with tenant context
6. **Response Filtering**: Ensures only tenant-appropriate data is returned

### 2. Cross-Tenant Attack Prevention

#### 2.1 Tenant Context Validation

Prevents unauthorized cross-tenant access:

- All database keys include tenant prefixes
- API endpoints validate tenant context on each request
- UI components verify tenant membership before rendering
- Resource IDs include tenant context in internal systems

#### 2.2 Tenant ID Isolation

Prevents tenant ID spoofing:

- Tenant IDs are generated as UUIDs, not sequential numbers
- Tenant IDs are not exposed in URLs or client-side code
- Hostname-to-tenant mapping is only performed server-side
- Client receives only the minimum tenant information needed

#### 2.3 Authorization Layering

Enforces defense in depth:

- Authentication (proving identity)
- Tenant membership (proving tenant access)
- Permission verification (proving operation access)
- Data access validation (enforcing tenant data boundaries)

### 3. Audit Trail

A comprehensive audit trail tracks security-relevant events:

```typescript
interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  tenantId: string;
  action: string;
  resourceType: ResourceType;
  resourceId?: string;
  details: Record<string, any>;
}
```

Key audited events include:
- Role creation/modification
- Role assignment changes
- Tenant membership changes
- Permission denial events
- Cross-tenant access attempts
- Tenant configuration changes

## Implementation Guidelines

### 1. Migration Strategy

To migrate from the current dual permission system:

1. Create database schema for roles and user-role assignments
2. Convert existing role hierarchy to role definitions
3. Convert existing ACLs to role assignments
4. Update auth system to use role-based permission checks
5. Test permission equivalence between old and new systems
6. Deploy with feature flag to enable gradual rollout
7. Monitor for permission issues during transition

### 2. Testing Requirements

Comprehensive testing includes:

1. **Unit tests**:
   - Test role creation and updates
   - Verify permission calculation
   - Test tenant isolation at the data layer

2. **Integration tests**:
   - Verify API tenant validation
   - Test cross-tenant access controls
   - Confirm permission propagation from roles

3. **Security tests**:
   - Attempt cross-tenant access
   - Verify tenant isolation
   - Test permission boundaries
   - Confirm defense-in-depth effectiveness

4. **Performance tests**:
   - Measure permission calculation overhead
   - Verify caching effectiveness
   - Test with realistic user-role assignments

## UI Specifications

### 1. Role Management Interface

Administrators need interfaces to:

1. **Create and edit roles**:
   - Define role name, description, and tenant scope
   - Select permissions by resource type and operation
   - Clone existing roles as templates

2. **Manage user-role assignments**:
   - Assign roles to users
   - View users by role
   - View roles by user
   - Manage cross-tenant assignments for global admins

3. **Tenant user management**:
   - Add users to tenants
   - Remove users from tenants
   - View and filter tenant users

### 2. User Experience

The UI should make tenant context clear:

1. Tenant selector for users with multi-tenant access
2. Clear indication of current tenant context
3. Permission-aware UI that hides unauthorized elements
4. Clear error messages for permission or tenant access issues

## Conclusion

This unified role-based ACL system for multi-tenancy provides:

1. Strong tenant isolation even for users with cross-tenant access
2. Simplified permission management through role assignments
3. Flexible access control that adapts to organizational structure
4. Defense-in-depth security architecture
5. Clear audit trail for security events

The system maintains robust security while simplifying administration and enabling complex multi-tenant scenarios.
