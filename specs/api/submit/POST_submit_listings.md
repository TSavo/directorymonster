# POST /api/submit/listings API Specification

## Overview

This endpoint allows authenticated users to submit new listings for approval. It's part of the submission API, which provides a controlled way for users to contribute content to the directory without requiring administrative access.

## Requirements

### Functional Requirements

1. Allow authenticated users to submit new listings for approval
2. Validate all required fields and data formats
3. Store submission with pending status for admin review
4. Associate submission with the submitting user
5. Return submission ID and status information
6. Support optional notification preferences

### Security Requirements

1. Require authentication (JWT token)
2. Validate user has basic submission permissions
3. Implement rate limiting to prevent submission spam
4. Sanitize all user input to prevent injection attacks
5. Store submission in tenant-specific context
6. Log submission activity for audit purposes

### Performance Requirements

1. Response time should be < 500ms
2. Handle file uploads efficiently (if applicable)
3. Implement proper error handling with meaningful messages

## API Specification

### Request

- Method: POST
- Path: /api/submit/listings
- Headers:
  - Authorization: Bearer {JWT token}
  - Content-Type: application/json
- Body:
  ```json
  {
    "siteSlug": "fishing-gear",
    "categorySlug": "fishing-rods",
    "title": "Premium Fishing Rod XL-5000",
    "description": "High-quality carbon fiber fishing rod for professional anglers",
    "url": "https://example.com/fishing-rod-xl5000",
    "contactEmail": "contact@example.com",
    "contactName": "John Smith",
    "attributes": {
      "brand": "FisherPro",
      "material": "Carbon Fiber",
      "length": "12ft"
    },
    "tags": ["professional", "carbon-fiber", "saltwater"],
    "notifyOnApproval": true
  }
  ```

### Response

#### Success (201 Created)

```json
{
  "submission": {
    "id": "submission_1234567890",
    "status": "pending",
    "siteSlug": "fishing-gear",
    "categorySlug": "fishing-rods",
    "title": "Premium Fishing Rod XL-5000",
    "submittedBy": "user_1234567890",
    "submittedAt": "2025-04-02T10:15:30Z",
    "estimatedReviewTime": "48 hours"
  },
  "message": "Listing submitted successfully and is pending review"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "url",
      "message": "URL must be a valid website address"
    }
  ]
}
```

#### Unauthorized (401 Unauthorized)

```json
{
  "error": "Authentication required"
}
```

#### Rate Limit Exceeded (429 Too Many Requests)

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600,
  "message": "You have exceeded the maximum number of submissions allowed per hour"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to process submission"
}
```

## Testing Scenarios

### Success Scenarios

1. **Submit valid listing**
   - Expected: 201 Created with submission details
   - Test: Send valid submission data, verify response contains submission ID and pending status

2. **Submit with optional fields**
   - Expected: 201 Created with submission details
   - Test: Send submission with optional fields omitted, verify submission is created with default values

### Validation Failure Scenarios

1. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send submissions missing required fields, verify appropriate validation errors

2. **Invalid data formats**
   - Expected: 400 Bad Request
   - Test: Send submissions with invalid URLs, emails, etc., verify validation errors

3. **Category doesn't exist**
   - Expected: 400 Bad Request
   - Test: Submit to non-existent category, verify appropriate error

### Authentication Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Invalid authentication**
   - Expected: 401 Unauthorized
   - Test: Send request with invalid token, verify 401 response

### Rate Limiting Scenarios

1. **Exceed submission limit**
   - Expected: 429 Too Many Requests
   - Test: Submit multiple listings in quick succession, verify rate limit response

### Edge Case Scenarios

1. **Very large submission**
   - Expected: Proper handling of large text fields
   - Test: Submit listing with maximum allowed field lengths, verify proper handling

2. **Duplicate submission**
   - Expected: Appropriate handling (accept as new or reject as duplicate)
   - Test: Submit identical listing twice, verify system behavior matches requirements

## Implementation Notes

- Store submissions separately from approved listings
- Implement workflow status tracking (pending, approved, rejected)
- Send notifications to administrators about new submissions
- Consider implementing spam detection for submissions
- Provide clear feedback to users about submission status
- Implement proper tenant isolation for submissions
- Consider adding support for draft submissions that users can complete later
- Add appropriate logging for security and audit purposes

## Relationship to Admin API

The submission API works in conjunction with the admin API:

1. Users submit content through the submission API
2. Admins review submissions through the admin API
3. Admins can approve, reject, or request changes to submissions
4. Approved submissions are published to the public API

This separation provides a clear workflow for content contribution while maintaining quality control and security.