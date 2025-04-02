# GET /api/admin/listings API Specification

## Overview

This endpoint retrieves a paginated list of listings across all sites within the tenant context of the authenticated administrator. It provides comprehensive filtering, sorting, and search capabilities to facilitate efficient listing management in the admin interface.

## Requirements

### Functional Requirements

1. Return a paginated list of listings based on filter criteria
2. Support filtering by site, category, status, verification status, and featured status
3. Support sorting by various attributes (creation date, title, etc.)
4. Include detailed listing information in the response
5. Support searching across multiple listing fields
6. Include category and site information for each listing

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'listing:read' permission
3. Enforce tenant isolation (administrators can only see listings within their tenant scope)
4. Super admins can see listings across all tenants
5. Sanitize and validate all query parameters
6. Log access for audit purposes

### Performance Requirements

1. Response time should be < 1000ms for typical requests
2. Efficiently handle large listing databases with proper pagination
3. Optimize query performance for filtered results
4. Support caching of commonly accessed listing sets

## API Specification

### Request

- Method: GET
- Path: /api/admin/listings
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `limit`: (number, optional, default: 20) - Results per page
  - `sort`: (string, optional, default: 'createdAt') - Field to sort by
  - `order`: (string, optional, default: 'desc') - Sort order ('asc' or 'desc')
  - `siteId`: (string, optional) - Filter by specific site ID
  - `siteSlug`: (string, optional) - Filter by site slug
  - `categoryId`: (string, optional) - Filter by category ID
  - `status`: (string, optional) - Filter by status (published, draft, pending, rejected)
  - `featured`: (boolean, optional) - Filter by featured status
  - `verified`: (boolean, optional) - Filter by verification status
  - `hasBacklink`: (boolean, optional) - Filter by backlink presence
  - `q`: (string, optional) - Search query across listing fields
  - `createdAfter`: (string, optional) - ISO date string for filtering by creation date
  - `createdBefore`: (string, optional) - ISO date string for filtering by creation date
  - `updatedAfter`: (string, optional) - ISO date string for filtering by update date
  - `updatedBefore`: (string, optional) - ISO date string for filtering by update date

### Response

#### Success (200 OK)

