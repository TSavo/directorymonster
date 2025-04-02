# POST /api/sites/[siteSlug]/categories API Testing Specification

## Overview

This endpoint creates a new category for a specific site. It validates the provided category data, generates a slug if not provided, checks for uniqueness, and saves the category to the database with the appropriate site association.

## Requirements

### Functional Requirements

1. Validate required fields (name, metaDescription)
2. Generate a slug automatically if not provided
3. Ensure slug uniqueness within the site
4. Associate the category with the specified site
5. Support parent-child relationships between categories
6. Auto-assign category order (highest existing order + 1)
7. Return the newly created category object with HTTP 201 status

### Security Requirements

1. Authenticate and authorize user (if implementing protection middleware)
2. Validate site exists and belongs to the user's tenant context
3. Sanitize input data to prevent injection attacks
4. Validate parent category exists and belongs to the same site

### Performance Requirements

1. Response time should be < 500ms
2. Use Redis transactions for atomicity
3. Implement proper error handling

## API Specification

### Request

- Method: POST
- Path: /api/sites/{siteSlug}/categories
- Headers:
  - Authorization: Bearer {JWT token} (if implementing protection)
  - X-Tenant-ID: {tenant ID} (if implementing protection)
  - Content-Type: application/json
- Body:
  ```json
  {
    "name": "Fishing Rods",
    "metaDescription": "Reviews of the best fishing rods for all types of fishing",
    "parentId": null,
    "slug": "fishing-rods" // Optional, will be generated from name if not provided
  }
  ```

### Response

#### Success (201 Created)

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
  "updatedAt": 1615482366000
}
```

#### Bad Request (400 Bad Request)

```json
{
  "error": "Missing required fields"
}
```

#### Conflict (409 Conflict)

```json
{
  "error": "A category with this name or slug already exists"
}
```

#### Not Found (404 Not Found)

```json
{
  "error": "Site not found"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to save category data"
}
```

## Testing Scenarios

### Success Scenarios

1. **Create category with all required fields**
   - Expected: 201 Created with category object
   - Test: Send valid POST request, verify response contains category with ID and timestamps

2. **Create category with auto-generated slug**
   - Expected: 201 Created with slug generated from name
   - Test: Send POST request without slug, verify slug is generated from name

3. **Create child category with valid parentId**
   - Expected: 201 Created with parentId set
   - Test: Create parent category, then create child category with parent's ID, verify parentId in response

4. **Auto-assign correct order value**
   - Expected: 201 Created with order = highest existing order + 1
   - Test: Create multiple categories, verify each new category has incrementing order value

### Validation Failure Scenarios

1. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send POST requests omitting name, then metaDescription, verify 400 response in each case

2. **Duplicate category slug within site**
   - Expected: 409 Conflict
   - Test: Create a category, then attempt to create another with the same slug, verify 409 response

### Site Validation Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent site slug, verify 404 response

### Parent Category Validation Scenarios

1. **Invalid parentId (if implemented)**
   - Expected: 404 Not Found or 400 Bad Request
   - Test: Send request with non-existent parentId, verify appropriate error response

2. **Parent category from different site (if implemented)**
   - Expected: 400 Bad Request
   - Test: Create category in site1, attempt to use as parent for category in site2, verify error

### Error Handling Scenarios

1. **Redis transaction failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis transaction failure, verify 500 response

2. **Malformed request body**
   - Expected: 500 Internal Server Error
   - Test: Send malformed JSON in request body, verify appropriate error response

### Test Environment Scenarios

1. **Test environment key prefixing**
   - Expected: 201 Created with proper test prefixing
   - Test: In test environment, verify "test:" prefix used for Redis keys

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios and transaction failures
- Test category slug generation with various name inputs
- Implement helper methods to verify Redis data after creation
- Create test fixtures for parent-child category testing
