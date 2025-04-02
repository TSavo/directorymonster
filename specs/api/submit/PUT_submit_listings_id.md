# PUT /api/submit/listings/{submissionId} API Specification

## Overview

This endpoint allows authenticated users to update their pending listing submissions. It's part of the submission API, enabling users to make corrections or improvements to their submissions before they are reviewed by administrators.

## Requirements

### Functional Requirements

1. Allow users to update their own pending submissions
2. Validate all fields and data formats
3. Prevent updates to submissions that are already approved or rejected
4. Reset review status if significant changes are made
5. Return updated submission details
6. Support partial updates (only changed fields)

### Security Requirements

1. Require authentication (JWT token)
2. Users can only update their own submissions
3. Implement rate limiting to prevent abuse
4. Sanitize all user input to prevent injection attacks
5. Log changes for audit purposes

### Performance Requirements

1. Response time should be < 500ms
2. Handle file updates efficiently (if applicable)
3. Implement proper error handling with meaningful messages

## API Specification

### Request

- Method: PUT
- Path: /api/submit/listings/{submissionId}
- Headers:
  - Authorization: Bearer {JWT token}
  - Content-Type: application/json
- Body:
  ```json
  {
    "title": "Updated Premium Fishing Rod XL-5000 Pro",
    "description": "Updated high-quality carbon fiber fishing rod for professional anglers with improved grip",
    "url": "https://example.com/fishing-rod-xl5000-pro",
    "contactEmail": "updated@example.com",
    "attributes": {
      "brand": "FisherPro",
      "material": "Carbon Fiber",
      "length": "12ft",
      "weight": "8oz"
    },
    "tags": ["professional", "carbon-fiber", "saltwater", "lightweight"]
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "submission": {
    "id": "submission_1234567890",
    "status": "pending",
    "siteSlug": "fishing-gear",
    "categorySlug": "fishing-rods",
    "title": "Updated Premium Fishing Rod XL-5000 Pro",
    "description": "Updated high-quality carbon fiber fishing rod for professional anglers with improved grip",
    "url": "https://example.com/fishing-rod-xl5000-pro",
    "contactEmail": "updated@example.com",
    "attributes": {
      "brand": "FisherPro",
      "material": "Carbon Fiber",
      "length": "12ft",
      "weight": "8oz"
    },
    "tags": ["professional", "carbon-fiber", "saltwater", "lightweight"],
    "submittedBy": "user_1234567890",
    "submittedAt": "2025-04-02T10:15:30Z",
    "lastUpdatedAt": "2025-04-03T15:20:45Z",
    "reviewStatus": "pending_review"
  },
  "message": "Submission updated successfully"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "url",
      "message": "URL must be a valid website address"
    }
  ]
}
```

#### Submission Not Found (404 Not Found)

```json
{
  "error": "Submission not found"
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
  "error": "You can only update your own submissions"
}
```

#### Cannot Update (409 Conflict)

```json
{
  "error": "Cannot update submission",
  "reason": "Submission has already been approved or rejected",
  "status": "approved"
}
```

#### Rate Limit Exceeded (429 Too Many Requests)

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to update submission"
}
```

## Testing Scenarios

### Success Scenarios

1. **Update pending submission**
   - Expected: 200 OK with updated submission details
   - Test: Send valid update to user's pending submission, verify changes applied

2. **Partial update**
   - Expected: 200 OK with partially updated submission
   - Test: Send request with only some fields changed, verify only those fields are updated

### Validation Failure Scenarios

1. **Invalid field values**
   - Expected: 400 Bad Request
   - Test: Send update with invalid URL, email, etc., verify validation errors

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Update another user's submission**
   - Expected: 403 Forbidden or 404 Not Found
   - Test: Attempt to update submission created by different user, verify error response

### Status-Related Scenarios

1. **Update approved submission**
   - Expected: 409 Conflict
   - Test: Attempt to update already approved submission, verify appropriate error

2. **Update rejected submission**
   - Expected: 409 Conflict
   - Test: Attempt to update already rejected submission, verify appropriate error

### Edge Case Scenarios

1. **Submission not found**
   - Expected: 404 Not Found
   - Test: Attempt to update non-existent submission ID, verify 404 response

2. **No changes in update**
   - Expected: 200 OK with unchanged submission
   - Test: Send update identical to current data, verify no changes and appropriate response

## Implementation Notes

- Ensure users can only update their own submissions
- Implement proper validation for all fields
- Consider implementing a change tracking system to highlight what was changed
- Reset review status if significant fields are changed (title, description, URL)
- Consider adding a "revision count" to track how many times a submission has been updated
- Add appropriate logging for security and audit purposes
- Consider implementing a notification system to alert admins about updated submissions
- Store previous versions for audit purposes

## Relationship to Admin API

This endpoint works in conjunction with the admin review process:

1. Users can update their submissions while they are still pending
2. Admins can see the update history through the admin API
3. Significant updates may reset the review status or trigger re-review
4. Admins can provide feedback requesting specific updates

This allows for an iterative submission improvement process while maintaining administrative control over the final approval.