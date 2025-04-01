# ACL Audit Trail System

This document provides an overview of the Audit Trail System implemented as part of Issue #55. The system provides comprehensive logging and tracking of security-relevant events within the multi-tenant ACL framework.

## Core Concepts

The audit trail system is designed to track all security-relevant operations while maintaining strict tenant isolation. Key features include:

- **Comprehensive Event Tracking**: Logs all important security events from permission checks to role changes
- **Tenant Isolation**: Preserves tenant boundaries even for audit data
- **Performance Optimized**: Uses Redis sorted sets for efficient time-series data storage and retrieval
- **Retention Management**: Built-in capabilities for pruning old audit events
- **Flexible Querying**: Rich filtering options by date, event type, severity, and more

## AuditEvent Interface

The core of the system is the `AuditEvent` interface:

```typescript
interface AuditEvent {
  id: string;               // Unique identifier
  timestamp: string;        // ISO timestamp
  userId: string;           // User who performed the action
  tenantId: string;         // Tenant context
  action: AuditAction;      // Type of action (enum)
  severity: AuditSeverity;  // Severity level
  resourceType?: string;    // Type of resource (optional)
  resourceId?: string;      // Specific resource ID (optional)
  ipAddress?: string;       // IP address (optional)
  userAgent?: string;       // User agent (optional)
  details: Record<string, any>; // Additional context
  success: boolean;         // Whether the action succeeded
}
```

## Audit Actions

The system tracks various types of actions through the `AuditAction` enum:

```typescript
enum AuditAction {
  // Permission-related actions
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  
  // Role management
  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted',
  
  // Role assignment
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REMOVED = 'role_removed',
  
  // Tenant membership
  USER_ADDED_TO_TENANT = 'user_added_to_tenant',
  USER_REMOVED_FROM_TENANT = 'user_removed_from_tenant',
  
  // And many more...
}
```

## Usage Patterns

### 1. Automatic Permission Audit Logging

The simplest way to implement audit logging is to use the `withAuditedPermission` middleware:

```typescript
export async function secureRoute(req: NextRequest): Promise<NextResponse> {
  return withAuditedPermission(
    req,
    'user',
    'update',
    async (validatedReq) => {
      // Business logic here
      return NextResponse.json({ success: true });
    },
    'user-123'  // Optional resource ID
  );
}
```

This automatically logs both successful and failed permission checks.

### 2. Manual Audit Logging

For non-permission events or custom logic, use `AuditService` directly:

```typescript
// Log a role creation event
await AuditService.logRoleEvent(
  adminUserId,
  tenantId,
  AuditAction.ROLE_CREATED,
  newRoleId,
  { roleName: "Editor", permissionCount: 5 }
);

// Log a generic event
await AuditService.logEvent({
  userId,
  tenantId,
  action: AuditAction.USER_LOGIN,
  details: { ipAddress, userAgent },
  success: true
});
```

### 3. Helper Methods

The `AuditService` provides specialized helper methods for common operations:

```typescript
// Log permission events
AuditService.logPermissionEvent(userId, tenantId, 'user', 'read', true);

// Log authentication events
AuditService.logAuthEvent(userId, tenantId, true, { ipAddress, method: 'password' });

// Log role management
AuditService.logRoleEvent(adminId, tenantId, AuditAction.ROLE_UPDATED, roleId);

// Log tenant membership changes
AuditService.logTenantMembershipEvent(adminId, tenantId, userId, AuditAction.USER_ADDED_TO_TENANT);

// Log cross-tenant access attempts
AuditService.logCrossTenantAccessAttempt(userId, sourceTenantId, targetTenantId);
```

## Querying Audit Logs

The system provides methods for retrieving and filtering audit events:

```typescript
// Get recent events (simple)
const recentEvents = await AuditService.getRecentEvents(tenantId, 20);

// Advanced querying with filters
const events = await AuditService.queryEvents(
  {
    tenantId, 
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-01-31T23:59:59Z',
    action: AuditAction.ACCESS_DENIED,
    resourceType: 'user',
    limit: 50,
    offset: 0
  },
  userTenantContext,
  isGlobalAdmin
);
```

## API Endpoints

The following endpoints are available for accessing audit data:

- `GET /api/audit` - Query audit events with filtering options
- `GET /api/audit/recent` - Get recent audit events (for dashboard)
- `GET /api/audit/stats` - Get statistics about audit events
- `POST /api/audit` - Manually create audit events (admin only)

All audit API endpoints enforce tenant isolation and proper permissions.

## Tenant Isolation

The audit system enforces strict tenant isolation:

1. Users can only access audit events from their own tenant
2. Global admins can view cross-tenant events
3. Audit events are indexed by tenant
4. API endpoints validate tenant context
5. Redis keys include tenant prefixes

## Performance Considerations

The audit system is optimized for performance:

- Uses Redis sorted sets for time-series data
- Creates multiple indexes for efficient filtering
- Supports pagination for large result sets
- Implements pruning of old events for data management

## Best Practices

1. **Be Consistent**: Use the same approach for similar events
2. **Include Context**: Add detailed information in the `details` field 
3. **Right Severity**: Choose appropriate severity levels
4. **Resource Tracking**: Include resource types and IDs when applicable
5. **Error Handling**: Don't let audit failures affect core operations

## Complete Example

See `src/app/api/middleware/examples/auditSystemExample.ts` for complete usage examples.
