# GET /api/admin/submissions/{submissionId} API Specification

## Overview

This endpoint allows administrators to retrieve detailed information about a specific submission. It provides comprehensive data needed for thorough review and decision-making.

## Requirements

### Functional Requirements

1. Return detailed information about a specific submission
2. Include full submission content and metadata
3. Include submission history and revision tracking
4. Include submitter information
5. Include review history and admin feedback
6. Support tenant-specific access control

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for submission management
4. Log access for audit purposes
5. Prevent cross-tenant access to submissions

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper caching for repeated access
3. Optimize database queries for performance

## API Specification

### Request

- Method: GET
- Path: /api/admin/submissions/{submissionId}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}

### Response

#### Success (200 OK)

```json
{
  "submission": {
    "id": "submission_1234567890",
    "status": "in_review",
    "siteId": "site_1234567890",
    "siteName": "Fishing Gear Reviews",
    "siteSlug": "fishing-gear",
    "categoryId": "category_1234567890",
    "categoryName": "Fishing Rods",
    "categorySlug": "fishing-rods",
    "title": "Premium Fishing Rod XL-5000",
    "description": "High-quality carbon fiber fishing rod for professional anglers with improved grip and sensitivity. Perfect for saltwater fishing and targeting larger species. Features a comfortable EVA foam handle and stainless steel guides.",
    "url": "https://example.com/fishing-rod-xl5000",
    "contactEmail": "contact@example.com",
    "contactName": "John Smith",
    "contactPhone": "+1-555-123-4567",
    "attributes": {
      "brand": "FisherPro",
      "material": "Carbon Fiber",
      "length": "12ft",
      "weight": "8oz",
      "warranty": "Lifetime",
      "price": "$299.99"
    },
    "tags": ["professional", "carbon-fiber", "saltwater", "heavy-duty"],
    "images": [
      {
        "url": "https://example.com/images/fishing-rod-xl5000-main.jpg",
        "caption": "Full view of the Premium Fishing Rod XL-5000",
        "isPrimary": true
      },
      {
        "url": "https://example.com/images/fishing-rod-xl5000-handle.jpg",
        "caption": "Close-up of the ergonomic handle",
        "isPrimary": false
      }
    ],
    "submittedBy": {
      "id": "user_1234567890",
      "name": "John Smith",
      "email": "john@example.com",
      "company": "FisherPro Equipment",
      "submissionCount": 12,
      "approvalRate": 0.85,
      "memberSince": "2024-01-15T00:00:00Z"
    },
    "submittedAt": "2025-04-02T10:15:30Z",
    "lastUpdatedAt": "2025-04-03T15:20:45Z",
    "reviewHistory": [
      {
        "status": "pending",
        "timestamp": "2025-04-02T10:15:30Z",
        "adminId": null,
        "adminName": null,
        "notes": "Initial submission"
      },
      {
        "status": "in_review",
        "timestamp": "2025-04-03T09:30:15Z",
        "adminId": "user_admin123",
        "adminName": "Admin User",
        "notes": "Started review process"
      }
    ],
    "revisions": [
      {
        "version": 1,
        "timestamp": "2025-04-02T10:15:30Z",
        "changes": "Initial submission"
      },
      {
        "version": 2,
        "timestamp": "2025-04-03T15:20:45Z",
        "changes": "Updated description and added additional product specifications"
      }
    ],
    "currentRevision": 2,
    "feedback": [
      {
        "adminId": "user_admin123",
        "adminName": "Admin User",
        "timestamp": "2025-04-03T09:35:20Z",
        "message": "Please provide more specific information about the rod's action and power rating.",
        "isPublic": true,
        "isResolved": false
      }
    ],
    "assignedTo": {
      "id": "user_admin123",
      "name": "Admin User",
      "email": "admin@example.com",
      "assignedAt": "2025-04-03T09:30:15Z"
    },
    "notes": [
      {
        "adminId": "user_admin123",
        "adminName": "Admin User",
        "timestamp": "2025-04-03T09:32:10Z",
        "message": "This is a high-quality submission from a reliable contributor. Product appears legitimate based on initial research.",
        "isPrivate": true
      }
    ],
    "similarListings": [
      {
        "id": "listing_5678901234",
        "title": "FisherPro Carbon Fiber Rod XL-4000",
        "url": "https://example.com/fisherpro-xl4000",
        "similarity": 0.85
      }
    ],
    "automatedChecks": {
      "spamScore": 0.02,
      "contentQualityScore": 0.92,
      "duplicateContentScore": 0.15,
      "urlAccessible": true,
      "imageQualityScore": 0.88,
      "grammarScore": 0.95
    }
  }
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
  "error": "Insufficient permissions to access this submission"
}
```

#### Invalid Tenant (403 Forbidden)

```json
{
  "error": "Invalid tenant context"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve submission details"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve submission details**
   - Expected: 200 OK with detailed submission information
   - Test: Send request with valid admin JWT, tenant ID, and submission ID

2. **Retrieve submission with multiple revisions**
   - Expected: 200 OK with revision history
   - Test: Create submission with multiple updates, verify revision history is complete

3. **Retrieve submission with feedback**
   - Expected: 200 OK with feedback history
   - Test: Add admin feedback to submission, verify feedback is included in response

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

1. **Submission not found**
   - Expected: 404 Not Found
   - Test: Request non-existent submission ID, verify 404 response

2. **Submission with large content**
   - Expected: Proper handling of large text fields
   - Test: Create submission with maximum allowed field lengths, verify proper display

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use Redis for caching frequently accessed submissions
- Store revision history efficiently to track changes over time
- Implement similarity detection to identify potential duplicate listings
- Add appropriate logging for security and audit purposes
- Consider implementing automated quality checks for submissions
- Optimize database queries for performance
- Implement proper error handling with meaningful messages
- Consider adding AI-assisted review suggestions for administrators

## Relationship to Approval Process

This endpoint provides the detailed information administrators need to make informed decisions about submissions:

1. Administrators can review all submission details
2. Revision history shows how the submission has evolved
3. Feedback history shows communication with the submitter
4. Automated checks provide initial quality assessment
5. Similar listing detection helps prevent duplicates

This detailed view is essential for maintaining quality control and ensuring that only appropriate content is published to the directory.