# GET /api/admin/submissions API Specification

## Overview

This endpoint allows administrators to retrieve and filter all listing submissions across the platform. It provides a comprehensive view of the submission queue for review and management purposes.

## Requirements

### Functional Requirements

1. Return a list of all submissions with filtering options
2. Support filtering by status, site, category, and date range
3. Support sorting by various fields (submission date, update date, etc.)
4. Support pagination for efficient handling of large submission volumes
5. Include detailed submission information including user data
6. Support tenant-specific filtering based on admin context

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for submission management
4. Log access for audit purposes
5. Implement rate limiting to prevent abuse

### Performance Requirements

1. Response time should be < 500ms for typical requests
2. Handle large submission volumes efficiently
3. Implement proper caching for repeated queries
4. Optimize database queries for performance

## API Specification

### Request

- Method: GET
- Path: /api/admin/submissions
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `status`: (string, optional) - Filter by submission status (pending, in_review, approved, rejected, withdrawn)
  - `siteId`: (string, optional) - Filter by site ID
  - `categoryId`: (string, optional) - Filter by category ID
  - `userId`: (string, optional) - Filter by submitting user ID
  - `fromDate`: (ISO date string, optional) - Filter submissions after this date
  - `toDate`: (ISO date string, optional) - Filter submissions before this date
  - `search`: (string, optional) - Search term for title/description
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
      "siteId": "site_1234567890",
      "siteName": "Fishing Gear Reviews",
      "siteSlug": "fishing-gear",
      "categoryId": "category_1234567890",
      "categoryName": "Fishing Rods",
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
      "submittedBy": {
        "id": "user_1234567890",
        "name": "John Smith",
        "email": "john@example.com"
      },
      "submittedAt": "2025-04-02T10:15:30Z",
      "lastUpdatedAt": "2025-04-02T10:15:30Z",
      "reviewHistory": [
        {
          "status": "pending",
          "timestamp": "2025-04-02T10:15:30Z",
          "adminId": null,
          "notes": null
        }
      ],
      "revisionCount": 1,
      "feedback": null,
      "assignedTo": null
    },
    {
      "id": "submission_0987654321",
      "status": "in_review",
      "siteId": "site_1234567890",
      "siteName": "Fishing Gear Reviews",
      "siteSlug": "fishing-gear",
      "categoryId": "category_0987654321",
      "categoryName": "Fishing Reels",
      "categorySlug": "fishing-reels",
      "title": "Ultra-Light Fishing Reel Pro",
      "description": "Lightweight aluminum fishing reel with smooth drag system",
      "url": "https://example.com/ultra-light-reel",
      "contactEmail": "jane@example.com",
      "contactName": "Jane Doe",
      "attributes": {
        "brand": "ReelMaster",
        "material": "Aluminum",
        "weight": "6oz"
      },
      "tags": ["lightweight", "freshwater", "spinning-reel"],
      "submittedBy": {
        "id": "user_0987654321",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "submittedAt": "2025-04-01T08:30:00Z",
      "lastUpdatedAt": "2025-04-01T14:45:20Z",
      "reviewHistory": [
        {
          "status": "pending",
          "timestamp": "2025-04-01T08:30:00Z",
          "adminId": null,
          "notes": null
        },
        {
          "status": "in_review",
          "timestamp": "2025-04-01T14:45:20Z",
          "adminId": "user_admin123",
          "notes": "Started review process"
        }
      ],
      "revisionCount": 1,
      "feedback": null,
      "assignedTo": {
        "id": "user_admin123",
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "stats": {
    "pending": 32,
    "in_review": 8,
    "approved": 120,
    "rejected": 15,
    "withdrawn": 5
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
  },
  "stats": {
    "pending": 0,
    "in_review": 0,
    "approved": 0,
    "rejected": 0,
    "withdrawn": 0
  }
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
  "error": "Insufficient permissions to access submissions"
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
  "error": "Failed to retrieve submissions"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all submissions**
   - Expected: 200 OK with array of submissions
   - Test: Send request with valid admin JWT and tenant ID, verify response contains submissions

2. **Filter by status**
   - Expected: 200 OK with filtered submissions
   - Test: Send request with status=pending, verify only pending submissions returned

3. **Filter by site and category**
   - Expected: 200 OK with filtered submissions
   - Test: Send request with siteId and categoryId filters, verify filtered results

4. **Search submissions**
   - Expected: 200 OK with search results
   - Test: Send request with search term, verify matching submissions returned

5. **Pagination works correctly**
   - Expected: 200 OK with paginated results
   - Test: Create multiple submissions, request with page=2&limit=10, verify correct page returned

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Non-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with non-admin JWT, verify 403 response

3. **Admin from different tenant**
   - Expected: Empty results or filtered results
   - Test: Send request with admin JWT but for different tenant, verify proper tenant isolation

### Edge Case Scenarios

1. **Invalid filter parameters**
   - Expected: 400 Bad Request
   - Test: Send request with invalid filter values, verify appropriate error response

2. **Very large result set**
   - Expected: Proper pagination handling
   - Test: Create 100+ submissions, verify pagination works correctly

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use Redis for caching frequently accessed submission lists
- Consider implementing a submission queue system for high-volume sites
- Add appropriate logging for security and audit purposes
- Consider implementing submission assignment functionality for team review
- Optimize database queries for performance with large submission volumes
- Implement proper error handling with meaningful messages
- Consider adding analytics for submission trends and review efficiency

## Relationship to Submission API

This endpoint works in conjunction with the user-facing submission API:

1. Users create submissions through the Submission API
2. Administrators view and manage these submissions through this endpoint
3. Status changes made by administrators are reflected in the user's submission view
4. This creates a complete workflow from submission to publication

The admin submission management endpoints provide the critical review and approval process that maintains quality control over user-contributed content.