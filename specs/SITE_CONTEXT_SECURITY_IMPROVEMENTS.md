# Site Context Security Improvements Specification

## Overview

This specification outlines necessary security improvements to ensure consistent enforcement of site-level permissions across the DirectoryMonster application. The current implementation has inconsistencies in how site context is considered during permission checks, creating potential security vulnerabilities.

## Current Issues

1. **Inconsistent Permission Checking Methods**:
   - `RoleService.hasPermission()` - Used widely but doesn't consider site context
   - `RoleService.hasSitePermission()` - Only used in the `withSitePermission` middleware

2. **Security Vulnerabilities**:
   - Most permission checks only validate tenant context
   - Site-specific permissions are only enforced in specific routes
   - A user with permission in one site could potentially access resources in another site within the same tenant

3. **Incomplete ACL Structure**:
   - Site context is not consistently included in ACL entries
   - Cross-site access detection is missing

## Requirements

### 1. Unified Permission Checking

Update the `hasPermission` method to always include site context:

```typescript
static async hasPermission(
  userId: string,
  tenantId: string,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string,
  siteId?: string  // Add site context parameter
): Promise<boolean> {
  // Get all roles the user has in this tenant
  const roles = await this.getUserRoles(userId, tenantId);

  if (roles.length === 0) {
    return false;
  }

  // Check each role for the required permission
  for (const role of roles) {
    // Check for tenant-wide permission first (no site specified)
    const hasTenantWidePermission = this.roleHasPermission(
      role,
      resourceType,
      permission,
      resourceId
    );

    if (hasTenantWidePermission) {
      return true;
    }

    // If site is specified, check for site-specific permission
    if (siteId) {
      const hasSitePermission = role.aclEntries.some(entry =>
        entry.resource.type === resourceType &&
        entry.permission === permission &&
        (resourceId ? entry.resource.id === resourceId : true) &&
        entry.resource.siteId === siteId
      );

      if (hasSitePermission) {
        return true;
      }
    }
  }

  return false;
}
```

### 2. Remove Redundant Methods

Completely remove the separate `hasSitePermission` method. Instead of maintaining two methods with different signatures, we should have a single, comprehensive permission checking method that properly handles site context.

During the transition period, update all calls to `hasSitePermission` to use the enhanced `hasPermission` method instead:

```typescript
// Before:
const hasSiteAccess = await RoleService.hasSitePermission(userId, tenantId, siteId, permission);

// After:
const hasSiteAccess = await RoleService.hasPermission(userId, tenantId, 'site', permission, siteId, siteId);
```

This approach ensures we have a single source of truth for permission checking and eliminates the risk of inconsistent implementations.

### 3. Update Middleware

Update all permission-checking middleware to include site context:

```typescript
export async function withPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  handler: (req: NextRequest) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  // Extract tenant and site context
  const tenantId = req.headers.get('x-tenant-id');
  const siteId = req.headers.get('x-site-id');

  // ... existing validation ...

  // Check permission with both tenant and site context
  const hasPermission = await RoleService.hasPermission(
    userId,
    tenantId,
    resourceType,
    permission,
    resourceId,
    siteId  // Include site context
  );

  // ... rest of the function ...
}
```

### 4. Enhance ACL Structure

Update the ACL entry structure to always include site context:

```typescript
export interface ACE {
  resource: {
    type: ResourceType;
    tenantId: string;
    id?: string;
    siteId?: string;  // Make this explicit in all ACEs
  };
  permission: Permission;
}
```

### 5. Update ACL Creation Functions

Update all functions that create ACLs to include site context:

```typescript
export function createTenantAdminACL(userId: string, tenantId: string): ACL {
  const acl: ACL = { userId, entries: [] };

  // ... existing code ...

  // Add explicit tenant-wide permissions (no site restriction)
  resourceTypes.forEach(type => {
    permissions.forEach(permission => {
      acl.entries.push({
        resource: {
          type,
          tenantId,
          siteId: undefined  // Explicitly undefined for tenant-wide
        },
        permission
      });
    });
  });

  return acl;
}
```

