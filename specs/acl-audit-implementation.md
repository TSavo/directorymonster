# ACL Audit and Implementation Specification

## Overview

This specification outlines the process for conducting a comprehensive audit of the application's Access Control List (ACL) system, documenting the current state, identifying gaps, and implementing missing ACL protections to ensure all access is properly secured.

## Objectives

1. Conduct a comprehensive audit of all endpoints, components, and features
2. Create a permission matrix documenting all resources and required permissions
3. Implement missing ACL protections using the `withSecureTenantPermission` middleware
4. Add frontend permission checks to ensure UI components respect permissions
5. Test edge cases including cross-tenant, cross-site, and delegation scenarios
6. Document the ACL system for developers

## Audit Methodology

### API Endpoints Audit

1. **Inventory Creation**:
   - List all API routes in the application
   - Categorize by resource type (users, listings, categories, etc.)
   - Document HTTP methods supported by each endpoint

2. **Protection Analysis**:
   - Check each route for `withSecureTenantPermission` middleware
   - Identify public vs. protected endpoints
   - Document the current permission requirements

3. **Gap Identification**:
   - Flag endpoints missing appropriate protection
   - Note inconsistencies in permission requirements
   - Identify overly permissive endpoints

## Initial API Audit Findings

### Protected Endpoints (with ACL)

| Endpoint | HTTP Method | Protection | Resource Type | Permission |
|----------|------------|------------|--------------|------------|
| `/api/sites` | GET | `withSecureTenantPermission` | site | read |
| `/api/admin/listings` | GET | `withSecureTenantPermission` | listing | read |
| `/api/example` | POST | `withSecureTenantPermission` | category | create |
| `/api/example/[id]` | GET | `withSecureTenantPermission` | category | read |
| `/api/example/[id]` | PUT | `withSecureTenantPermission` | category | update |
| `/api/example/[id]` | DELETE | `withSecureTenantPermission` | category | delete |

### Endpoints with Alternative Protection

| Endpoint | HTTP Method | Protection | Notes |
|----------|------------|------------|-------|
| `/api/auth/verify` | POST | `withRateLimit`, `withAuthSecurity` | Authentication endpoint |
| `/api/auth/salt/[username]` | GET | `withRateLimit`, `withAuthSecurity` | Authentication support endpoint |
| `/api/admin/security/block-ip` | POST | `withAdminAuth` | Admin security endpoint |
| `/api/admin/security/metrics` | GET | `withAdminAuth` | Admin security endpoint |
| `/api/admin/security/report` | POST | `withAdminAuth` | Admin security endpoint |

### Public Endpoints (Intentionally Unprotected)

| Endpoint | HTTP Method | Current Protection | Status |
|----------|------------|-------------------|--------|
| `/api/test` | GET | None | Correctly public |
| `/api/sites/[siteSlug]` | GET | `withRedis` only | Correctly public |
| `/api/sites/[siteSlug]/categories` | GET | `withRedis` only | Correctly public |
| `/api/sites/[siteSlug]/categories/[categorySlug]` | GET | `withRedis` only | Correctly public |
| `/api/sites/[siteSlug]/categories/[categorySlug]/listings` | GET | `withRedis` only | Correctly public |
| `/api/sites/[siteSlug]/listings` | GET | `withRedis` only | Correctly public |
| `/api/search` | GET | `withRedis` only | Correctly public |

### Endpoints Missing ACL Protection

| Endpoint | HTTP Method | Current Protection | Recommended Protection |
|----------|------------|-------------------|------------------------|
| `/api/test` | POST | None | `withSecureTenantPermission('test', 'create')` |
| `/api/products` | GET | API Key only | `withSecureTenantPermission('product', 'read')` |
| `/api/tenants` | GET | None | `withSecureTenantPermission('tenant', 'read')` |
| `/api/tenants` | POST | None | `withSecureTenantPermission('tenant', 'create')` |
| `/api/tenants/[id]` | GET | None | `withSecureTenantPermission('tenant', 'read')` |
| `/api/tenants/[id]` | PATCH | None | `withSecureTenantPermission('tenant', 'update')` |
| `/api/tenants/[id]` | DELETE | None | `withSecureTenantPermission('tenant', 'delete')` |
| `/api/admin/users` | GET | Session check only | `withSecureTenantPermission('user', 'read')` |
| `/api/admin/users` | POST | Session check only | `withSecureTenantPermission('user', 'create')` |
| `/api/admin/users/[id]` | GET | Session check only | `withSecureTenantPermission('user', 'read')` |
| `/api/admin/users/[id]` | PUT/PATCH | Session check only | `withSecureTenantPermission('user', 'update')` |
| `/api/admin/users/[id]` | DELETE | Session check only | `withSecureTenantPermission('user', 'delete')` |
| `/api/admin/categories` | GET | Unclear | `withSecureTenantPermission('category', 'read')` |
| `/api/admin/categories` | POST | Tenant access only | `withSecureTenantPermission('category', 'create')` |

