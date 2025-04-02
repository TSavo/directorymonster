# DELETE /api/admin/tenants/{tenantId} API Specification

## Overview

This endpoint allows super-administrators to delete or archive a tenant from the system. It provides options for handling tenant data and resources during the deletion process.

## Requirements

### Functional Requirements

1. Allow permanent deletion or archiving of a tenant
2. Support data export before deletion
3. Support configurable data retention policies
4. Clean up all tenant resources
5. Notify tenant owner of deletion
6. Return confirmation of deletion

### Security Requirements

1. Require authentication with super-admin privileges
2. Require additional confirmation for permanent deletion
3. Log deletion action for audit purposes
4. Implement rate limiting to prevent abuse
5. Ensure complete removal of tenant data for privacy compliance

### Performance Requirements

1. Handle deletion process asynchronously for large tenants
2. Implement proper error handling
3. Clean up resources efficiently
4. Prevent system performance impact during deletion

## API Specification

### Request

- Method: DELETE
- Path: /api/admin/tenants/{tenantId}
- Headers:
  - Authorization: Bearer {JWT token}
  - Content-Type: application/json
- Query Parameters:
  - `permanent`: (boolean, optional, default: false) - Whether to permanently delete the tenant
  - `exportData`: (boolean, optional, default: false) - Whether to export tenant data before deletion
  - `retentionDays`: (number, optional, default: 30) - Days to retain data if not permanent deletion
- Body:
  ```json
  {
    "confirmationCode": "DELETE-tenant_1234567890",
    "reason": "Customer requested account closure",
    "notifyOwner": true,
    "notificationMessage": "Your account has been closed as requested. Thank you for using our service.",
    "additionalNotes": "Customer may return in 6 months after restructuring. Offered 20% discount for return."
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Tenant deletion initiated successfully",
  "tenant": {
    "id": "tenant_1234567890",
    "name": "Fishing Gear Directory",
    "status": "deleting",
    "deletionInitiatedAt": "2024-04-04T16:30:45Z",
    "deletionInitiatedBy": {
      "id": "user_admin123",
      "name": "Super Admin"
    },
    "permanent": false,
    "dataRetentionUntil": "2024-05-04T16:30:45Z"
  },
  "exportData": {
    "status": "processing",
    "estimatedCompletionTime": "2024-04-04T17:00:00Z",
    "downloadUrl": null
  },
  "deletionJob": {
    "id": "job_9876543210",
    "status": "processing",
    "estimatedCompletionTime": "2024-04-04T17:30:00Z",
    "progress": {
      "stage": "preparing",
      "percentComplete": 5
    }
  },
  "notificationSent": true
}
```

#### Immediate Success (200 OK - Small Tenant)

```json
{
  "success": true,
  "message": "Tenant deleted successfully",
  "tenant": {
    "id": "tenant_1234567890",
    "name": "Fishing Gear Directory",
    "status": "deleted",
    "deletedAt": "2024-04-04T16:30:45Z",
    "deletedBy": {
      "id": "user_admin123",
      "name": "Super Admin"
    },
    "permanent": false,
    "dataRetentionUntil": "2024-05-04T16:30:45Z"
  },
  "exportData": {
    "status": "completed",
    "completedAt": "2024-04-04T16:31:15Z",
    "downloadUrl": "https://admin.directorymonster.com/exports/tenant_1234567890_20240404.zip",
    "expiresAt": "2024-04-11T16:31:15Z"
  },
  "notificationSent": true
}
```

#### Tenant Not Found (404 Not Found)

```json
{
  "error": "Tenant not found"
}
```

#### Invalid Confirmation (400 Bad Request)

```json
{
  "error": "Invalid confirmation code",
  "expected": "DELETE-tenant_1234567890",
  "received": "DELETE-tenant_1234567891"
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
  "error": "Insufficient permissions to delete tenants"
}
```

#### Deletion In Progress (409 Conflict)

```json
{
  "error": "Tenant deletion already in progress",
  "deletionJob": {
    "id": "job_9876543210",
    "status": "processing",
    "estimatedCompletionTime": "2024-04-04T17:30:00Z",
    "progress": {
      "stage": "removing_data",
      "percentComplete": 45
    }
  }
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to initiate tenant deletion"
}
```

## Testing Scenarios

### Success Scenarios

1. **Archive small tenant**
   - Expected: 200 OK with immediate deletion confirmation
   - Test: Send deletion request with permanent=false for small tenant, verify immediate completion

2. **Permanently delete tenant**
   - Expected: 200 OK with deletion job details
   - Test: Send deletion request with permanent=true, verify deletion job initiated

3. **Delete with data export**
   - Expected: 200 OK with export job details
   - Test: Send deletion request with exportData=true, verify export initiated

4. **Delete with owner notification**
   - Expected: 200 OK and notification sent
   - Test: Send deletion with notifyOwner=true, verify notification sent

### Validation Failure Scenarios

1. **Missing confirmation code**
   - Expected: 400 Bad Request
   - Test: Send deletion request without confirmation code, verify validation error

2. **Incorrect confirmation code**
   - Expected: 400 Bad Request
   - Test: Send deletion with incorrect confirmation code, verify validation error

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Non-super-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with regular admin JWT, verify 403 response

### Edge Case Scenarios

1. **Tenant not found**
   - Expected: 404 Not Found
   - Test: Attempt to delete non-existent tenant ID, verify 404 response

2. **Deletion already in progress**
   - Expected: 409 Conflict
   - Test: Attempt to delete tenant with deletion already in progress, verify conflict response

3. **Very large tenant**
   - Expected: 200 OK with long-running job
   - Test: Delete large tenant with many resources, verify asynchronous processing

## Implementation Notes

- Implement proper permission checks for super-admin access
- Use background jobs for handling deletion of large tenants
- Implement data export functionality for compliance purposes
- Add appropriate logging for security and audit purposes
- Consider implementing a tenant recovery process for accidental deletions
- Ensure complete cleanup of all tenant resources:
  - Redis keys
  - Database records
  - Storage files
  - User accounts
  - Subscription data
- Implement proper notification to tenant owner and users
- Consider legal and compliance requirements for data retention
- Implement progress tracking for long-running deletion jobs
- Ensure proper error handling and recovery for failed deletions

## Deletion Process

The tenant deletion process involves several stages:

1. **Validation**: Verify deletion request and confirmation
2. **Preparation**: Prepare for deletion and initiate data export if requested
3. **Notification**: Notify tenant owner and users of impending deletion
4. **Resource Cleanup**:
   - Revoke user access
   - Remove tenant data from database
   - Delete tenant files from storage
   - Clean up Redis keys
   - Cancel subscriptions and billing
5. **Finalization**: Complete deletion and generate audit records

For non-permanent deletions (archiving), the tenant data is marked as deleted but retained for the specified retention period before permanent removal.