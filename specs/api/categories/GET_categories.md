# GET /api/sites/[siteSlug]/categories API Testing Specification

## Overview

This endpoint retrieves all categories associated with a specific site identified by its slug. It returns an array of category objects containing their hierarchical structure and metadata.

## Requirements

### Functional Requirements

1. Retrieve all categories for a given site slug
2. Handle test environment by using appropriate key prefixes
3. Ensure proper error handling for individual category fetch failures
4. Sort categories in a logical order (e.g., by the `order` field)
5. Include category hierarchy information through the `parentId` field

### Security Requirements

1. Validate site exists before attempting to fetch categories
2. Implement proper tenant isolation for admin access
3. Provide appropriate public access for frontend rendering

### Performance Requirements

1. Response time should be < 300ms for up to 100 categories
2. Implement resilient fetching that doesn't fail entirely if one category is corrupted
3. Use efficient Redis key patterns for retrieving site-specific categories

## API Specification

### Request

- Method: GET
- Path: /api/sites/{siteSlug}/categories
- Headers:
  - Authorization: Bearer {JWT token} (optional for public access)
  - X-Tenant-ID: {tenant ID} (optional for public access)

### Response

#### Success (200 OK)

```json
[
  {
    "id": "category_1234567890",
    "siteId": "site_1234567890",
    "name": "Fishing Rods",
    "slug": "fishing-rods",
    "metaDescription": "Reviews of the best fishing rods for all types of fishing",
    "parentId": null,
    "order": 1,
    "createdAt": 1615482366000,
    "updatedAt": 1632145677000
  },
  {
    "id": "category_2345678901",
    "siteId": "site_1234567890",
    "name": "Spinning Rods",
    "slug": "spinning-rods",
    "metaDescription": "Reviews of spinning rods for all fishing conditions",
    "parentId": "category_1234567890",
    "order": 2,
    "createdAt": 1615482366000,
    "updatedAt": 1632145677000
  }
]
```

#### No Categories Found (200 OK with empty array)

```json
[]
```

#### Site Not Found (404 Not Found)

```json
{
  "error": "Site not found"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to fetch categories"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve categories for a site with multiple categories**
   - Expected: 200 OK with array of categories
   - Test: Create site with multiple categories, send GET request, verify response contains all categories

2. **Retrieve categories for a site with no categories**
   - Expected: 200 OK with empty array
   - Test: Create site with no categories, send GET request, verify empty array response

3. **Retrieve hierarchical categories**
   - Expected: 200 OK with array including parent-child relationships
   - Test: Create site with nested categories, send GET request, verify parent-child relationships are preserved

### Data Integrity Scenarios

1. **Handle corrupted category data**
   - Expected: 200 OK with array of valid categories (corrupted categories excluded)
   - Test: Seed Redis with mix of valid and invalid category data, verify only valid categories returned

2. **Handle Redis connection issues**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis connection failure, verify 500 response

### Error Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent site slug, verify 404 response

2. **Invalid site data in Redis**
   - Expected: 404 Not Found
   - Test: Mock Redis to return invalid site JSON, verify 404 response

### Test Environment Scenarios

1. **Test environment key prefixing**
   - Expected: 200 OK when test prefix is used in test environment
   - Test: In test environment, mock Redis to return data for "test:site:slug:{slug}" and "test:category:site:{siteId}:*", verify 200 response with categories

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios
- Test both success and error paths for category retrieval
- Implement tenant isolation test utilities if needed for authorized access
- Create test fixtures for hierarchical category structures to validate parent-child relationships