### Inconsistencies and Issues

1. **Inconsistent Protection Patterns**:
   - Some endpoints use `withSecureTenantPermission` directly
   - Others use `withTenantAccess` followed by permission checks
   - Some admin endpoints use custom `withAdminAuth` instead of ACL

2. **Admin Endpoints Protection**:
   - Admin endpoints should all be protected with ACLs but many rely only on session checks
   - The `/api/admin/*` routes should consistently use `withSecureTenantPermission` middleware

3. **Missing Resource Types**:
   - Some resource types in code don't match the types defined in the ACL system
   - Inconsistent use of resource types across similar endpoints

4. **Submission and Review Workflow**:
   - The submission API needs authentication to check if users can submit
   - Need to implement proper ACL checks for submission endpoints
   - The review process requires specific permissions (`submission:review`, `submission:approve`, `submission:reject`)
   - Need to ensure proper separation between submission creation and review/approval

### Frontend Component Audit

1. **Component Inventory**:
   - List all administrative and sensitive UI components
   - Categorize by functionality and resource type
   - Document actions performed by each component

2. **Permission Check Analysis**:
   - Check for permission-based conditional rendering
   - Verify permission checks before sensitive operations
   - Document components with permission checks

3. **Gap Identification**:
   - Flag components missing permission checks
   - Note inconsistencies in permission handling
   - Identify components with improper permission logic

### Feature-Level Audit

1. **Feature Mapping**:
   - Identify key application features
   - Document the endpoints and components involved
   - Map permission requirements across feature workflows

2. **Permission Flow Analysis**:
   - Trace permission checks throughout feature flows
   - Verify consistent permission enforcement
   - Document cross-cutting permission concerns

3. **Gap Identification**:
   - Flag features with incomplete permission coverage
   - Note inconsistencies in permission requirements
   - Identify security vulnerabilities in feature workflows

## Permission Matrix Documentation

### Resource Types and Operations

Based on the codebase analysis, the following resource types and operations have been identified:

#### Resource Types

| Resource Type | Description | Examples |
|--------------|-------------|----------|
| `user` | User accounts | Admin users, regular users |
| `tenant` | Tenant organizations | Customer organizations |
| `site` | Sites within tenants | Customer websites |
| `category` | Content categories | Product categories, article sections |
| `listing` | Content listings | Products, articles, services |
| `setting` | System settings | Configuration options |
| `role` | User roles | Admin, editor, viewer roles |
| `submission` | Listings pending review | User-submitted content awaiting approval |
| `audit` | Audit logs | Security events, user actions |

#### Permission Operations

| Operation | Description | Example Use |
|-----------|-------------|-------------|
| `create` | Create new resources | Creating a new user |
| `read` | View existing resources | Viewing user details |
| `update` | Modify existing resources | Updating user profile |
| `delete` | Remove existing resources | Deleting a user account |
| `manage` | Full control over resources | Managing all aspects of users |
| `review` | Review submitted content | Reviewing content submissions |
| `approve` | Approve changes or submissions | Approving content submissions |
| `reject` | Reject changes or submissions | Rejecting content submissions |
| `assign` | Assign resources to users | Assigning roles to users |

### Permission Matrix

The following matrix maps resource types to operations, showing which permissions are available:

| Resource Type | create | read | update | delete | manage | review | approve | reject | assign |
|--------------|:------:|:----:|:------:|:------:|:------:|:------:|:-------:|:------:|:------:|
| `user`        | ✓      | ✓    | ✓      | ✓      | ✓      |        |         |        | ✓      |
| `tenant`      | ✓      | ✓    | ✓      | ✓      | ✓      |        |         |        |        |
| `site`        | ✓      | ✓    | ✓      | ✓      | ✓      |        |         |        |        |
| `category`    | ✓      | ✓    | ✓      | ✓      | ✓      |        |         |        |        |
| `listing`     | ✓      | ✓    | ✓      | ✓      | ✓      |        |         |        |        |
| `setting`     | ✓      | ✓    | ✓      | ✓      | ✓      |        |         |        |        |
| `role`        | ✓      | ✓    | ✓      | ✓      | ✓      |        |         |        | ✓      |
| `submission`  | ✓      | ✓    | ✓      | ✓      | ✓      | ✓      | ✓       | ✓      |        |
| `audit`       |        | ✓    |        |        | ✓      |        |         |        |        |

