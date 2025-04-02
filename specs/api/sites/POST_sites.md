# POST /api/sites API Testing Specification

## Overview

This endpoint creates a new site in the system. It validates the provided site data, checks for existing sites with the same slug, and creates the site in the database with proper tenant context.

## Requirements

### Functional Requirements

1. Validate all required fields are present (name, slug, primaryKeyword, metaDescription, headerText)
2. Check for uniqueness of site slug across the system
3. Create a new site with the provided data
4. Store the site data in Redis under appropriate keys
5. Associate the site with the current tenant context
6. Return the newly created site object with HTTP 201 status

### Security Requirements

1. Require authentication (JWT token)
2. Validate user has 'site:create' permission
3. Enforce tenant isolation (sites are created within user's tenant context)
4. Sanitize and validate all user input

### Performance Requirements

1. Response time should be < 500ms
2. Use Redis transactions for atomicity
3. Implement proper error handling

## API Specification

### Request

- Method: POST
- Path: /api/sites
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
  ```json
  {
    "name": "Fishing Gear Reviews",
    "slug": "fishing-gear",
    "domain": "fishinggearreviews.com",
    "primaryKeyword": "fishing equipment reviews",
    "metaDescription": "Expert reviews of the best fishing gear",
    "headerText": "Expert Fishing Gear Reviews",
    "logoUrl": "https://example.com/logo.png",
    "defaultLinkAttributes": "dofollow"
  }
  ```

### Response

#### Success (201 Created)

```json
{
  "id": "site_1234567890",
  "name": "Fishing Gear Reviews",
  "slug": "fishing-gear",
  "domain": "fishinggearreviews.com",
  "primaryKeyword": "fishing equipment reviews",
  "metaDescription": "Expert reviews of the best fishing gear",
  "headerText": "Expert Fishing Gear Reviews",
  "logoUrl": "https://example.com/logo.png",
  "defaultLinkAttributes": "dofollow",
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
  "error": "Site slug already exists"
}
```

#### Unauthorized (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

#### Forbidden (403 Forbidden)

```json
{
  "error": "Insufficient permissions"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to save site data"
}
```

## Testing Scenarios

### Success Scenarios

1. **Create site with all required fields**
   - Expected: 201 Created with site object
   - Test: Send valid POST request, verify response contains site with ID and timestamps

2. **Create site with optional fields omitted**
   - Expected: 201 Created with site object (optional fields set to default values)
   - Test: Send POST request without optional fields (e.g., logoUrl), verify defaults applied

### Validation Failure Scenarios

1. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send POST requests omitting each required field one at a time, verify 400 response

2. **Duplicate site slug**
   - Expected: 409 Conflict
   - Test: Create a site, then attempt to create another with the same slug, verify 409 response

### Authentication Failure Scenarios

1. **Missing authentication token**
   - Expected: 401 Unauthorized
   - Test: Send request without Authorization header, verify 401 response

2. **Invalid authentication token**
   - Expected: 401 Unauthorized
   - Test: Send request with malformed JWT, verify 401 response

### Authorization Failure Scenarios

1. **User without site:create permission**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for user without site:create permission, verify 403 response

### Tenant Isolation Scenarios

1. **Mismatched tenant ID**
   - Expected: 401 Unauthorized
   - Test: Send request with JWT for tenant1 but X-Tenant-ID header for tenant2, verify 401 response

2. **Create site in correct tenant context**
   - Expected: Site created with proper tenant association
   - Test: Create site, then verify it appears in GET /api/sites response for the same tenant but not for other tenants

### Error Handling Scenarios

1. **Redis transaction failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis transaction failure, verify 500 response

2. **Malformed request body**
   - Expected: 400 Bad Request
   - Test: Send malformed JSON in request body, verify 400 response

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios and transaction failures
- Use proper authentication test helpers to generate valid and invalid JWTs
- Implement tenant isolation test utilities to verify proper security boundaries
- Test both success and error paths for Redis transactions
