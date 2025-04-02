# GET /api/admin/audit API Specification

## Overview

This endpoint retrieves a paginated and filterable list of audit events from the system. It enables administrators to review system activities, troubleshoot issues, and maintain compliance with security policies by tracking user actions and system events.

## Requirements

### Functional Requirements

1. Return a paginated list of audit events based on filter criteria
2. Support filtering by event type, user, resource, date range, and success status
3. Support sorting by timestamp (ascending/descending)
4. Include detailed information about each event
5. Support exporting of filtered results in various formats

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'audit:read' permission
3. Enforce tenant isolation (administrators can only see events within their tenant scope)
4. Super admins can see events across all tenants
5. Redact sensitive information based on user permissions
6. Log access to audit logs themselves

### Performance Requirements

1. Response time should be < 1000ms for typical requests
2. Efficiently handle large audit datasets with proper pagination
3. Optimize query performance for common filtering patterns
4. Support progressive loading for large result sets

## API Specification

### Request

- Method: GET
- Path: /api/admin/audit
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `limit`: (number, optional, default: 50) - Results per page
  - `startDate`: (string, optional) - ISO date string for filtering by start date
  - `endDate`: (string, optional) - ISO date string for filtering by end date
  - `userId`: (string, optional) - Filter by specific user ID
  - `action`: (string, optional) - Filter by action type (create, update, delete, login, etc.)
  - `resource`: (string, optional) - Filter by resource type (user, role, site, listing, etc.)
  - `resourceId`: (string, optional) - Filter by specific resource ID
  - `success`: (boolean, optional) - Filter by operation success/failure
  - `siteId`: (string, optional) - Filter by specific site ID
  - `sort`: (string, optional, default: 'timestamp') - Field to sort by
  - `order`: (string, optional, default: 'desc') - Sort order ('asc' or 'desc')
  - `q`: (string, optional) - Search query across event details

### Response

#### Success (200 OK)

```json
{
  "events": [
    {
      "id": "audit_1234567890",
      "timestamp": "2025-04-02T09:45:12Z",
      "tenantId": "tenant_1234",
      "userId": "user_5678",
      "username": "admin_user",
      "action": "create",
      "resource": {
        "type": "listing",
        "id": "listing_9012",
        "name": "Premium Fishing Rod"
      },
      "siteId": "site_3456",
      "siteName": "Fishing Gear Reviews",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "details": {
        "changes": {
          "status": ["draft", "published"],
          "title": [null, "Premium Fishing Rod"]
        }
      },
      "success": true,
      "duration": 124
    },
    {
      "id": "audit_0987654321",
      "timestamp": "2025-04-02T09:30:05Z",
      "tenantId": "tenant_1234",
      "userId": "user_5678",
      "username": "admin_user",
      "action": "login",
      "resource": {
        "type": "session",
        "id": "session_7890"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "details": {
        "method": "password",
        "mfaUsed": true
      },
      "success": true,
      "duration": 352
    }
  ],
  "pagination": {
    "total": 2486,
    "page": 1,
    "limit": 50,
    "pages": 50
  }
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Invalid parameters",
  "details": "End date must be after start date"
}
```

#### Unauthorized (401 Unauthorized)

```json
{
  "error": "Authentication required"
}
```

#### Forbidden (403 Forbidden)

```json
{
  "error": "Insufficient permissions to access audit logs"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve audit logs"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve default audit logs (most recent)**
   - Expected: 200 OK with first page of logs
   - Test: Send request with valid JWT for admin
   - Validation: Verify response contains events array and pagination data

2. **Filter by date range**
   - Expected: 200 OK with filtered logs
   - Test: Send request with startDate and endDate
   - Validation: Verify all events fall within specified date range

3. **Filter by action type**
   - Expected: 200 OK with filtered logs
   - Test: Send request with action=login
   - Validation: Verify all events have action type "login"

4. **Filter by resource type**
   - Expected: 200 OK with filtered logs
   - Test: Send request with resource=listing
   - Validation: Verify all events have resource type "listing"

5. **Filter by user**
   - Expected: 200 OK with filtered logs
   - Test: Send request with userId parameter
   - Validation: Verify all events are associated with specified user

6. **Filter by site**
   - Expected: 200 OK with filtered logs
   - Test: Send request with siteId parameter
   - Validation: Verify all events are associated with specified site

7. **Search functionality**
   - Expected: 200 OK with search results
   - Test: Send request with q=failed
   - Validation: Verify results contain "failed" in relevant fields

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 200 OK with tenant-specific logs
   - Test: Send request as site admin
   - Validation: Verify events are only from admin's tenant

3. **Super admin cross-tenant view**
   - Expected: 200 OK with events from all tenants
   - Test: Send request as super admin
   - Validation: Verify events from multiple tenants are included

4. **Super admin tenant filtering**
   - Expected: 200 OK with events from specific tenant
   - Test: Send request as super admin with tenantId filter
   - Validation: Verify events are only from specified tenant

### Edge Case Scenarios

1. **Invalid date range**
   - Expected: 400 Bad Request
   - Test: Send request with endDate before startDate
   - Validation: Verify appropriate error message

2. **No events match filters**
   - Expected: 200 OK with empty events array
   - Test: Send request with filters that match no events
   - Validation: Verify response has empty events array and pagination showing total=0

3. **Request for non-existent user's events**
   - Expected: 200 OK with empty events array
   - Test: Request events for non-existent userId
   - Validation: Verify empty events array

## Implementation Notes

- Use a time-series database or specialized logging system for efficient audit logs storage
- Implement proper indexing for common query patterns
- Consider partitioning audit data by date for better performance
- Implement retention policies to manage growth of audit logs
- Use Redis for caching frequent audit queries
- Implement proper tenant isolation through data partitioning
- Add appropriate compression for audit log storage
- Consider using async processing for recording audit events
- Implement progressive loading for large result sets
- Ensure sensitive data is properly redacted in audit logs
- Log access to audit logs themselves for meta-auditing