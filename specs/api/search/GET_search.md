# GET /api/search API Testing Specification

## Overview

This endpoint provides search functionality for listings within a site. It supports filtering by categories, featured status, and listing status, as well as pagination and sorting options.

## Requirements

### Functional Requirements

1. Search listings based on text query and/or filters
2. Support filtering by category ID, featured status, and listing status
3. Implement pagination with configurable page size
4. Sort results by relevance or other criteria
5. Return comprehensive result object with pagination metadata

### Security Requirements

1. Validate input parameters to prevent injection attacks
2. Implement proper error handling for invalid inputs
3. Ensure cross-tenant isolation (results only from specified site)

### Performance Requirements

1. Response time should be < 500ms for typical queries
2. Efficiently handle pagination for large result sets
3. Optimize search indexing for quick retrieval

## API Specification

### Request

- Method: GET
- Path: /api/search
- Query Parameters:
  - `q`: (string, optional) - The search query
  - `siteId`: (string, required) - The ID of the site to search within
  - `categoryId`: (string, optional) - Filter by specific category
  - `featured`: (boolean, optional) - Filter for featured listings only
  - `status`: (string, optional) - Filter by listing status
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `perPage`: (number, optional, default: 20) - Results per page
  - `sortBy`: (string, optional, default: 'relevance') - Sorting criteria

### Response

#### Success (200 OK)

```json
{
  "results": [
    {
      "id": "listing_1234567890",
      "title": "Shimano Stradic FL Spinning Reel Review",
      "slug": "shimano-stradic-fl-spinning-reel-review",
      "excerpt": "The Shimano Stradic FL spinning reel offers exceptional performance...",
      "categoryId": "category_123456",
      "categoryName": "Fishing Reels",
      "featured": true,
      "createdAt": 1615482366000,
      "score": 0.95
    },
    {
      "id": "listing_2345678901",
      "title": "Best Spinning Reels of 2024",
      "slug": "best-spinning-reels-2024",
      "excerpt": "Our comprehensive guide to the best spinning reels of 2024...",
      "categoryId": "category_123456",
      "categoryName": "Fishing Reels",
      "featured": false,
      "createdAt": 1625482366000,
      "score": 0.82
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalResults": 42,
    "totalPages": 3
  },
  "query": "spinning reel",
  "filters": {
    "categoryId": "category_123456",
    "featured": true,
    "status": "published"
  }
}
```

#### Missing Site ID (400 Bad Request)

```json
{
  "error": "Missing site ID"
}
```

#### Missing Search Query or Filters (400 Bad Request)

```json
{
  "error": "Missing search query or filters"
}
```

#### Search Query Too Short (400 Bad Request)

```json
{
  "error": "Search query too short"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Search failed"
}
```

## Testing Scenarios

### Success Scenarios

1. **Text search with results**
   - Expected: 200 OK with matching results
   - Test: Search with query that matches existing listings
   - Validation: Verify results contain expected matches and pagination info

2. **Filter by category**
   - Expected: 200 OK with category-filtered results
   - Test: Search with categoryId parameter
   - Validation: Verify all results belong to specified category

3. **Filter for featured listings**
   - Expected: 200 OK with featured listings only
   - Test: Search with featured=true parameter
   - Validation: Verify all results have featured=true

4. **Combination of query and filters**
   - Expected: 200 OK with results matching all criteria
   - Test: Search with query AND category AND featured parameters
   - Validation: Verify results match all specified criteria

5. **Pagination handling**
   - Expected: 200 OK with paginated results
   - Test: Request specific page and perPage values
   - Validation: Verify pagination metadata matches expected values

6. **Sort order customization**
   - Expected: 200 OK with results in specified order
   - Test: Search with different sortBy values
   - Validation: Verify results are ordered according to the sort criteria

### Edge Case Scenarios

1. **Search with no results**
   - Expected: 200 OK with empty results array
   - Test: Search with query that doesn't match any listings
   - Validation: Verify empty results array and zero counts in pagination

2. **Search first and last pages**
   - Expected: 200 OK with correct results for each page
   - Test: Search with pagination to get first and last pages
   - Validation: Verify both pages return expected results

3. **Very large perPage parameter**
   - Expected: 200 OK with all results (up to reasonable limit)
   - Test: Search with very large perPage value
   - Validation: Verify response handles large page size appropriately

### Error Scenarios

1. **Missing siteId parameter**
   - Expected: 400 Bad Request
   - Test: Search without siteId parameter
   - Validation: Confirm error message is "Missing site ID"

2. **No query or filters provided**
   - Expected: 400 Bad Request
   - Test: Search without query, categoryId, featured, or status
   - Validation: Confirm error message is "Missing search query or filters"

3. **Query too short (terms < 3 characters)**
   - Expected: 400 Bad Request
   - Test: Search with query consisting of very short terms
   - Validation: Confirm error message is "Search query too short"

4. **Invalid pagination parameters**
   - Expected: Default pagination behavior
   - Test: Search with invalid page or perPage values (negative, non-numeric)
   - Validation: Verify defaults are used (page 1, perPage 20)

5. **Indexer failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate search indexer failure
   - Validation: Confirm error message is "Search failed"

## Integration Test Cases

1. **Cross-API workflow: create listing → index → search**
   - Test creating a listing, waiting for indexing, then searching for it
   - Verify search returns newly created listing

2. **Filter by newly created category**
   - Test creating a category, adding listings to it, then filtering by that category
   - Verify only listings in that category are returned

3. **Update listing and verify search results**
   - Test updating a listing's attributes, then searching to verify changes are reflected
   - Verify search results show updated information

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for search indexer to simulate different result scenarios
- Set up test fixtures for listings with searchable content
- Test both direct matches and partial/fuzzy matches
- Create helper utilities to verify result ordering and pagination
- Test different combinations of search parameters
- Verify cross-tenant isolation by creating listings in different sites
