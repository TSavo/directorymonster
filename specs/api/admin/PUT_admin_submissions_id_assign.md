# PUT /api/admin/submissions/{submissionId}/assign API Specification

## Overview

This endpoint allows administrators to assign a submission to a specific administrator for review. It facilitates team-based review workflows and ensures clear responsibility for submission processing.

## Requirements

### Functional Requirements

1. Allow administrators to assign a submission to a specific administrator
2. Support optional assignment notes
3. Support changing submission status to "in_review"
4. Update submission review history
5. Notify the assigned administrator (if configured)
6. Support setting a review deadline

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for submission assignment
4. Log assignment action for audit purposes
5. Prevent cross-tenant access to submissions
6. Ensure assignee has appropriate permissions

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper error handling
3. Handle the transaction atomically

## API Specification

### Request

- Method: PUT
- Path: /api/admin/submissions/{submissionId}/assign
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
  ```json
  {
    "assigneeId": "user_admin456",
    "notes": "Please review this fishing rod submission. Verify the product specifications against the manufacturer's website.",
    "changeStatus": true,
    "notifyAssignee": true,
    "reviewDeadline": "2025-04-07T23:59:59Z",
    "priority": "medium"
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Submission assigned successfully",
  "submission": {
    "id": "submission_1234567890",
    "status": "in_review",
    "previousStatus": "pending",
    "assignedAt": "2025-04-04T14:30:15Z",
    "assignedBy": {
      "id": "user_admin123",
      "name": "Admin User"
    },
    "assignedTo": {
      "id": "user_admin456",
      "name": "Review Specialist"
    },
    "reviewDeadline": "2025-04-07T23:59:59Z",
    "priority": "medium"
  },
  "notificationSent": true
}
```

#### Submission Not Found (404 Not Found)

```json
{
  "error": "Submission not found"
}
```

#### Assignee Not Found (404 Not Found)

```json
{
  "error": "Assignee not found"
}
```

#### Invalid Status (400 Bad Request)

```json
{
  "error": "Cannot assign this submission",
  "reason": "Submission has already been approved or rejected",
  "status": "approved"
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
  "error": "Insufficient permissions to assign submissions"
}
```

#### Invalid Tenant (403 Forbidden)

```json
{
  "error": "Invalid tenant context"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "assigneeId",
      "message": "Assignee ID is required"
    }
  ]
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to assign submission"
}
```

## Testing Scenarios

### Success Scenarios

1. **Assign submission without changing status**
   - Expected: 200 OK with assignment recorded
   - Test: Send assignment request with changeStatus=false, verify assignment recorded but status unchanged

2. **Assign submission and change status**
   - Expected: 200 OK with status changed to in_review
   - Test: Send assignment with changeStatus=true, verify status updated

3. **Assign with notification**
   - Expected: 200 OK and notification sent
   - Test: Send assignment with notifyAssignee=true, verify notification sent

4. **Assign with review deadline**
   - Expected: 200 OK with deadline set
   - Test: Send assignment with reviewDeadline, verify deadline is set correctly

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

### Status-Related Scenarios

1. **Assign approved submission**
   - Expected: 400 Bad Request
   - Test: Attempt to assign already approved submission, verify appropriate error

2. **Assign rejected submission**
   - Expected: 400 Bad Request
   - Test: Attempt to assign already rejected submission, verify appropriate error

3. **Reassign already assigned submission**
   - Expected: 200 OK with new assignment
   - Test: Assign submission that's already assigned, verify assignment is updated

### Edge Case Scenarios

1. **Submission not found**
   - Expected: 404 Not Found
   - Test: Attempt to assign non-existent submission ID, verify 404 response

2. **Assignee not found**
   - Expected: 404 Not Found
   - Test: Attempt to assign to non-existent admin ID, verify appropriate error

3. **Invalid review deadline**
   - Expected: 400 Bad Request
   - Test: Send request with past date as review deadline, verify validation error

4. **Self-assignment**
   - Expected: 200 OK
   - Test: Admin assigns submission to themselves, verify assignment is recorded

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Store assignment history to track all assignments
- Implement notification system for assignee alerts
- Add appropriate logging for security and audit purposes
- Consider implementing workload balancing for automatic assignments
- Track assignment patterns and completion rates for performance metrics
- Implement proper error handling with meaningful messages
- Consider adding automated follow-up reminders for approaching deadlines
- Ensure assignees have appropriate permissions to review submissions

## Priority Levels

Standard priority levels for submission review:

1. **low**: Non-urgent submissions, longer review timeframe acceptable
2. **medium**: Standard submissions, normal review timeframe
3. **high**: Important submissions requiring prompt review
4. **urgent**: Critical submissions requiring immediate attention

## Relationship to Review Workflow

This endpoint facilitates team-based review processes:

1. Submissions enter the system and await assignment
2. Administrators assign submissions to appropriate team members
3. Assigned administrators review and process their submissions
4. Assignment tracking provides accountability and workload visibility

This assignment system improves review efficiency by:
- Distributing workload across the team
- Matching submissions to administrators with relevant expertise
- Providing clear ownership of each submission
- Enabling prioritization of important submissions
- Tracking review deadlines and performance metrics

The assignment process is particularly valuable for organizations with specialized review teams or high submission volumes.