### Role Templates

The following role templates have been identified in the codebase:

#### System-level Roles

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **Super Admin** | Global administrator with access to all tenants | All permissions across all tenants |
| **System Auditor** | Read-only access to audit logs across all tenants | `audit:read` across all tenants |

#### Tenant-level Roles

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **Tenant Admin** | Full access to a specific tenant | All permissions within the tenant |
| **Tenant Manager** | Manage tenant settings but not users/roles | `site:*`, `category:*`, `listing:*`, `setting:*` |
| **User Manager** | Manage users within a tenant | `user:*`, `role:assign` |

#### Site-level Roles

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **Site Admin** | Full access to a specific site | All permissions within the site |
| **Content Manager** | Manage content within a site | `category:*`, `listing:*` |
| **Content Editor** | Edit content but cannot create/delete | `category:read`, `category:update`, `listing:read`, `listing:update` |
| **Content Reviewer** | Review and approve/reject submissions | `submission:read`, `submission:review`, `submission:approve`, `submission:reject` |
| **Viewer** | Read-only access to site content | `category:read`, `listing:read` |

## Implementation Plan

### Backend Implementation

Based on the audit findings, the following endpoints need ACL protection implemented:

#### High Priority

1. **Admin User Management**
   - `/api/admin/users` (GET, POST)
   - `/api/admin/users/[id]` (GET, PUT/PATCH, DELETE)
   - Add `withPermission('user', 'read'/'create'/'update'/'delete')` middleware

2. **Tenant Management**
   - `/api/tenants` (GET, POST)
   - `/api/tenants/[id]` (GET, PATCH, DELETE)
   - Add `withPermission('tenant', 'read'/'create'/'update'/'delete')` middleware

3. **Admin Category Management**
   - `/api/admin/categories` (GET, POST)
   - Add `withPermission('category', 'read'/'create')` middleware

#### Medium Priority

1. **Submission and Review Workflow**
   - `/api/submissions` (GET, POST)
   - `/api/submissions/[id]` (GET, PATCH, DELETE)
   - `/api/submissions/[id]/review` (POST)
   - `/api/submissions/[id]/approve` (POST)
   - `/api/submissions/[id]/reject` (POST)
   - Add appropriate `withSecureTenantPermission` middleware for each endpoint

2. **Standardize Admin Security Endpoints**
   - Replace `withAdminAuth` with `withSecureTenantPermission` middleware
   - Define appropriate resource types and permissions

### Implementation Approach

For each endpoint requiring ACL protection:

1. **Analyze the Endpoint**
   - Determine the appropriate resource type and permission
   - Check if tenant/site context is needed
   - Identify any special handling requirements

2. **Implement ACL Protection**
   - Add `withSecureTenantPermission` middleware to the route handler
   - Ensure proper tenant/site context is passed
   - Handle resource IDs appropriately for specific resources

3. **Test the Implementation**
   - Verify access is granted with proper permissions
   - Verify access is denied without proper permissions
   - Test cross-tenant and cross-site scenarios

### Example Implementation

```typescript
// Before: Unprotected endpoint
export async function GET(req: NextRequest) {
  // Endpoint logic
}

// After: Protected with ACL
export async function GET(req: NextRequest) {
  return withSecureTenantPermission(
    req,
    'tenant' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      // Endpoint logic with validatedReq and context
    }
  );
}
```

### Frontend Implementation

Based on the codebase analysis, several permission-based UI components and hooks already exist. We need to ensure they're consistently used across the application:

#### Existing Permission Components

1. **ACLGuard**
   - Renders children only if user has required permission
   - Supports resource-specific permissions
   - Provides customizable fallback for access denied

2. **PermissionGuard**
   - More advanced guard with loading states
   - Supports checking multiple permissions
   - Can require all or any permissions to pass
   - Supports silent mode (no fallback)

3. **RoleGuard**
   - Role-based access control
   - Checks if user has a specific role
   - Provides customizable fallback

4. **TenantGuard**
   - Restricts access based on tenant membership
   - Can combine with permission checks
   - Ensures proper tenant context

#### Existing Permission Hooks

1. **useAuth**
   - Provides authentication state
   - Includes hasPermission method
   - Handles login/logout

2. **usePermission**
   - Checks permissions for specific resources
   - Supports multiple permission checks
   - Provides loading states and error handling
   - Includes methods for checking specific resources

