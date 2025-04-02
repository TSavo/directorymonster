# GET /api/admin/categories API Specification

## Overview

This endpoint retrieves a hierarchical list of categories across all sites within the tenant context of the authenticated administrator. It supports the admin interface for category management, providing a tree structure that maintains parent-child relationships.

## Requirements

### Functional Requirements

1. Return a hierarchical tree of categories based on filter criteria
2. Support filtering by site
3. Include parent-child relationships in the response
4. Support different tree formats (flat or nested)
5. Include category metadata such as listing counts and SEO information
6. Support sorting by various attributes (order, name, creation date)

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'category:read' permission
3. Enforce tenant isolation (administrators can only see categories within their tenant scope)
4. Super admins can see categories across all tenants
5. Sanitize and validate all query parameters
6. Log access for audit purposes

### Performance Requirements

1. Response time should be < 500ms for typical requests
2. Efficiently handle large category hierarchies with proper tree traversal
3. Optimize query performance for filtered results
4. Cache category trees for improved performance

## API Specification

### Request

- Method: GET
- Path: /api/admin/categories
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `siteId`: (string, optional) - Filter by specific site ID
  - `siteSlug`: (string, optional) - Filter by site slug
  - `format`: (string, optional, default: 'nested') - Response format ('nested' or 'flat')
  - `includeEmpty`: (boolean, optional, default: true) - Include categories with no listings
  - `sort`: (string, optional, default: 'order') - Field to sort by ('order', 'name', 'createdAt')
  - `order`: (string, optional, default: 'asc') - Sort order ('asc' or 'desc')
  - `includeStats`: (boolean, optional, default: true) - Include category statistics

### Response

#### Success (200 OK) - Nested Format

```json
{
  "categories": [
    {
      "id": "category_1234567890",
      "name": "Fishing Gear",
      "slug": "fishing-gear",
      "description": "All fishing equipment and accessories",
      "order": 1,
      "metaTitle": "Fishing Gear and Equipment Directory",
      "metaDescription": "Find the best fishing gear and equipment",
      "listingCount": 145,
      "site": {
        "id": "site_5678",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear"
      },
      "createdAt": "2024-06-15T10:30:00Z",
      "updatedAt": "2025-03-10T14:25:30Z",
      "children": [
        {
          "id": "category_2345678901",
          "name": "Fishing Rods",
          "slug": "fishing-rods",
          "description": "All types of fishing rods",
          "order": 1,
          "metaTitle": "Fishing Rods Directory",
          "metaDescription": "Find the best fishing rods for any situation",
          "listingCount": 45,
          "site": {
            "id": "site_5678",
            "name": "Fishing Gear Reviews",
            "slug": "fishing-gear"
          },
          "createdAt": "2024-06-16T09:15:00Z",
          "updatedAt": "2025-02-20T11:30:25Z",
          "children": []
        },
        {
          "id": "category_3456789012",
          "name": "Fishing Reels",
          "slug": "fishing-reels",
          "description": "All types of fishing reels",
          "order": 2,
          "metaTitle": "Fishing Reels Directory",
          "metaDescription": "Find the best fishing reels for any situation",
          "listingCount": 52,
          "site": {
            "id": "site_5678",
            "name": "Fishing Gear Reviews",
            "slug": "fishing-gear"
          },
          "createdAt": "2024-06-16T10:20:00Z",
          "updatedAt": "2025-01-15T08:45:10Z",
          "children": []
        },
        {
          "id": "category_4567890123",
          "name": "Fishing Line",
          "slug": "fishing-line",
          "description": "All types of fishing line",
          "order": 3,
          "metaTitle": "Fishing Line Directory",
          "metaDescription": "Find the best fishing line for any situation",
          "listingCount": 38,
          "site": {
            "id": "site_5678",
            "name": "Fishing Gear Reviews",
            "slug": "fishing-gear"
          },
          "createdAt": "2024-06-17T11:10:00Z",
          "updatedAt": "2025-02-05T15:20:40Z",
          "children": []
        }
      ]
    },
    {
      "id": "category_5678901234",
      "name": "Camping Equipment",
      "slug": "camping-equipment",
      "description": "All camping gear and equipment",
      "order": 2,
      "metaTitle": "Camping Equipment Directory",
      "metaDescription": "Find the best camping gear and equipment",
      "listingCount": 102,
      "site": {
        "id": "site_1234",
        "name": "Camping Equipment Reviews",
        "slug": "camping-equipment"
      },
      "createdAt": "2024-07-05T08:30:00Z",
      "updatedAt": "2025-02-28T09:15:20Z",
      "children": [
        {
          "id": "category_6789012345",
          "name": "Tents",
          "slug": "tents",
          "description": "All types of camping tents",
          "order": 1,
          "metaTitle": "Camping Tents Directory",
          "metaDescription": "Find the best camping tents for any situation",
          "listingCount": 36,
          "site": {
            "id": "site_1234",
            "name": "Camping Equipment Reviews",
            "slug": "camping-equipment"
          },
          "createdAt": "2024-07-06T09:45:00Z",
          "updatedAt": "2025-01-05T12:10:15Z",
          "children": []
        },
        {
          "id": "category_7890123456",
          "name": "Sleeping Bags",
          "slug": "sleeping-bags",
          "description": "All types of sleeping bags",
          "order": 2,
          "metaTitle": "Sleeping Bags Directory",
          "metaDescription": "Find the best sleeping bags for any situation",
          "listingCount": 28,
          "site": {
            "id": "site_1234",
            "name": "Camping Equipment Reviews",
            "slug": "camping-equipment"
          },
          "createdAt": "2024-07-06T10:30:00Z",
          "updatedAt": "2025-03-01T14:25:30Z",
          "children": []
        }
      ]
    }
  ],
  "stats": {
    "totalCategories": 7,
    "topLevelCategories": 2,
    "totalListings": 247,
    "maxDepth": 2
  }
}
```