### 6. Implement Cross-Site Detection

Add cross-site access detection:

```typescript
export function detectCrossTenantOrSiteAccess(
  acl: ACL,
  tenantId: string,
  siteId?: string
): boolean {
  // Get all unique tenant IDs referenced in the ACL
  const referencedTenantIds = new Set<string>();
  const referencedSiteIds = new Set<string>();

  acl.entries.forEach(entry => {
    referencedTenantIds.add(entry.resource.tenantId);
    if (entry.resource.siteId) {
      referencedSiteIds.add(entry.resource.siteId);
    }
  });

  // Filter out the specified tenant and the system tenant
  referencedTenantIds.delete(tenantId);
  referencedTenantIds.delete('system');

  // If site is specified, check for cross-site access
  if (siteId) {
    referencedSiteIds.delete(siteId);
    // If there are site IDs other than the current one, this is cross-site access
    if (referencedSiteIds.size > 0) {
      return true;
    }
  }

  // If there are tenant IDs other than the current one and system, this is cross-tenant access
  return referencedTenantIds.size > 0;
}
```

### 7. Update Security Middleware

Enhance the `secureTenantContext` middleware to check for cross-site access:

```typescript
// Check for site ID mismatch in URL
const siteIdParam = url.searchParams.get('siteId');

if (siteIdParam && siteIdParam !== context.siteId) {
  // Log cross-site access attempt
  await AuditService.logSecurityEvent(
    context.userId,
    context.tenantId,
    AuditAction.CROSS_SITE_ACCESS_ATTEMPT,
    {
      requestId: context.requestId,
      method: req.method,
      url: req.url,
      targetSiteId: siteIdParam,
      currentSiteId: context.siteId
    }
  );

  return NextResponse.json(
    {
      error: 'Cross-site access denied',
      message: 'Cannot access resources from another site',
      requestId: context.requestId
    },
    { status: 403 }
  );
}
```

## Implementation Phases

1. **Phase 0: Test-Driven Development**
   - Start by writing failing unit tests that verify site context is properly considered in permission checks
   - Create tests for cross-site access detection and prevention
   - Establish test cases for all edge cases (tenant-wide permissions, site-specific permissions, etc.)

2. **Phase 1: Core Permission Logic**
   - Update `RoleService.hasPermission` to include site context
   - Remove `RoleService.hasSitePermission` completely
   - Update ACL interfaces to explicitly include site context

3. **Phase 2: Middleware Updates**
   - Update all permission middleware to pass site context
   - Enhance security middleware to detect cross-site access

4. **Phase 3: ACL Creation and Validation**
   - Update ACL creation functions to include site context
   - Implement cross-site detection in ACL validation

5. **Phase 4: Testing and Validation**
   - Ensure all previously written tests now pass
   - Add additional tests for any edge cases discovered during implementation
   - Validate that cross-site access is properly detected and blocked

## Security Considerations

1. **Backward Compatibility**: Ensure that existing code continues to work while gradually migrating to the new approach
2. **Default Behavior**: When site context is not provided, default to more restrictive behavior
3. **Audit Logging**: Log all cross-site access attempts for security monitoring
4. **Documentation**: Update security documentation to emphasize the importance of site context

## Acceptance Criteria

1. All permission checks consistently consider both tenant and site context
2. Users can only access resources in sites they have explicit permission for
3. Cross-site access attempts are detected, blocked, and logged
4. The permission model is consistent across the entire application
5. All tests pass, including new tests for site-level permissions
6. Security documentation is updated to reflect the changes
7. Only a single permission checking method exists (`hasPermission`) that properly handles site context
8. No redundant or deprecated methods remain in the codebase

## Related Issues

- Issue #316: 🔒 Security: Implement consistent site context in permission checks
