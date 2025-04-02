# DELETE /api/submit/listings/{submissionId} API Specification

## Overview

This endpoint allows authenticated users to withdraw their pending listing submissions. It's part of the submission API, enabling users to remove submissions they no longer wish to have considered for publication.

## Requirements

### Functional Requirements

1. Allow users to withdraw their own pending submissions
2. Prevent withdrawal of submissions that are already approved
3. Mark submissions as withdrawn rather than permanently deleting them
4. Return confirmation of withdrawal
5. Support optional reason for withdrawal

### Security Requirements

1. Require authentication (JWT token)
2. Users can only withdraw their own submissions
3. Implement rate limiting to prevent abuse
4. Log withdrawal for audit purposes

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper error handling with meaningful messages

## API Specification

### Request

- Method: DELETE
- Path: /api/submit/listings/{submissionId}
- Headers:
  - Authorization: Bearer {JWT token}
- Query Parameters:
  - `reason`: (string, optional) - Reason for withdrawal
  - `permanent`: (boolean, optional, default: false) - Whether to permanently delete the submission

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Submission withdrawn successfully",
  "submissionId": "submission_1234567890"
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
  "error": "You can only withdraw your own submissions"
}
```

#### Cannot Withdraw (409 Conflict)

```json
{
  "error": "Cannot withdraw submission",
  "reason": "Submission has already been approved and published",
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
  "error": "Failed to withdraw submission"
}
```

## Testing Scenarios

### Success Scenarios

1. **Withdraw pending submission**
   - Expected: 200 OK with success message
   - Test: Send delete request for user's pending submission, verify withdrawal

2. **Withdraw with reason**
   - Expected: 200 OK with success message
   - Test: Send delete request with reason parameter, verify reason is recorded

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Withdraw another user's submission**
   - Expected: 403 Forbidden or 404 Not Found
   - Test: Attempt to withdraw submission created by different user, verify error response

### Status-Related Scenarios

1. **Withdraw approved submission**
   - Expected: 409 Conflict
   - Test: Attempt to withdraw already approved submission, verify appropriate error

2. **Withdraw rejected submission**
   - Expected: 200 OK with success message
   - Test: Withdraw already rejected submission, verify successful withdrawal

### Edge Case Scenarios

1. **Submission not found**
   - Expected: 404 Not Found
   - Test: Attempt to withdraw non-existent submission ID, verify 404 response

2. **Permanent deletion**
   - Expected: 200 OK with success message
   - Test: Send delete request with permanent=true, verify complete removal from system

## Implementation Notes

- Ensure users can only withdraw their own submissions
- Implement soft deletion by default (mark as withdrawn but keep record)
- Consider implementing a recovery period during which withdrawn submissions can be restored
- Add appropriate logging for security and audit purposes
- Consider implementing a notification system to alert admins about withdrawn submissions
- Store withdrawal reason for analytics purposes
- Track withdrawal patterns to identify potential issues with the submission process

## Relationship to Admin API

This endpoint works in conjunction with the admin review process:

1. Users can withdraw submissions they no longer wish to have published
2. Admins can see withdrawn submissions (marked as such) through the admin API
3. Withdrawal statistics can help identify potential issues with the submission process
4. Permanent deletion requests may require additional verification

This allows users to maintain control over their submissions while providing administrators with a complete audit trail of submission activity.