# DELETE /api/sites/[siteSlug]/categories/[categoryId] API Testing Specification

## Overview

This endpoint deletes a specific category identified by its ID within a particular site. It performs validation to ensure data integrity by checking for child categories and associated listings before deleting the category.

## Requirements

### Functional Requirements

1. Delete a category by ID if it has no child categories or associated listings
2. Validate the category belongs to the specified site
3. Ensure proper cleanup of Redis keys
4. Prevent deletion of categories with dependencies

### Security Requirements

1. Implement tenant isolation (for administrative access)
2. Validate site exists before attempting to fetch category
3. Verify category belongs to the specified site
4. Require appropriate permissions to delete categories

### Performance Requirements

1. Response time should be < 500ms
2. Use Redis transactions for atomicity
3. Implement proper error handling

## API Specification

### Request

- Method: DELETE
- Path: /api/sites/{siteSlug}/categories/{categoryId}
- Headers:
  - Authorization: Bearer {JWT token} (if implementing protection)
  - X-Tenant-ID: {tenant ID} (if implementing protection)

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Category deleted successfully"
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

#### Cannot Delete with Child Categories (400 Bad Request)

```json
{
  "error": "Cannot delete a category with child categories",
  "childCategories": [
    { "id": "category_3456789012", "name": "Spinning Rods" },
    { "id": "category_4567890123", "name": "Casting Rods" }
  ]
}
```

#### Cannot Delete with Listings (400 Bad Request)

```json
{
  "error": "Cannot delete a category with associated listings",
  "listingCount": 5
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to delete category"
}
```

## Testing Scenarios

### Success Scenarios

1. **Delete category with no dependencies**
   - Expected: 200 OK with success message
   - Test: Create category with no children or listings, delete it, verify success response
   - Validation: Confirm category no longer exists in Redis, both by ID and slug keys

2. **Delete category and verify Redis cleanup**
   - Expected: 200 OK and all related Redis keys removed
   - Test: Delete category, verify all Redis keys for this category are gone
   - Validation: Check Redis keys for both primary and index patterns

### Dependency Validation Scenarios

1. **Attempt to delete category with child categories**
   - Expected: 400 Bad Request
   - Test: Create parent category with child categories, attempt to delete parent
   - Validation: Confirm error message includes list of child categories

2. **Attempt to delete category with associated listings**
   - Expected: 400 Bad Request
   - Test: Create category with listings, attempt to delete category
   - Validation: Confirm error message includes listing count

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
   - Test: Create category in site1, attempt to delete it through site2's endpoint
   - Validation: Confirm error message indicates category not found in this site

### Redis Transaction Scenarios

1. **Redis transaction failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis transaction failure during deletion
   - Validation: Confirm error message indicates transaction failure and category is not deleted

### Security Scenarios (if implementing protection middleware)

1. **Unauthorized deletion attempt**
   - Expected: 401 Unauthorized or 403 Forbidden
   - Test: Attempt to delete category without proper authentication/authorization
   - Validation: Confirm proper security response based on security model

2. **Cross-tenant deletion attempt**
   - Expected: Category not accessible across tenant boundaries
   - Test: Create category in tenant1, attempt to delete with tenant2 credentials
   - Validation: Ensure proper tenant isolation according to security model

## Integration Test Cases

1. **Category hierarchy preservation**
   - Test deleting a category and verify its parent-child relationships remain intact
   - Create grandparent → parent → child hierarchy, delete parent, verify relationships

2. **Cascading deletion (if implemented)**
   - Test that if cascading deletion is implemented, child categories are properly deleted
   - Create parent with children, use cascade flag, verify all children are deleted

3. **End-to-end flow**
   - Test full workflow: create site → create categories → delete category → verify site integrity
   - Verify the full lifecycle works correctly

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios and transaction failures
- Implement helper methods to verify Redis data after deletion
- Create specific test fixtures for hierarchical relationships and listing associations
- Test both direct deletion and cascading deletion (if implemented)
- Verify Redis key patterns match between test and implementation
- Create multi-tenant test cases if implementing tenant isolation
