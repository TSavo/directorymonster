# DELETE /api/sites/[siteSlug]/listings/[listingId] API Testing Specification

## Overview

This endpoint deletes a specific listing identified by its ID within a particular site. It performs validation to ensure data integrity and uses Redis transactions to atomically delete all related keys. It also removes the listing from the search index.

## Requirements

### Functional Requirements

1. Delete a listing by ID
2. Verify the listing belongs to the specified site
3. Ensure proper cleanup of all Redis keys related to the listing
4. Remove the listing from the search index

### Security Requirements

1. Implement tenant isolation (for administrative access)
2. Validate site exists before attempting to delete the listing
3. Verify listing belongs to the specified site
4. Require appropriate permissions to delete listings (if implemented)

### Performance Requirements

1. Response time should be < 500ms
2. Use Redis transactions for atomicity
3. Handle search index removal errors gracefully

## API Specification

### Request

- Method: DELETE
- Path: /api/sites/{siteSlug}/listings/{listingId}
- Headers:
  - Authorization: Bearer {JWT token} (if implementing protection)
  - X-Tenant-ID: {tenant ID} (if implementing protection)

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

#### Site Not Found (404 Not Found)

```json
{
  "error": "Site not found"
}
```

#### Listing Not Found (404 Not Found)

```json
{
  "error": "Listing not found"
}
```

#### Listing Not in Site (404 Not Found)

```json
{
  "error": "Listing not found in this site"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to delete listing"
}
```

## Testing Scenarios

### Success Scenarios

1. **Delete listing with no dependencies**
   - Expected: 200 OK with success message
   - Test: Create listing, then delete it
   - Validation: Verify listing no longer exists in Redis and search index

2. **Verify Redis key cleanup**
   - Expected: 200 OK and all related Redis keys removed
   - Test: Delete listing, verify Redis keys are removed
   - Validation: Check for listing:id, listing:site, and listing:category keys

### Site and Listing Validation Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent site slug
   - Validation: Confirm error message is "Site not found"

2. **Listing not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent listing ID
   - Validation: Confirm error message is "Listing not found"

3. **Listing exists but belongs to different site**
   - Expected: 404 Not Found
   - Test: Create listing in site1, attempt to delete it through site2's endpoint
   - Validation: Confirm error message is "Listing not found in this site"

### Redis Transaction Scenarios

1. **Successful transaction with all keys removed**
   - Expected: 200 OK, all Redis keys removed
   - Test: Delete listing, check that all Redis keys are removed
   - Validation: Verify no listing-related keys remain in Redis

2. **Redis transaction failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis transaction failure
   - Validation: Confirm error message is "Failed to delete listing"

### Search Indexing Scenarios

1. **Successful removal from search index**
   - Expected: 200 OK, listing removed from search
   - Test: Delete listing, search for its title
   - Validation: Verify listing no longer appears in search results

2. **Failed search index removal (non-critical)**
   - Expected: 200 OK despite indexing failure
   - Test: Simulate search indexer failure
   - Validation: Verify listing is still deleted from Redis despite indexing error

### Security Scenarios (if implementing protection middleware)

1. **Unauthorized deletion attempt**
   - Expected: 401 Unauthorized or 403 Forbidden
   - Test: Attempt to delete listing without proper authentication/authorization
   - Validation: Confirm proper security response based on security model

2. **Cross-tenant deletion attempt**
   - Expected: Listing not accessible across tenant boundaries
   - Test: Create listing in tenant1, attempt to delete with tenant2 credentials
   - Validation: Ensure proper tenant isolation according to security model

## Integration Test Cases

1. **End-to-end listing lifecycle**
   - Test: Create → Read → Update → Delete full lifecycle
   - Validation: Verify each operation works and final state is clean

2. **Verify search updates after deletion**
   - Test: Create listing, verify it appears in search, delete listing, verify it's gone from search
   - Validation: Confirm search index is properly updated after deletion

3. **Create-Delete-Create with same title**
   - Test: Create listing, delete it, then create another with same title
   - Validation: Verify new creation succeeds after deletion (no conflicts)

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different transaction outcomes
- Mock search indexer to test success and failure scenarios
- Implement helper methods to verify Redis data after deletion
- Test with various site and listing configurations
- Verify Redis key cleanup is comprehensive
- Test search index removal independently
- Create multi-tenant test cases if implementing tenant isolation
- Ensure Redis transactions are atomic and rollback properly on failure
