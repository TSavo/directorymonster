# GET /api/submit/listings API Specification

## Overview

This endpoint allows authenticated users to retrieve their own listing submissions and check their status. It's part of the submission API, enabling users to track their contributions to the directory.

## Requirements

### Functional Requirements

1. Return a list of the authenticated user's listing submissions
2. Include submission status (pending, approved, rejected, etc.)
3. Support filtering by status, site, and category
4. Support pagination for users with many submissions
5. Include feedback from admins when available

### Security Requirements

1. Require authentication (JWT token)
2. Users can only view their own submissions
3. Implement rate limiting to prevent abuse
4. Log access for audit purposes

### Performance Requirements

1. Response time should be < 300ms
2. Efficiently handle users with large numbers of submissions
3. Implement proper error handling

## API Specification

### Request

- Method: GET
- Path: /api/submit/listings
- Headers:
  - Authorization: Bearer {JWT token}
- Query Parameters:
  - `status`: (string, optional) - Filter by submission status (pending, approved, rejected)
  - `siteSlug`: (string, optional) - Filter by site
  - `categorySlug`: (string, optional) - Filter by category
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `limit`: (number, optional, default: 20) - Results per page
  - `sort`: (string, optional, default: 'submittedAt') - Field to sort by
  - `order`: (string, optional, default: 'desc') - Sort order ('asc' or 'desc')

### Response

#### Success (200 OK)

```json
{
  "submissions": [
    {
      "id": "submission_1234567890",
      "status": "pending",
      "siteSlug": "fishing-gear",
      "categorySlug": "fishing-rods",
      "title": "Premium Fishing Rod XL-5000",
      "url": "https://example.com/fishing-rod-xl5000",
      "submittedAt": "2025-04-02T10:15:30Z",
      "lastUpdatedAt": "2025-04-02T10:15:30Z",
      "feedback": null
    },
    {
      "id": "submission_0987654321",
      "status": "approved",
      "siteSlug": "fishing-gear",
      "categorySlug": "fishing-reels",
      "title": "Ultra-Light Fishing Reel Pro",
      "url": "https://example.com/ultra-light-reel",
      "submittedAt": "2025-04-01T08:30:00Z",
      "lastUpdatedAt": "2025-04-03T14:25:10Z",
      "approvedAt": "2025-04-03T14:25:10Z",
      "listingId": "listing_5678901234",
      "feedback": "Great submission, approved as is."
    },
    {
      "id": "submission_1357908642",
      "status": "rejected",
      "siteSlug": "fishing-gear",
      "categorySlug": "fishing-lures",
      "title": "Magic Fish Attractor",
      "url": "https://example.com/magic-lure",
      "submittedAt": "2025-03-28T16:45:20Z",
      "lastUpdatedAt": "2025-03-30T11:10:05Z",
      "rejectedAt": "2025-03-30T11:10:05Z",
      "feedback": "Product claims cannot be verified. Please provide evidence for claims made in the description."
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

#### No Submissions Found (200 OK with empty array)

```json
{
  "submissions": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "pages": 0
  }
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
  "retryAfter": 60
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve submissions"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all user submissions**
   - Expected: 200 OK with array of submissions
   - Test: Send request with valid JWT, verify response contains user's submissions

2. **Filter by status**
   - Expected: 200 OK with filtered submissions
   - Test: Send request with status=pending, verify only pending submissions returned

3. **Filter by site and category**
   - Expected: 200 OK with filtered submissions
   - Test: Send request with siteSlug and categorySlug filters, verify filtered results

4. **Pagination works correctly**
   - Expected: 200 OK with paginated results
   - Test: Create multiple submissions, request with page=2&limit=5, verify correct page returned

### Authentication Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Invalid authentication**
   - Expected: 401 Unauthorized
   - Test: Send request with invalid token, verify 401 response

### Edge Case Scenarios

1. **No submissions match filters**
   - Expected: 200 OK with empty submissions array
   - Test: Filter by non-matching criteria, verify empty array response

2. **Invalid filter parameters**
   - Expected: 400 Bad Request
   - Test: Send request with invalid filter values, verify appropriate error response

## Implementation Notes

- Ensure users can only see their own submissions
- Include detailed status information to help users understand where their submission is in the workflow
- Consider implementing webhook notifications for status changes
- Store admin feedback securely and associate it with the submission
- Implement proper tenant isolation for submissions
- Consider adding support for submission statistics (approval rate, average review time, etc.)
- Add appropriate logging for security and audit purposes

## Relationship to Admin API

While this endpoint allows users to view their own submissions, the admin API provides more comprehensive submission management:

1. Users view their submissions through this endpoint
2. Admins review all submissions through the admin API
3. Admins can provide feedback that users see in their submission details
4. Status changes made by admins are reflected in the user's submission view

This separation ensures users have visibility into their contributions while maintaining administrative control over the approval process.