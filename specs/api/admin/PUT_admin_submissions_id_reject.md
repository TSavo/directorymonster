# PUT /api/admin/submissions/{submissionId}/reject API Specification

## Overview

This endpoint allows administrators to reject a submission that doesn't meet the platform's quality standards or guidelines. It's an essential part of the content moderation workflow, enabling administrators to filter out inappropriate or low-quality submissions.

## Requirements

### Functional Requirements

1. Allow administrators to reject a pending or in-review submission
2. Support rejection reason categorization
3. Support detailed feedback to the submitter
4. Update submission status and review history
5. Notify the submitter of the rejection (if configured)
6. Support optional suggestion for resubmission

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for submission rejection
4. Log rejection action for audit purposes
5. Prevent cross-tenant rejection of submissions

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper error handling
3. Handle the transaction atomically

## API Specification

### Request

- Method: PUT
- Path: /api/admin/submissions/{submissionId}/reject
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
  ```json
  {
    "reason": "content_quality",
    "reasonDetails": "The submission does not meet our quality standards.",
    "feedback": "Your submission was rejected because the product description lacks specific details and the provided URL leads to a generic page rather than the specific product. Please provide more detailed information about the product specifications and ensure the URL links directly to the product page.",
    "allowResubmission": true,
    "notifySubmitter": true,
    "internalNotes": "Product appears legitimate but submission quality is too low. Encouraging resubmission with better details."
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Submission rejected successfully",
  "submission": {
    "id": "submission_1234567890",
    "status": "rejected",
    "rejectedAt": "2025-04-04T14:30:15Z",
    "rejectedBy": {
      "id": "user_admin123",
      "name": "Admin User"
    },
    "reason": "content_quality",
    "reasonDetails": "The submission does not meet our quality standards.",
    "allowResubmission": true
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
  "error": "Cannot reject submission",
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
  "error": "Insufficient permissions to reject submissions"
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
      "field": "reason",
      "message": "Rejection reason is required"
    }
  ]
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to reject submission"
}
```

## Testing Scenarios

### Success Scenarios

1. **Reject submission with reason**
   - Expected: 200 OK with updated submission status
   - Test: Send rejection request with reason, verify submission status updated to rejected

2. **Reject with detailed feedback**
   - Expected: 200 OK and feedback stored
   - Test: Send rejection with detailed feedback, verify feedback is stored with submission

3. **Reject with notification**
   - Expected: 200 OK and notification sent
   - Test: Send rejection with notifySubmitter=true, verify notification sent

4. **Reject but allow resubmission**
   - Expected: 200 OK with allowResubmission=true
   - Test: Send rejection with allowResubmission=true, verify flag is set correctly

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

1. **Reject already approved submission**
   - Expected: 400 Bad Request
   - Test: Attempt to reject already approved submission, verify appropriate error

2. **Reject already rejected submission**
   - Expected: 400 Bad Request
   - Test: Attempt to reject already rejected submission, verify appropriate error

### Edge Case Scenarios

1. **Submission not found**
   - Expected: 404 Not Found
   - Test: Attempt to reject non-existent submission ID, verify 404 response

2. **Missing rejection reason**
   - Expected: 400 Bad Request
   - Test: Send rejection without reason, verify validation error

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use standardized rejection reason categories for analytics
- Implement notification system for submitter feedback
- Add appropriate logging for security and audit purposes
- Store rejection history for audit trail
- Consider implementing rejection templates for common scenarios
- Track rejection patterns to identify potential issues with submission guidelines
- Implement proper error handling with meaningful messages
- Consider adding automated suggestions for improvement

## Rejection Reason Categories

Standardized rejection categories help with analytics and reporting:

1. **content_quality**: Submission lacks detail or has poor quality content
2. **inappropriate_content**: Submission contains prohibited or inappropriate content
3. **duplicate_listing**: Submission duplicates an existing listing
4. **incorrect_category**: Submission is in the wrong category
5. **broken_url**: The submitted URL is broken or inaccessible
6. **spam**: Submission appears to be spam or promotional without value
7. **policy_violation**: Submission violates platform policies
8. **insufficient_information**: Submission lacks required information
9. **other**: Other reason (requires details)

## Relationship to Submission Workflow

This endpoint is an essential part of the content moderation process:

1. Users submit content through the Submission API
2. Administrators review submissions through the Admin API
3. This endpoint allows rejection of submissions that don't meet standards
4. Rejected submissions can be improved and resubmitted if allowed

The rejection process maintains quality control while providing feedback to submitters on how to improve their contributions. This helps maintain the integrity of the directory while educating contributors about content standards.