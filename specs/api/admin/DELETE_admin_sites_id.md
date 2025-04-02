# DELETE /api/admin/sites/{siteId} API Specification

## Overview

This endpoint allows administrators to delete or archive a site from their tenant. It provides options for handling site data and resources during the deletion process.

## Requirements

### Functional Requirements

1. Allow permanent deletion or archiving of a site
2. Support data export before deletion
3. Support configurable data retention policies
4. Clean up all site resources
5. Notify site users of deletion
6. Return confirmation of deletion

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for site deletion
4. Require additional confirmation for permanent deletion
5. Log deletion action for audit purposes
6. Implement rate limiting to prevent abuse

### Performance Requirements

1. Handle deletion process asynchronously for large sites
2. Implement proper error handling
3. Clean up resources efficiently
4. Prevent system performance impact during deletion

## API Specification

### Request

- Method: DELETE
- Path: /api/admin/sites/{siteId}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Query Parameters:
  - `permanent`: (boolean, optional, default: false) - Whether to permanently delete the site
  - `exportData`: (boolean, optional, default: false) - Whether to export site data before deletion
  - `retentionDays`: (number, optional, default: 30) - Days to retain data if not permanent deletion
- Body:
  ```json
  {
    "confirmationCode": "DELETE-site_1234567890",
    "reason": "Site consolidation - merging with our main site",
    "notifyUsers": true,
    "notificationMessage": "Our Fishing Gear Reviews site is being merged with our main site. Please visit our new combined site at newfishinggearreviews.com.",
    "additionalNotes": "Content from this site will be migrated to the main site over the next two weeks."
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Site deletion initiated successfully",
  "site": {
    "id": "site_1234567890",
    "name": "Fishing Gear Reviews",
    "status": "deleting",
    "deletionInitiatedAt": "2024-04-04T18:30:45Z",
    "deletionInitiatedBy": {
      "id": "user_1234567890",
      "name": "John Smith"
    },
    "permanent": false,
    "dataRetentionUntil": "2024-05-04T18:30:45Z"
  },
  "exportData": {
    "status": "processing",
    "estimatedCompletionTime": "2024-04-04T19:00:00Z",
    "downloadUrl": null
  },
  "deletionJob": {
    "id": "job_9876543210",
    "status": "processing",
    "estimatedCompletionTime": "2024-04-04T19:30:00Z",
    "progress": {
      "stage": "preparing",
      "percentComplete": 5
    }
  },
  "notificationsSent": 12
}
```

#### Immediate Success (200 OK - Small Site)

```json
{
  "success": true,
  "message": "Site deleted successfully",
  "site": {
    "id": "site_1234567890",
    "name": "Fishing Gear Reviews",
    "status": "deleted",
    "deletedAt": "2024-04-04T18:30:45Z",
    "deletedBy": {
      "id": "user_1234567890",
      "name": "John Smith"
    },
    "permanent": false,
    "dataRetentionUntil": "2024-05-04T18:30:45Z"
  },
  "exportData": {
    "status": "completed",
    "completedAt": "2024-04-04T18:31:15Z",
    "downloadUrl": "https://assets.directorymonster.com/tenants/fishing-gear/exports/site_1234567890_20240404.zip",
    "expiresAt": "2024-04-11T18:31:15Z"
  },
  "notificationsSent": 12
}
```

#### Site Not Found (404 Not Found)

```json
{
  "error": "Site not found"
}
```

#### Invalid Confirmation (400 Bad Request)

```json
{
  "error": "Invalid confirmation code",
  "expected": "DELETE-site_1234567890",
  "received": "DELETE-site_1234567891"
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
  "error": "Insufficient permissions to delete this site"
}
```

#### Invalid Tenant (403 Forbidden)

```json
{
  "error": "Invalid tenant context"
}
```

#### Deletion In Progress (409 Conflict)

```json
{
  "error": "Site deletion already in progress",
  "deletionJob": {
    "id": "job_9876543210",
    "status": "processing",
    "estimatedCompletionTime": "2024-04-04T19:30:00Z",
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
  "error": "Failed to initiate site deletion"
}
```

## Testing Scenarios

### Success Scenarios

1. **Archive small site**
   - Expected: 200 OK with immediate deletion confirmation
   - Test: Send deletion request with permanent=false for small site, verify immediate completion

2. **Permanently delete site**
   - Expected: 200 OK with deletion job details
   - Test: Send deletion request with permanent=true, verify deletion job initiated

3. **Delete with data export**
   - Expected: 200 OK with export job details
   - Test: Send deletion request with exportData=true, verify export initiated

4. **Delete with user notification**
   - Expected: 200 OK and notifications sent
   - Test: Send deletion with notifyUsers=true, verify notifications sent

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

2. **Non-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with non-admin JWT, verify 403 response

3. **Admin from different tenant**
   - Expected: 404 Not Found or 403 Forbidden
   - Test: Send request with admin JWT but for different tenant, verify proper tenant isolation

### Edge Case Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Attempt to delete non-existent site ID, verify 404 response

2. **Deletion already in progress**
   - Expected: 409 Conflict
   - Test: Attempt to delete site with deletion already in progress, verify conflict response

3. **Very large site**
   - Expected: 200 OK with long-running job
   - Test: Delete large site with many resources, verify asynchronous processing

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use background jobs for handling deletion of large sites
- Implement data export functionality for backup purposes
- Add appropriate logging for security and audit purposes
- Consider implementing a site recovery process for accidental deletions
- Ensure complete cleanup of all site resources:
  - Redis keys
  - Database records
  - Storage files
  - Search indexes
  - Categories and listings
  - User access permissions
- Implement proper notification to site users
- Consider legal and compliance requirements for data retention
- Implement progress tracking for long-running deletion jobs
- Ensure proper error handling and recovery for failed deletions

## Deletion Process

The site deletion process involves several stages:

1. **Validation**: Verify deletion request and confirmation
2. **Preparation**: Prepare for deletion and initiate data export if requested
3. **Notification**: Notify site users of impending deletion
4. **Resource Cleanup**:
   - Remove site data from database
   - Delete site files from storage
   - Clean up Redis keys
   - Remove search indexes
   - Update user access permissions
5. **Finalization**: Complete deletion and generate audit records

For non-permanent deletions (archiving), the site data is marked as deleted but retained for the specified retention period before permanent removal.

## Relationship to Tenant Management

This endpoint works in conjunction with tenant management:

1. Each tenant can have multiple sites
2. Site deletion affects tenant resource usage and statistics
3. Site deletion is isolated within the tenant context
4. Tenant administrators control site lifecycle

The site deletion endpoint enables administrators to manage their directory portfolio by removing outdated or unnecessary sites while maintaining proper data handling practices.