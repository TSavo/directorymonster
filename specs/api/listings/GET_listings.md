# GET /api/sites/[siteSlug]/listings API Testing Specification

## Overview

This endpoint retrieves all listings for a specific site, with support for filtering by category and pagination. It returns an array of listing objects with their associated metadata, along with pagination information.

## Requirements

### Functional Requirements

1. Retrieve all listings for a given site slug
2. Support filtering by category ID
3. Implement pagination with configurable page size
4. Handle test environment by using appropriate key prefixes
5. Parse and validate JSON data from Redis

### Security Requirements

1. Validate site exists before attempting to fetch listings
2. Implement proper tenant isolation
3. Sanitize and validate input parameters

### Performance Requirements

1. Response time should be < 500ms for up to 100 listings
2. Implement resilient fetching that doesn't fail if one listing is corrupted
3. Optimize pagination for large listing sets

## API Specification

### Request

- Method: GET
- Path: /api/sites/{siteSlug}/listings
- Query Parameters:
  - `categoryId`: (string, optional) - Filter listings by category
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `limit`: (number, optional, default: 10) - Results per page

### Response

#### Success (200 OK)

```json
{
  "results": [
    {
      "id": "listing_1234567890",
      "siteId": "site_1234567890",
      "categoryId": "category_123456",
      "title": "Shimano Stradic FL Spinning Reel Review",
      "slug": "shimano-stradic-fl-spinning-reel-review",
      "metaDescription": "In-depth review of the Shimano Stradic FL spinning reel",
      "content": "The Shimano Stradic FL spinning reel offers exceptional performance...",
      "imageUrl": "https://example.com/images/shimano-stradic.jpg",
      "backlinkUrl": "https://fishingprostore.com/products/shimano-stradic",
      "backlinkAnchorText": "Shimano Stradic FL Spinning Reel",
      "backlinkPosition": "prominent",
      "backlinkType": "dofollow",
      "customFields": {
        "product_name": "Shimano Stradic FL Spinning Reel",
        "brand": "Shimano",
        "rating": 4.8
      },
      "createdAt": 1615482366000,
      "updatedAt": 1632145677000
    }
  ],
  "pagination": {
    "totalResults": 42,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 10
  }
}
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
  "error": "Failed to fetch listings"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all listings for a site**
   - Expected: 200 OK with array of listings
   - Test: Create site with multiple listings, send GET request, verify response
   - Validation: Check listings belong to site and pagination metadata is correct

2. **Filter listings by category**
   - Expected: 200 OK with filtered listings
   - Test: Create listings in different categories, filter by one category
   - Validation: Verify only listings from specified category are returned

3. **Pagination with default parameters**
   - Expected: 200 OK with first page results
   - Test: Create more than 10 listings, request without page/limit params
   - Validation: Verify first 10 listings returned with correct pagination info

4. **Pagination with custom parameters**
   - Expected: 200 OK with requested page/limit
   - Test: Create many listings, request specific page and limit
   - Validation: Verify correct slice of listings returned with updated pagination info

5. **Empty site (no listings)**
   - Expected: 200 OK with empty results array
   - Test: Create site without listings, send GET request
   - Validation: Verify empty results array and zero counts in pagination

### Data Integrity Scenarios

1. **Handle corrupted listing data**
   - Expected: 200 OK with valid listings only
   - Test: Seed Redis with mix of valid and invalid listing data
   - Validation: Verify only valid listings returned, corrupt ones skipped

2. **Parse stringified JSON listings**
   - Expected: 200 OK with properly parsed listings
   - Test: Seed Redis with stringified JSON listings
   - Validation: Verify listings are properly parsed and returned

3. **Missing siteId in listings**
   - Expected: 200 OK with siteId automatically added
   - Test: Seed Redis with listings missing siteId
   - Validation: Verify returned listings have siteId field added

### Error Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent site slug
   - Validation: Confirm error message is "Site not found"

2. **Redis connection failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis connection failure
   - Validation: Confirm error message is "Failed to fetch listings"

3. **Invalid pagination parameters**
   - Expected: Default to page 1, limit 10
   - Test: Send request with invalid page/limit values (negative, non-numeric)
   - Validation: Verify default pagination values used

### Test Environment Scenarios

1. **Test environment key prefixing**
   - Expected: 200 OK using test prefixed keys
   - Test: In test environment, verify "test:" prefix used for Redis keys
   - Validation: Check that keys use correct prefix based on environment

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios
- Set up test fixtures with various listing combinations
- Test both direct Redis objects and stringified JSON responses
- Implement helper methods to verify pagination logic
- Create specific test cases for category filtering
- Test edge cases with missing or corrupted data