#### Success (200 OK) - Flat Format

```json
{
  "categories": [
    {
      "id": "category_1234567890",
      "name": "Fishing Gear",
      "slug": "fishing-gear",
      "description": "All fishing equipment and accessories",
      "order": 1,
      "metaTitle": "Fishing Gear and Equipment Directory",
      "metaDescription": "Find the best fishing gear and equipment",
      "listingCount": 145,
      "site": {
        "id": "site_5678",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear"
      },
      "parentId": null,
      "level": 0,
      "createdAt": "2024-06-15T10:30:00Z",
      "updatedAt": "2025-03-10T14:25:30Z"
    },
    {
      "id": "category_2345678901",
      "name": "Fishing Rods",
      "slug": "fishing-rods",
      "description": "All types of fishing rods",
      "order": 1,
      "metaTitle": "Fishing Rods Directory",
      "metaDescription": "Find the best fishing rods for any situation",
      "listingCount": 45,
      "site": {
        "id": "site_5678",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear"
      },
      "parentId": "category_1234567890",
      "level": 1,
      "createdAt": "2024-06-16T09:15:00Z",
      "updatedAt": "2025-02-20T11:30:25Z"
    },
    {
      "id": "category_3456789012",
      "name": "Fishing Reels",
      "slug": "fishing-reels",
      "description": "All types of fishing reels",
      "order": 2,
      "metaTitle": "Fishing Reels Directory",
      "metaDescription": "Find the best fishing reels for any situation",
      "listingCount": 52,
      "site": {
        "id": "site_5678",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear"
      },
      "parentId": "category_1234567890",
      "level": 1,
      "createdAt": "2024-06-16T10:20:00Z",
      "updatedAt": "2025-01-15T08:45:10Z"
    },
    {
      "id": "category_4567890123",
      "name": "Fishing Line",
      "slug": "fishing-line",
      "description": "All types of fishing line",
      "order": 3,
      "metaTitle": "Fishing Line Directory",
      "metaDescription": "Find the best fishing line for any situation",
      "listingCount": 38,
      "site": {
        "id": "site_5678",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear"
      },
      "parentId": "category_1234567890",
      "level": 1,
      "createdAt": "2024-06-17T11:10:00Z",
      "updatedAt": "2025-02-05T15:20:40Z"
    }
  ],
  "stats": {
    "totalCategories": 7,
    "topLevelCategories": 2,
    "totalListings": 247,
    "maxDepth": 2
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
  "error": "Insufficient permissions to access categories"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "param": "format",
      "message": "Format must be either 'nested' or 'flat'"
    }
  ]
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve categories"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all categories (nested format)**
   - Expected: 200 OK with nested category tree
   - Test: Send request with valid JWT for admin
   - Validation: Verify response contains categories in a properly nested structure

2. **Retrieve all categories (flat format)**
   - Expected: 200 OK with flat category array
   - Test: Send request with format=flat
   - Validation: Verify response contains categories in a flat array with level and parentId fields

3. **Filter by site**
   - Expected: 200 OK with filtered categories
   - Test: Send request with siteId parameter
   - Validation: Verify all categories in response belong to specified site

4. **Sort by different attributes**
   - Expected: 200 OK with sorted results
   - Test: Send request with sort=name
   - Validation: Verify categories are sorted by name

5. **Exclude empty categories**
   - Expected: 200 OK with non-empty categories only
   - Test: Send request with includeEmpty=false
   - Validation: Verify all returned categories have listingCount > 0

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 200 OK with categories only from admin's tenant
   - Test: Send request as site admin
   - Validation: Verify all categories belong to sites within admin's tenant

3. **Super admin cross-tenant view**
   - Expected: 200 OK with categories from all tenants
   - Test: Send request as super admin
   - Validation: Verify categories from multiple tenants are included

4. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Edge Case Scenarios

1. **No categories match filters**
   - Expected: 200 OK with empty categories array
   - Test: Send request with filters that match no categories
   - Validation: Verify response has empty categories array

2. **Deep category nesting**
   - Expected: 200 OK with deeply nested structure
   - Test: Create categories with deep nesting and request them
   - Validation: Verify response correctly represents the deep hierarchy

3. **Circular reference prevention**
   - Expected: 200 OK with proper hierarchy (no infinite loops)
   - Test: Attempt to create circular references in test data and request them
   - Validation: Verify system handles potential circular references properly

## Implementation Notes

- Use efficient tree-building algorithms for nested structures
- Implement proper caching of category trees with appropriate invalidation
- Use materialized paths or nested sets pattern for efficient hierarchy querying
- Apply tenant-specific key prefixing for proper isolation
- Optimize database queries to reduce tree construction overhead
- Consider implementing path-based querying for large hierarchies
- Add proper logging for audit purposes
- Include breadcrumb information in flat format for UI convenience
- Implement proper handling of orphaned categories
- Ensure proper indexing of sort fields for optimal performance