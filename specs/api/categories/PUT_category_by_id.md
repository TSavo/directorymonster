# PUT /api/sites/[siteSlug]/categories/[categoryId] API Testing Specification

## Overview

This endpoint updates an existing category identified by its ID within a specific site. It validates the updated data, checks for conflicts, and ensures category hierarchy integrity.

## Requirements

### Functional Requirements

1. Update an existing category's information (name, description, etc.)
2. Generate a new slug if name has changed and no slug is provided
3. Check for slug uniqueness when slug changes
4. Validate hierarchical relationships to prevent circular references
5. Maintain proper Redis key associations
6. Return the updated category object

### Security Requirements

1. Implement tenant isolation (for administrative access)
2. Validate site and category exist before attempting updates
3. Verify category belongs to the specified site
4. Sanitize input data to prevent injection attacks

### Performance Requirements

1. Response time should be < 500ms
2. Use Redis transactions for atomicity
3. Implement proper error handling for edge cases

## API Specification

### Request

- Method: PUT
- Path: /api/sites/{siteSlug}/categories/{categoryId}
- Headers:
  - Authorization: Bearer {JWT token} (if implementing protection)
  - X-Tenant-ID: {tenant ID} (if implementing protection)
  - Content-Type: application/json
- Body:
  ```json
  {
    "name": "Updated Fishing Rods",
    "metaDescription": "Updated reviews of the best fishing rods for all types of fishing",
    "parentId": "category_2345678901",
    "order": 2,
    "slug": "updated-fishing-rods" // Optional
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "id": "category_1234567890",
  "siteId": "site_1234567890",
  "name": "Updated Fishing Rods",
  "slug": "updated-fishing-rods",
  "metaDescription": "Updated reviews of the best fishing rods for all types of fishing",
  "parentId": "category_2345678901",
  "order": 2,
  "createdAt": 1615482366000,
  "updatedAt": 1632145677000
}
```

#### Bad Request (400 Bad Request)

```json
{
  "error": "Missing required fields"
}
```

Or for circular reference:

```json
{
  "error": "This would create a circular reference in the category hierarchy"
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

Or:

```json
{
  "error": "Category not found"
}
```

Or:

```json
{
  "error": "Parent category not found"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to update category data"
}
```

## Testing Scenarios

### Success Scenarios

1. **Update category basic information**
   - Expected: 200 OK with updated category object
   - Test: Update name and metaDescription, verify response contains updated values
   - Validation: Compare updated fields with submitted values

2. **Update category with slug change**
   - Expected: 200 OK with new slug, old Redis key removed, new Redis key created
   - Test: Change name and slug, verify Redis keys are updated accordingly
   - Validation: Check both Redis keys and returned category object

3. **Update category parent relationship**
   - Expected: 200 OK with updated parentId
   - Test: Create parent category, update child category to reference it
   - Validation: Verify parentId is correctly updated

4. **Auto-generate slug when name changes**
   - Expected: 200 OK with auto-generated slug from new name
   - Test: Change name without providing slug, verify slug is auto-generated
   - Validation: Ensure new slug matches expected format based on new name

### Validation Failure Scenarios

1. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send PUT requests omitting name or metaDescription, verify 400 response
   - Validation: Confirm error message is "Missing required fields"

2. **Duplicate category slug within site**
   - Expected: 409 Conflict
   - Test: Create two categories, update one with the slug of the other
   - Validation: Confirm error message indicates slug conflict

3. **Circular reference in hierarchy**
   - Expected: 400 Bad Request
   - Test: Set a category as its own parent, or create circular reference
   - Validation: Confirm error message refers to circular reference

### Site and Category Validation Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent site slug, verify 404 response
   - Validation: Confirm error message is "Site not found"

2. **Category not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent category ID, verify 404 response
   - Validation: Confirm error message is "Category not found"

3. **Category exists but belongs to different site**
   - Expected: 404 Not Found
   - Test: Create category in site1, attempt to update it through site2's endpoint
   - Validation: Confirm error message indicates category not found in this site

4. **Parent category not found**
   - Expected: 404 Not Found
   - Test: Update category with non-existent parentId
   - Validation: Confirm error message is "Parent category not found"

5. **Parent category from different site**
   - Expected: 400 Bad Request
   - Test: Create categories in different sites, attempt to set cross-site parent relationship
   - Validation: Confirm error message indicates parent not found in this site

### Redis Transaction Scenarios

1. **Successful transaction with slug change**
   - Expected: 200 OK, old slug key deleted, new slug key created
   - Test: Update category slug, verify Redis keys are correctly updated
   - Validation: Check that old slug key is removed and new one created

2. **Redis transaction failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis transaction failure during update
   - Validation: Confirm error message indicates transaction failure

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios and transaction results
- Implement helper methods to verify Redis data after updates
- Create specific test cases for hierarchical relationships
- Test slug generation with various name inputs including special characters
- Verify Redis key management during slug changes
- Test multi-step operations to verify hierarchical integrity
