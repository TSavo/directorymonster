# GET /api/sites/[siteSlug]/categories/[categoryId] API Testing Specification

## Overview

This endpoint retrieves detailed information about a specific category identified by its ID within a particular site. It returns the complete category object if the category exists, belongs to the specified site, and the user has access to it.

## Requirements

### Functional Requirements

1. Retrieve a single category by ID
2. Validate the category belongs to the specified site
3. Return complete category data
4. Properly handle non-existent categories or sites

### Security Requirements

1. Implement tenant isolation (for administrative access)
2. Validate site exists before attempting to fetch category
3. Verify category belongs to the specified site

## API Specification

### Request

- Method: GET
- Path: /api/sites/{siteSlug}/categories/{categoryId}
- Headers:
  - Authorization: Bearer {JWT token} (optional for public access)
  - X-Tenant-ID: {tenant ID} (optional for public access)

### Response

#### Success (200 OK)

```json
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
}
```

#### Site Not Found (404 Not Found)

```json
{
  "error": "Site not found"
}
```

#### Category Not Found (404 Not Found)

```json
{
  "error": "Category not found"
}
```

#### Category Not in Site (404 Not Found)

```json
{
  "error": "Category not found in this site"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to fetch category"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve existing category by ID**
   - Expected: 200 OK with category object
   - Test: Create site and category, send GET request, verify response contains full category details
   - Validation: Check all properties match expected values (id, name, slug, etc.)

2. **Retrieve child category that references parent**
   - Expected: 200 OK with category including parentId
   - Test: Create parent and child categories, fetch child, verify parentId matches parent's ID
   - Validation: Ensure parentId is correctly included and references the parent category

3. **Retrieve category with custom test environment prefix**
   - Expected: 200 OK when test prefix is used in test environment
   - Test: In test environment, mock Redis to return data for "test:category:id:{categoryId}"
   - Validation: Ensure the endpoint correctly uses environment-specific prefixes

### Error Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent site slug, verify 404 response
   - Validation: Confirm error message is "Site not found"

2. **Category not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent category ID, verify 404 response
   - Validation: Confirm error message is "Category not found"

3. **Category exists but belongs to different site**
   - Expected: 404 Not Found with "Category not found in this site" message
   - Test: Create category in site1, attempt to access it through site2's endpoint, verify 404 response
   - Validation: Ensure proper site-category relationship validation

### Data Integrity Scenarios

1. **Handle Redis connection issues**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis connection failure, verify 500 response
   - Validation: Confirm error message is "Failed to fetch category"

2. **Handle corrupted category data in Redis**
   - Expected: Appropriate error response (likely 500)
   - Test: Seed Redis with corrupt category data, verify appropriate error handling
   - Validation: Ensure the API doesn't crash and returns a meaningful error

### Security Scenarios

1. **Tenant isolation (if implementing protection middleware)**
   - Expected: Category not accessible across tenant boundaries
   - Test: Create category in tenant1, attempt to access with tenant2 credentials
   - Validation: Ensure proper tenant isolation according to security model

2. **Public vs. authenticated access (if implemented)**
   - Expected: Behavior consistent with security model
   - Test: Access category with and without authentication
   - Validation: Ensure access control is properly enforced

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data states
- Implement helper functions to create test fixtures for sites and categories
- Test both public and authenticated access patterns if applicable
- Verify Redis key patterns match between test and implementation
- Test all error paths to ensure robust error handling
- Create specific test cases for tenant isolation if implementing multi-tenant security

## Integration Test Cases

1. **Category hierarchy retrieval**
   - Test that a category with parent and child categories properly resolves relationships
   - Verify the parent reference is correct when retrieved

2. **Category used in listings**
   - Test retrieving a category that has associated listings
   - Verify complete category data is returned without modification

3. **End-to-end flow**
   - Test full workflow: create site → create category → retrieve category
   - Verify data consistency throughout the flow
