# PUT /api/admin/submissions/{submissionId}/approve API Specification

## Overview

This endpoint allows administrators to approve a submission, converting it into a published listing. It's a critical part of the content moderation workflow, enabling quality control for user-submitted content.

## Requirements

### Functional Requirements

1. Allow administrators to approve a pending or in-review submission
2. Convert the submission into a published listing
3. Support optional modifications during approval
4. Support approval notes and feedback to the submitter
5. Update submission status and review history
6. Notify the submitter of the approval (if configured)
7. Return the newly created listing details

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for submission approval
4. Log approval action for audit purposes
5. Prevent cross-tenant approval of submissions

### Performance Requirements

1. Response time should be < 500ms
2. Handle the transaction atomically
3. Implement proper error handling
4. Update search indexes efficiently

## API Specification

### Request

- Method: PUT
- Path: /api/admin/submissions/{submissionId}/approve
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
  ```json
  {
    "modifications": {
      "title": "Premium Fishing Rod XL-5000 Pro Carbon",
      "description": "High-quality carbon fiber fishing rod for professional anglers with improved grip. Ideal for saltwater fishing.",
      "attributes": {
        "brand": "FisherPro",
        "material": "Carbon Fiber",
        "length": "12ft",
        "weight": "8oz"
      },
      "tags": ["professional", "carbon-fiber", "saltwater", "lightweight"]
    },
    "feedback": "Your submission has been approved with minor title and description edits for clarity.",
    "notifySubmitter": true,
    "featured": false,
    "publishedAt": "2025-04-05T00:00:00Z",
    "internalNotes": "High-quality submission from a reliable contributor. Verified product details on manufacturer website."
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Submission approved successfully",
  "submission": {
    "id": "submission_1234567890",
    "status": "approved",
    "approvedAt": "2025-04-04T14:30:15Z",
    "approvedBy": {
      "id": "user_admin123",
      "name": "Admin User"
    }
  },
  "listing": {
    "id": "listing_5678901234",
    "siteId": "site_1234567890",
    "siteName": "Fishing Gear Reviews",
    "siteSlug": "fishing-gear",
    "categoryId": "category_1234567890",
    "categoryName": "Fishing Rods",
    "categorySlug": "fishing-rods",
    "title": "Premium Fishing Rod XL-5000 Pro Carbon",
    "description": "High-quality carbon fiber fishing rod for professional anglers with improved grip. Ideal for saltwater fishing.",
    "url": "https://example.com/fishing-rod-xl5000",
    "slug": "premium-fishing-rod-xl-5000-pro-carbon",
    "attributes": {
      "brand": "FisherPro",
      "material": "Carbon Fiber",
      "length": "12ft",
      "weight": "8oz"
    },
    "tags": ["professional", "carbon-fiber", "saltwater", "lightweight"],
    "featured": false,
    "publishedAt": "2025-04-05T00:00:00Z",
    "createdAt": "2025-04-04T14:30:15Z",
    "updatedAt": "2025-04-04T14:30:15Z",
    "submissionId": "submission_1234567890"
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
  "error": "Cannot approve submission",
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
  "error": "Insufficient permissions to approve submissions"
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
      "field": "modifications.title",
      "message": "Title cannot be empty"
    }
  ]
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to approve submission"
}
```

## Testing Scenarios

### Success Scenarios

1. **Approve submission without modifications**
   - Expected: 200 OK with listing details
   - Test: Send approval request without modifications, verify submission status updated and listing created

2. **Approve submission with modifications**
   - Expected: 200 OK with modified listing details
   - Test: Send approval request with modifications, verify listing reflects changes

3. **Approve with feedback to submitter**
   - Expected: 200 OK and notification sent
   - Test: Send approval with feedback and notifySubmitter=true, verify notification sent

4. **Schedule future publication**
   - Expected: 200 OK with future publishedAt date
   - Test: Send approval with future publishedAt date, verify listing has correct publication date

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

1. **Approve already approved submission**
   - Expected: 400 Bad Request
   - Test: Attempt to approve already approved submission, verify appropriate error

2. **Approve rejected submission**
   - Expected: 400 Bad Request
   - Test: Attempt to approve already rejected submission, verify appropriate error

### Edge Case Scenarios

1. **Submission not found**
   - Expected: 404 Not Found
   - Test: Attempt to approve non-existent submission ID, verify 404 response

2. **Invalid modifications**
   - Expected: 400 Bad Request
   - Test: Send approval with invalid modifications, verify validation error

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use Redis transactions for atomicity when creating the listing
- Update search indexes to include the new listing
- Implement notification system for submitter feedback
- Add appropriate logging for security and audit purposes
- Consider implementing approval workflows for multi-step approval processes
- Store approval history for audit trail
- Implement proper error handling with meaningful messages
- Consider adding automated post-approval checks

## Relationship to Submission Workflow

This endpoint is the critical bridge between the submission process and published content:

1. Users submit content through the Submission API
2. Administrators review submissions through the Admin API
3. This endpoint converts approved submissions into published listings
4. Published listings become visible through the Public API

The approval process ensures quality control while providing a path for user-contributed content to enter the directory. This maintains the integrity of the directory while enabling community participation.