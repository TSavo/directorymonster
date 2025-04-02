# GET /api/sites API Testing Specification

## Overview

This endpoint retrieves a list of all sites that the authenticated user has access to. The response is filtered based on the tenant context and user permissions.

## Requirements

### Functional Requirements

1. Return an array of site configurations the authenticated user has access to
2. Filter sites based on the tenant context of the authenticated user
3. Ensure proper pagination for large result sets (if applicable)
4. Include full site details in the response (id, name, slug, domain, etc.)

### Security Requirements

1. Require authentication (JWT token)
2. Validate user has 'site:read' permission
3. Enforce tenant isolation (users can only see sites within their tenant context)
4. Prevent cross-tenant data leakage

### Performance Requirements

1. Response time should be < 300ms for up to 100 sites
2. Implement proper caching for frequently accessed sites
3. Use efficient Redis queries to minimize database load

## API Specification

### Request

- Method: GET
- Path: /api/sites
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}

### Response

#### Success (200 OK)

```json
[
  {
    "id": "site_1234567890",
    "name": "Fishing Gear Reviews",
    "slug": "fishing-gear",
    "domain": "fishinggearreviews.com",
    "primaryKeyword": "fishing equipment reviews",
    "metaDescription": "Expert reviews of the best fishing gear",
    "headerText": "Expert Fishing Gear Reviews",
    "defaultLinkAttributes": "dofollow",
    "createdAt": 1615482366000,
    "updatedAt": 1632145677000
  },
  {
    "id": "site_0987654321",
    "name": "Hiking Gear Directory",
    "slug": "hiking-gear",
    "domain": "hikinggear.example.com",
    "primaryKeyword": "hiking equipment directory",
    "metaDescription": "Comprehensive directory of hiking gear",
    "headerText": "Find the Best Hiking Gear",
    "defaultLinkAttributes": "dofollow",
    "createdAt": 1625482366000,
    "updatedAt": 1632145677000
  }
]
```

#### No Sites Found (200 OK with empty array)

```json
[]
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
  "error": "Internal server error"
}
```

## Testing Scenarios

### Success Scenarios

1. **Authenticated user with site:read permission requests sites within their tenant**
   - Expected: 200 OK with array of sites
   - Test: Send request with valid JWT and tenant ID, verify response contains sites

2. **Authenticated user with site:read permission has no sites**
   - Expected: 200 OK with empty array
   - Test: Send request with valid JWT for user with no sites, verify empty array response

### Authentication Failure Scenarios

1. **Missing authentication token**
   - Expected: 401 Unauthorized
   - Test: Send request without Authorization header, verify 401 response

2. **Invalid authentication token**
   - Expected: 401 Unauthorized
   - Test: Send request with malformed JWT, verify 401 response

3. **Expired authentication token**
   - Expected: 401 Unauthorized
   - Test: Send request with expired JWT, verify 401 response

### Authorization Failure Scenarios

1. **User without site:read permission**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for user without site:read permission, verify 403 response

### Tenant Isolation Scenarios

1. **Mismatched tenant ID**
   - Expected: 401 Unauthorized
   - Test: Send request with JWT for tenant1 but X-Tenant-ID header for tenant2, verify 401 response

2. **Cross-tenant access attempt**
   - Expected: Sites from other tenants not included
   - Test: Create sites in two tenants, access with credentials from one tenant, verify only that tenant's sites are returned

### Error Handling Scenarios

1. **Redis connection failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis connection failure, verify 500 response

2. **Malformed site data in Redis**
   - Expected: Skip malformed sites, return valid sites
   - Test: Seed Redis with mix of valid and invalid site data, verify only valid sites returned

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios
- Use proper authentication test helpers to generate valid and invalid JWTs
- Implement tenant isolation test utilities to verify proper security boundaries