```json
{
  "listings": [
    {
      "id": "listing_1234567890",
      "title": "Premium Fishing Rod with Carbon Fiber Construction",
      "slug": "premium-fishing-rod",
      "description": "Professional grade fishing rod with high tensile strength carbon fiber construction.",
      "status": "published",
      "featured": true,
      "verified": true,
      "url": "https://example.com/fishing-rod",
      "backlinkUrl": "https://example.com/fishing-rod/reviews",
      "backlinkVerified": true,
      "backlinkVerifiedAt": "2025-03-15T10:30:45Z",
      "expiresAt": "2026-04-01T00:00:00Z",
      "customFields": {
        "brand": "FisherPro",
        "price": 199.99,
        "rating": 4.8,
        "weight": "8.5oz"
      },
      "site": {
        "id": "site_5678",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear"
      },
      "category": {
        "id": "category_9012",
        "name": "Fishing Rods",
        "slug": "fishing-rods"
      },
      "submittedBy": {
        "id": "user_3456",
        "username": "fisher_merchant",
        "email": "merchant@example.com"
      },
      "createdAt": "2025-01-15T08:30:00Z",
      "updatedAt": "2025-03-20T14:45:12Z"
    },
    {
      "id": "listing_0987654321",
      "title": "Ultralight Backpacking Tent",
      "slug": "ultralight-backpacking-tent",
      "description": "Two-person tent weighing only 2.5 pounds, perfect for long backpacking trips.",
      "status": "published",
      "featured": false,
      "verified": true,
      "url": "https://example.com/tents/ultralight",
      "backlinkUrl": "https://example.com/tents/reviews/fishing-directory",
      "backlinkVerified": true,
      "backlinkVerifiedAt": "2025-02-20T09:15:30Z",
      "expiresAt": "2026-02-20T00:00:00Z",
      "customFields": {
        "brand": "TrailBlazer",
        "price": 349.99,
        "weight": "2.5lbs",
        "capacity": 2,
        "rating": 4.5
      },
      "site": {
        "id": "site_1234",
        "name": "Camping Equipment Reviews",
        "slug": "camping-equipment"
      },
      "category": {
        "id": "category_5678",
        "name": "Tents",
        "slug": "tents"
      },
      "submittedBy": {
        "id": "user_9012",
        "username": "outdoor_store",
        "email": "store@example.com"
      },
      "createdAt": "2024-12-10T11:20:00Z",
      "updatedAt": "2025-02-20T09:15:30Z"
    }
  ],
  "pagination": {
    "total": 1245,
    "page": 1,
    "limit": 20,
    "pages": 63
  },
  "filters": {
    "sites": [
      { "id": "site_5678", "name": "Fishing Gear Reviews", "count": 430 },
      { "id": "site_1234", "name": "Camping Equipment Reviews", "count": 325 },
      { "id": "site_9012", "name": "Hiking Accessories", "count": 490 }
    ],
    "statuses": [
      { "status": "published", "count": 1042 },
      { "status": "draft", "count": 158 },
      { "status": "pending", "count": 35 },
      { "status": "rejected", "count": 10 }
    ]
  }
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "param": "limit",
      "message": "Limit must be between 1 and 100"
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

#### Forbidden (403 Forbidden)

```json
{
  "error": "Insufficient permissions to access listings"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve listings"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve default listings (first page)**
   - Expected: 200 OK with first page of listings (20 items)
   - Test: Send request with valid JWT for admin
   - Validation: Verify response contains listings array and pagination data

2. **Pagination works correctly**
   - Expected: 200 OK with specified page of listings
   - Test: Send request with page=2&limit=10
   - Validation: Verify response contains correct page and limit in pagination

3. **Filter by site**
   - Expected: 200 OK with filtered list
   - Test: Send request with siteId parameter
   - Validation: Verify all listings in response belong to specified site

4. **Filter by status**
   - Expected: 200 OK with filtered list
   - Test: Send request with status=published
   - Validation: Verify all listings have published status

5. **Filter by featured status**
   - Expected: 200 OK with filtered list
   - Test: Send request with featured=true
   - Validation: Verify all listings are featured

6. **Filter by verification status**
   - Expected: 200 OK with filtered list
   - Test: Send request with verified=true
   - Validation: Verify all listings have been verified

7. **Search functionality**
   - Expected: 200 OK with search results
   - Test: Send request with q=fishing
   - Validation: Verify results contain "fishing" in relevant fields

8. **Date range filtering**
   - Expected: 200 OK with filtered list
   - Test: Send request with createdAfter and createdBefore parameters
   - Validation: Verify all listings were created within specified date range

9. **Multiple filters combined**
   - Expected: 200 OK with filtered list
   - Test: Send request with site, category, and status filters
   - Validation: Verify response satisfies all filter criteria

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 200 OK with listings only from admin's tenant
   - Test: Send request as site admin
   - Validation: Verify all listings belong to sites within admin's tenant

3. **Super admin cross-tenant view**
   - Expected: 200 OK with listings from all tenants
   - Test: Send request as super admin
   - Validation: Verify listings from multiple tenants are included

4. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Edge Case Scenarios

1. **No listings match filters**
   - Expected: 200 OK with empty listings array
   - Test: Send request with filters that match no listings
   - Validation: Verify response has empty listings array and pagination showing total=0

2. **Invalid date range**
   - Expected: 400 Bad Request
   - Test: Send request with createdBefore earlier than createdAfter
   - Validation: Verify appropriate error message

3. **Request for non-existent site's listings**
   - Expected: 200 OK with empty listings array
   - Test: Request listings for non-existent siteId
   - Validation: Verify empty listings array

## Implementation Notes

- Implement efficient filter chain processing for multiple filter combinations
- Use Redis for caching common listing queries with appropriate invalidation
- Implement proper indexing for fields commonly used in filtering
- Apply tenant-specific key prefixing for proper isolation
- Use database joins efficiently to reduce query count
- Implement proper search indexing for text search capabilities
- Consider implementing faceted search for advanced filtering
- Add proper logging for audit purposes and performance monitoring
- Ensure custom fields are handled efficiently in search and filter operations
- Support incremental loading patterns for frontend interfaces