3. **useTenantPermission**
   - Tenant-specific permission checking
   - Verifies tenant membership
   - Provides methods for various permission checks

#### Implementation Plan

1. **Audit Component Usage**
   - Identify components not using permission guards
   - Check for hardcoded permission checks
   - Ensure consistent guard usage

2. **Standardize Permission Checks**
   - Use the appropriate guard for each component
   - Ensure proper resource types and permissions
   - Add missing permission checks

3. **Navigation Protection**
   - Ensure all admin routes have appropriate guards
   - Use WithAuth for authentication protection
   - Add TenantGuard for tenant-specific pages

### Example Frontend Implementation

```tsx
// Permission Hook
function usePermission(resourceType, permission, resourceId) {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Check permission via API
    checkPermission(resourceType, permission, resourceId)
      .then(result => setHasPermission(result))
      .catch(() => setHasPermission(false));
  }, [resourceType, permission, resourceId]);

  return hasPermission;
}

// Component with Permission Check
function AdminAction({ resourceId }) {
  const canEdit = usePermission('listing', 'update', resourceId);

  if (!canEdit) {
    return null; // Or disabled button, or message
  }

  return <button onClick={handleEdit}>Edit Listing</button>;
}
```

### Testing Strategy

To ensure the ACL implementation is robust, the following testing approach will be used:

1. **Unit Tests**
   - Test `withPermission` middleware with various scenarios
   - Test permission hooks and components
   - Test role and permission service functions

2. **Integration Tests**
   - Test protected API endpoints with various permission scenarios
   - Verify proper handling of tenant and site context
   - Test the submission and review workflow end-to-end

3. **Edge Case Tests**
   - Test cross-tenant access attempts
   - Test cross-site access within a tenant
   - Test permission inheritance and delegation
   - Test superuser access patterns

## Documentation Plan

Comprehensive documentation will be created to ensure developers understand the ACL system:

### Developer Guide

A comprehensive guide for developers will include:

1. **ACL Architecture Overview**
   - Explanation of the permission model
   - Resource types and operations
   - Role templates and inheritance
   - Tenant and site context handling

2. **Backend Integration Guide**
   - How to add new protected routes
   - Using the `withPermission` middleware
   - Handling resource IDs and context
   - Testing permission logic

3. **Frontend Integration Guide**
   - Using permission hooks
   - Implementing conditional rendering
   - Navigation guards and redirects
   - Handling permission denials gracefully

### Permission Reference

A detailed reference documentation will include:

1. **Complete Permission Matrix**
   - All resource types and operations
   - Permission naming conventions
   - Special cases and exceptions

2. **Role Templates**
   - Standard role definitions
   - Permission sets for each role
   - Role hierarchy and inheritance
   - How to create custom roles

3. **Cross-Context Behavior**
   - Cross-tenant permission rules
   - Cross-site permission rules
   - Superuser capabilities and limitations

### Security Documentation

Security-focused documentation will include:

1. **Authentication Integration**
   - How authentication and authorization work together
   - Token-based authentication flow
   - Session management and security

2. **Permission Verification**
   - How permissions are verified
   - Performance considerations
   - Caching strategies

3. **Audit and Monitoring**
   - Audit logging for security events
   - Monitoring permission violations
   - Responding to security incidents

## Deliverables

1. **Audit Report**:
   - Comprehensive inventory of endpoints and components
   - Analysis of current permission coverage
   - Identification of security gaps

2. **Permission Matrix**:
   - Complete documentation of resources and permissions
   - Role templates and permission assignments
   - Special cases and exceptions

3. **Implementation**:
   - Updated API routes with proper ACL protection
   - Enhanced frontend components with permission checks
   - Test cases for ACL edge scenarios

4. **Documentation**:
   - Developer guide for ACL system
   - Permission reference documentation
   - Security considerations and best practices

## Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| 1. Audit | Complete endpoint and component inventory | 1-2 weeks |
| 2. Documentation | Create permission matrix and role templates | 1 week |
| 3. Backend Implementation | Add missing ACL protections to routes | 2-3 weeks |
| 4. Frontend Implementation | Add permission checks to components | 2-3 weeks |
| 5. Testing | Develop and run comprehensive tests | 1-2 weeks |
| 6. Documentation | Create developer guides and references | 1 week |

## Success Criteria

1. All API endpoints have appropriate ACL protection
2. All UI components respect user permissions
3. Cross-tenant and cross-site access is properly controlled
4. Permission matrix is complete and accurate
5. Developer documentation is comprehensive and clear
6. All test cases pass successfully
