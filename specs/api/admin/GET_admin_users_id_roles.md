# GET /api/admin/users/{id}/roles API Specification

## Overview

This endpoint retrieves all roles assigned to a specific user within the tenant context of the authenticated administrator. It supports the admin interface for user role management.

## Requirements

### Functional Requirements

1. Return all roles assigned to a specific user
2. Include detailed information about each role
3. Filter roles by tenant context
4. Support pagination for users with many roles

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:read' permission
3. Enforce tenant isolation (administrators can only see roles within their tenant scope)
4. Sanitize and validate all path parameters
5. Log access for audit purposes

### Performance Requirements

1. Response time should be < 300ms
2. Optimize query performance for role retrieval
3. Implement caching for frequently accessed user role data
4. Handle users with large numbers of roles efficiently

## API Specification

### Request

- Method: GET
- Path: /api/admin/users/{id}/roles
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Path Parameters:
  - `id`: (string, required) - The unique identifier of the user
- Query Parameters:
  - `scope`: (string, optional) - Filter roles by scope (tenant, site)
  - `siteId`: (string, optional) - Filter roles by specific site ID
  - `page`: (integer, optional) - Page number for pagination (default: 1)
  - `limit`: (integer, optional) - Number of roles per page (default: 20)

### Response

#### Success (200 OK)

```json
[
  {
    "id": "role_1234567890",
    "name": "Tenant Admin",
    "description": "Full administrative access to all resources across all sites",
    "tenantId": "tenant_0987654321",
    "isGlobal": false,
    "type": "system",
    "scope": "tenant",
    "aclEntries": [
      {
        "resource": {
          "type": "user",
          "tenantId": "tenant_0987654321"
        },
        "permission": "manage"
      },
      {
        "resource": {
          "type": "site",
          "tenantId": "tenant_0987654321"
        },
        "permission": "manage"
      },
      {
        "resource": {
          "type": "category",
          "tenantId": "tenant_0987654321"
        },
        "permission": "manage"
      },
      {
        "resource": {
          "type": "listing",
          "tenantId": "tenant_0987654321"
        },
        "permission": "manage"
      },
      {
        "resource": {
          "type": "role",
          "tenantId": "tenant_0987654321"
        },
        "permission": "manage"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": "role_2345678901",
    "name": "Site Editor",
    "description": "Can create, edit, and publish content for a specific site",
    "tenantId": "tenant_0987654321",
    "isGlobal": false,
    "type": "system",
    "scope": "site",
    "aclEntries": [
      {
        "resource": {
          "type": "category",
          "tenantId": "tenant_0987654321",
          "siteId": "site_5678901234"
        },
        "permission": "create"
      },
      {
        "resource": {
          "type": "category",
          "tenantId": "tenant_0987654321",
          "siteId": "site_5678901234"
        },
        "permission": "read"
      },
      {
        "resource": {
          "type": "category",
          "tenantId": "tenant_0987654321",
          "siteId": "site_5678901234"
        },
        "permission": "update"
      },
      {
        "resource": {
          "type": "listing",
          "tenantId": "tenant_0987654321",
          "siteId": "site_5678901234"
        },
        "permission": "create"
      },
      {
        "resource": {
          "type": "listing",
          "tenantId": "tenant_0987654321",
          "siteId": "site_5678901234"
        },
        "permission": "read"
      },
      {
        "resource": {
          "type": "listing",
          "tenantId": "tenant_0987654321",
          "siteId": "site_5678901234"
        },
        "permission": "update"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Not Found (404 Not Found)

```json
{
  "error": "User not found"
}
```

#### Unauthorized (401 Unauthorized)

```json
{
  "error": "Authentication required"
}
```

#### Forbidden (403 Forbidden)

```json
{
  "error": "Insufficient permissions to access user roles"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve user roles"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all roles for user**
   - Expected: 200 OK with array of roles
   - Test: Send request with valid JWT for admin and user ID
   - Validation: Verify response contains all roles assigned to the user

2. **Filter roles by scope**
   - Expected: 200 OK with filtered roles
   - Test: Send request with scope=tenant query parameter
   - Validation: Verify response contains only tenant-scoped roles

3. **Filter roles by site ID**
   - Expected: 200 OK with filtered roles
   - Test: Send request with siteId query parameter
   - Validation: Verify response contains only roles for the specified site

4. **Paginate roles**
   - Expected: 200 OK with paginated roles
   - Test: Send request with page and limit parameters
   - Validation: Verify response contains the correct page of roles

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 404 Not Found
   - Test: Send request as site admin for user in different tenant
   - Validation: Verify user not found error

3. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Error Scenarios

1. **User not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent user ID
   - Validation: Verify user not found error

2. **Invalid user ID format**
   - Expected: 400 Bad Request
   - Test: Send request with invalid user ID format
   - Validation: Verify error response about invalid ID format

### Edge Case Scenarios

1. **User with no roles**
   - Expected: 200 OK with empty array
   - Test: Retrieve roles for user with no assigned roles
   - Validation: Verify empty array response

2. **User with many roles**
   - Expected: 200 OK with array of roles
   - Test: Retrieve roles for user with many assigned roles
   - Validation: Verify all roles are included in response or proper pagination

## Implementation Notes

- Cache user role data with appropriate invalidation strategies
- Implement efficient role retrieval for users
- Use Redis for caching frequently accessed user role data
- Implement proper tenant isolation through key prefixing
- Add appropriate logging for audit trail
- Consider implementing role hierarchy visualization data in response
- Optimize queries for users with many roles
- Consider implementing ETags for caching
