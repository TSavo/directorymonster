# GET /api/admin/sites API Specification

## Overview

This endpoint allows administrators to retrieve a list of all sites within their tenant. It provides comprehensive site information for management and administration purposes.

## Requirements

### Functional Requirements

1. Return a list of all sites within the tenant with filtering options
2. Support filtering by status, creation date, and other attributes
3. Support sorting by various fields (name, creation date, etc.)
4. Support pagination for efficient handling of large site volumes
5. Include site statistics and usage information
6. Support search functionality for finding specific sites

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for site management
4. Log access for audit purposes
5. Implement rate limiting to prevent abuse

### Performance Requirements

1. Response time should be < 500ms for typical requests
2. Handle large site volumes efficiently
3. Implement proper caching for repeated queries
4. Optimize database queries for performance

## API Specification

### Request

- Method: GET
- Path: /api/admin/sites
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `status`: (string, optional) - Filter by site status (active, inactive, archived)
  - `fromDate`: (ISO date string, optional) - Filter sites created after this date
  - `toDate`: (ISO date string, optional) - Filter sites created before this date
  - `search`: (string, optional) - Search term for site name or domain
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `limit`: (number, optional, default: 20) - Results per page
  - `sort`: (string, optional, default: 'createdAt') - Field to sort by
  - `order`: (string, optional, default: 'desc') - Sort order ('asc' or 'desc')
  - `includeStats`: (boolean, optional, default: false) - Include detailed site statistics

### Response

#### Success (200 OK)

```json
{
  "sites": [
    {
      "id": "site_1234567890",
      "name": "Fishing Gear Reviews",
      "slug": "fishing-gear-reviews",
      "domain": "fishinggearreviews.com",
      "status": "active",
      "createdAt": "2024-01-15T10:35:00Z",
      "updatedAt": "2024-03-20T14:45:30Z",
      "description": "Expert reviews of the best fishing gear and equipment",
      "logo": "https://assets.directorymonster.com/tenants/fishing-gear/logos/main-logo.png",
      "primaryColor": "#0066CC",
      "secondaryColor": "#FFFFFF",
      "settings": {
        "listingsPerPage": 20,
        "showFeaturedListings": true,
        "enableSearch": true,
        "enableSubmissions": true,
        "requireApproval": true,
        "enableComments": false
      },
      "seo": {
        "metaTitle": "Fishing Gear Reviews - Expert Reviews of Fishing Equipment",
        "metaDescription": "Find expert reviews of the best fishing gear and equipment. Trusted recommendations for anglers of all levels.",
        "keywords": ["fishing gear", "fishing equipment", "fishing reviews"],
        "googleAnalyticsId": "UA-12345678-1",
        "sitemapEnabled": true
      },
      "stats": {
        "listingCount": 320,
        "categoryCount": 28,
        "pendingSubmissions": 12,
        "viewsLastMonth": 45600,
        "uniqueVisitorsLastMonth": 12300,
        "averageTimeOnSite": 185, // seconds
        "topCategories": [
          {"name": "Fishing Rods", "count": 85},
          {"name": "Fishing Reels", "count": 72},
          {"name": "Fishing Lures", "count": 65}
        ]
      }
    },
    {
      "id": "site_2345678901",
      "name": "Fishing Equipment Deals",
      "slug": "fishing-equipment-deals",
      "domain": "fishingequipmentdeals.com",
      "status": "active",
      "createdAt": "2024-02-10T09:20:15Z",
      "updatedAt": "2024-03-15T11:30:45Z",
      "description": "The best deals on fishing equipment and gear",
      "logo": "https://assets.directorymonster.com/tenants/fishing-gear/logos/deals-logo.png",
      "primaryColor": "#FF6600",
      "secondaryColor": "#FFFFFF",
      "settings": {
        "listingsPerPage": 30,
        "showFeaturedListings": true,
        "enableSearch": true,
        "enableSubmissions": true,
        "requireApproval": true,
        "enableComments": true
      },
      "seo": {
        "metaTitle": "Fishing Equipment Deals - Best Prices on Fishing Gear",
        "metaDescription": "Find the best deals on fishing equipment and gear. Save money on top brands and quality products.",
        "keywords": ["fishing deals", "fishing equipment", "fishing gear sales"],
        "googleAnalyticsId": "UA-87654321-1",
        "sitemapEnabled": true
      },
      "stats": {
        "listingCount": 227,
        "categoryCount": 17,
        "pendingSubmissions": 8,
        "viewsLastMonth": 32400,
        "uniqueVisitorsLastMonth": 9800,
        "averageTimeOnSite": 210, // seconds
        "topCategories": [
          {"name": "Fishing Rods", "count": 62},
          {"name": "Fishing Reels", "count": 55},
          {"name": "Tackle Boxes", "count": 38}
        ]
      }
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "pages": 1
  },
  "stats": {
    "active": 3,
    "inactive": 0,
    "archived": 0,
    "totalSites": 3,
    "totalListings": 547,
    "totalCategories": 45,
    "totalPendingSubmissions": 20
  }
}
```

#### No Sites Found (200 OK with empty array)

```json
{
  "sites": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "pages": 0
  },
  "stats": {
    "active": 0,
    "inactive": 0,
    "archived": 0,
    "totalSites": 0,
    "totalListings": 0,
    "totalCategories": 0,
    "totalPendingSubmissions": 0
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
  "error": "Insufficient permissions to access sites"
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
  "error": "Failed to retrieve sites"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all sites**
   - Expected: 200 OK with array of sites
   - Test: Send request with valid admin JWT and tenant ID, verify response contains sites

2. **Filter by status**
   - Expected: 200 OK with filtered sites
   - Test: Send request with status=active, verify only active sites returned

3. **Search sites**
   - Expected: 200 OK with search results
   - Test: Send request with search term, verify matching sites returned

4. **Include detailed statistics**
   - Expected: 200 OK with detailed stats
   - Test: Send request with includeStats=true, verify detailed statistics included

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Non-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with non-admin JWT, verify 403 response

3. **Admin from different tenant**
   - Expected: Empty results or 403 Forbidden
   - Test: Send request with admin JWT but for different tenant, verify proper tenant isolation

### Edge Case Scenarios

1. **Invalid filter parameters**
   - Expected: 400 Bad Request
   - Test: Send request with invalid filter values, verify appropriate error response

2. **Tenant with no sites**
   - Expected: 200 OK with empty array
   - Test: Use tenant with no sites, verify empty array response

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use Redis for caching frequently accessed site lists
- Consider implementing a site search index for efficient searching
- Add appropriate logging for security and audit purposes
- Optimize database queries for performance with large site volumes
- Implement proper error handling with meaningful messages
- Consider adding analytics for site performance and usage patterns
- Ensure sensitive site information is properly protected

## Site Status Types

1. **active**: Site is live and accessible to users
2. **inactive**: Site is temporarily disabled but not deleted
3. **archived**: Site has been archived (not deleted but no longer active)

## Relationship to Tenant Management

This endpoint works in conjunction with tenant management:

1. Each tenant can have multiple sites
2. Sites are isolated within their tenant context
3. Site management is performed within the tenant's administrative scope
4. Site statistics contribute to overall tenant usage metrics

The site management endpoints enable administrators to create and manage multiple directory sites within their tenant, each with its own configuration, appearance, and content.