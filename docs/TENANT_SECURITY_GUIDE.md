# DirectoryMonster Tenant Security Guide

## Overview

This document outlines the security measures implemented in DirectoryMonster to prevent cross-tenant attacks and ensure proper tenant isolation. It serves as a guide for developers working on the platform to maintain and enhance security across all layers of the application.

## Tenant Isolation Architecture

DirectoryMonster implements a defense-in-depth approach to tenant isolation with multiple security layers:

### 1. Tenant Context Validation

All requests in the system go through tenant context validation which:

- Verifies the tenant ID is valid
- Confirms the user has permission to access the tenant
- Validates that resources belong to the correct tenant
- Prevents cross-tenant access attempts

### 2. Data Namespacing

All data in the system is namespaced by tenant:

- Redis keys are prefixed with tenant IDs
- Database queries include tenant filtering
- Service methods require explicit tenant context
- Response data is filtered based on tenant context

### 3. Tenant ID Protection

Tenant IDs are protected throughout the system:

- All tenant IDs use UUIDs instead of sequential identifiers
- Tenant IDs are never exposed in client-side code or URLs
- Hostname-to-tenant mapping is performed securely server-side
- Tenant context is stored securely in authenticated sessions

### 4. Authorization Layering

Multiple authorization layers provide defense-in-depth:

- Middleware validates tenant context on all requests
- Service methods verify tenant access before operations
- Data access layer enforces tenant isolation
- Response filtering prevents information leakage

## Security Components Reference

### Key Security Middleware

The following middleware components enforce tenant security:

1. **`withSecureTenantContext`**: Validates tenant context on all requests
   - Verifies tenant ID is valid
   - Checks for cross-tenant access attempts in URL or path
   - Ensures tenant context is attached to the request

2. **`withSecureTenantPermission`**: Combines tenant context with permission checks
   - Verifies user has appropriate permissions within tenant
   - Detects cross-tenant references in request bodies
   - Blocks attempts to access other tenant's resources

3. **`TenantContext`**: Encapsulates tenant security information
   - Stores tenant ID and user ID securely
   - Provides request tracing with unique request IDs
   - Validates tenant context from request headers

### Security Services

These services help maintain tenant isolation:

1. **TenantMembershipService**: Verifies user membership in tenants
   - Validates user-tenant relationships
   - Prevents unauthorized tenant access
   - Manages tenant membership lifecycle

2. **KeyNamespaceService**: Ensures data isolation through namespacing
   - Prefixes all keys with tenant identifiers
   - Validates keys belong to the correct tenant
   - Prevents cross-tenant data access

3. **AuditService**: Logs security events for monitoring
   - Records cross-tenant access attempts
   - Tracks permission denied events
   - Provides audit trail for security incidents

## Best Practices for Tenant-Aware Development

### 1. Always Use Tenant Context

✅ **Do:**
- Always include tenant context in all service methods
- Pass tenant context explicitly in all data operations
- Verify tenant context before performing any action

❌ **Don't:**
- Assume tenant context from other parameters
- Bypass tenant validation for any operations
- Hard-code tenant IDs in any implementation

### 2. Handle Cross-Tenant Detection

✅ **Do:**
- Use `detectCrossTenantAccess` to check request content
- Validate tenant IDs match context in all operations
- Log security events when cross-tenant attempts are detected

❌ **Don't:**
- Expose tenant IDs in responses or URLs
- Allow cross-tenant references in any content
- Skip validation for "trusted" operations

### 3. Use Middleware Protection

✅ **Do:**
- Apply `withSecureTenantContext` to all API routes
- Use `withSecureTenantPermission` for permission checks
- Create tenant context early in the request lifecycle

❌ **Don't:**
- Create custom tenant handling that bypasses middleware
- Disable tenant validation for performance reasons
- Assume tenant context exists in downstream operations

### 4. Properly Namespace Data

✅ **Do:**
- Use namespaced keys for all data storage
- Add tenant filtering to all database queries
- Validate data belongs to tenant before operations

❌ **Don't:**
- Use shared keys across tenants
- Skip tenant validation for cached data
- Allow unfiltered cross-tenant queries

## Common Security Patterns

### Validating Tenant Context in API Routes

```typescript
// Example API route with secure tenant context
export default withSecureTenantPermission(
  async (req, context) => {
    const { id } = req.query;
    
    // Context already contains validated tenantId
    const resource = await resourceService.getResource(id, context.tenantId);
    
    return NextResponse.json(resource);
  },
  ResourceType.DOCUMENT,
  Permission.READ
);
```

### Checking Cross-Tenant References in Content

```typescript
// Detecting cross-tenant references in content
function processTenantContent(content, tenantId) {
  // Check if content contains references to other tenants
  if (detectCrossTenantAccess(content, tenantId)) {
    throw new CrossTenantError('Content contains cross-tenant references');
  }
  
  // Process content safely
  return processContent(content);
}
```

### Using Namespaced Data Access

```typescript
// Using tenant-namespaced Redis keys
async function getCachedData(key, tenantId) {
  // Get namespaced key
  const namespacedKey = `tenant:${tenantId}:${key}`;
  
  // Get data with namespace
  return redis.get(namespacedKey);
}
```

## Security Incident Response

If you suspect a tenant isolation breach:

1. Immediately report to the security team
2. Preserve logs and evidence of the suspected breach
3. Do not attempt to fix or modify the affected systems
4. Document all observations and findings
5. Wait for security team guidance before proceeding

## Testing Tenant Security

All tenant security features must be thoroughly tested:

1. **Unit Tests**: Verify individual security components
2. **Integration Tests**: Test security across component boundaries
3. **Security Tests**: Attempt to breach tenant isolation

Key test scenarios:

- Attempt to access resources from another tenant
- Try to manipulate tenant context in requests
- Test for tenant ID spoofing vulnerabilities
- Verify tenant validation blocks unauthorized access

## Additional Resources

- [MULTI_TENANT_ACL_SPEC.md](../specs/MULTI_TENANT_ACL_SPEC.md) - Detailed ACL specifications
- [CROSS_TENANT_SECURITY_SPEC.md](../specs/CROSS_TENANT_SECURITY_SPEC.md) - Security implementation spec
- [Security Architecture](./SECURITY_ARCHITECTURE.md) - Overall security design