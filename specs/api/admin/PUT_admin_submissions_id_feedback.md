# PUT /api/admin/submissions/{submissionId}/feedback API Specification

## Overview

This endpoint allows administrators to provide feedback on a submission without changing its approval status. It enables communication with submitters to request improvements or clarifications before making a final decision.

## Requirements

### Functional Requirements

1. Allow administrators to provide feedback on a pending or in-review submission
2. Support detailed feedback messages to the submitter
3. Support internal notes visible only to administrators
4. Update submission review history
5. Notify the submitter of the feedback (if configured)
6. Support changing submission status to "changes_requested"
7. Support setting a feedback response deadline

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for submission feedback
4. Log feedback action for audit purposes
5. Prevent cross-tenant access to submissions

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper error handling
3. Handle the transaction atomically

## API Specification

### Request

- Method: PUT
- Path: /api/admin/submissions/{submissionId}/feedback
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
  ```json
  {
    "feedback": "Thank you for your submission. Before we can approve it, please provide the following additional information:\n\n1. More specific details about the rod's action (fast, medium, slow)\n2. The power rating of the rod (ultra-light, light, medium, etc.)\n3. A higher resolution primary image\n\nPlease update your submission with this information at your earliest convenience.",
    "changeStatus": true,
    "internalNotes": "Product looks good but needs more technical specifications before approval.",
    "notifySubmitter": true,
    "responseDeadline": "2025-04-10T23:59:59Z"
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Feedback provided successfully",
  "submission": {
    "id": "submission_1234567890",
    "status": "changes_requested",
    "previousStatus": "in_review",
    "feedbackProvidedAt": "2025-04-04T14:30:15Z",
    "feedbackProvidedBy": {
      "id": "user_admin123",
      "name": "Admin User"
    },
    "responseDeadline": "2025-04-10T23:59:59Z"
  },
  "feedback": {
    "id": "feedback_9876543210",
    "message": "Thank you for your submission. Before we can approve it, please provide the following additional information:\n\n1. More specific details about the rod's action (fast, medium, slow)\n2. The power rating of the rod (ultra-light, light, medium, etc.)\n3. A higher resolution primary image\n\nPlease update your submission with this information at your earliest convenience.",
    "timestamp": "2025-04-04T14:30:15Z",
    "isResolved": false
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

#### Invalid Status (400 Bad Request)

```json
{
  "error": "Cannot provide feedback on this submission",
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
  "error": "Insufficient permissions to provide feedback on submissions"
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
      "field": "feedback",
      "message": "Feedback message is required"
    }
  ]
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to provide feedback on submission"
}
```

## Testing Scenarios

### Success Scenarios

1. **Provide feedback without changing status**
   - Expected: 200 OK with feedback stored
   - Test: Send feedback request with changeStatus=false, verify feedback stored but status unchanged

2. **Provide feedback and change status**
   - Expected: 200 OK with status changed to changes_requested
   - Test: Send feedback with changeStatus=true, verify status updated

3. **Provide feedback with notification**
   - Expected: 200 OK and notification sent
   - Test: Send feedback with notifySubmitter=true, verify notification sent

4. **Provide feedback with response deadline**
   - Expected: 200 OK with deadline set
   - Test: Send feedback with responseDeadline, verify deadline is set correctly

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

1. **Provide feedback on approved submission**
   - Expected: 400 Bad Request
   - Test: Attempt to provide feedback on already approved submission, verify appropriate error

2. **Provide feedback on rejected submission**
   - Expected: 400 Bad Request
   - Test: Attempt to provide feedback on already rejected submission, verify appropriate error

### Edge Case Scenarios

1. **Submission not found**
   - Expected: 404 Not Found
   - Test: Attempt to provide feedback on non-existent submission ID, verify 404 response

2. **Empty feedback message**
   - Expected: 400 Bad Request
   - Test: Send request with empty feedback message, verify validation error

3. **Invalid response deadline**
   - Expected: 400 Bad Request
   - Test: Send request with past date as response deadline, verify validation error

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Store feedback history to track all communication
- Implement notification system for submitter feedback
- Add appropriate logging for security and audit purposes
- Consider implementing feedback templates for common scenarios
- Track feedback patterns to identify common issues with submissions
- Implement proper error handling with meaningful messages
- Consider adding automated follow-up reminders for unresolved feedback
- Implement a system for submitters to respond to feedback

## Relationship to Submission Workflow

This endpoint enables an iterative improvement process for submissions:

1. Users submit content through the Submission API
2. Administrators review submissions and provide feedback using this endpoint
3. Users update their submissions based on feedback
4. Administrators can then approve or reject the improved submission

This feedback loop improves content quality while maintaining a collaborative relationship with submitters. It allows for refinement of submissions before final approval or rejection, leading to higher quality published content.