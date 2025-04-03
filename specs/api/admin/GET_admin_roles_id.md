# GET /api/admin/roles/{id} API Specification

## Overview

This endpoint retrieves a specific role by its ID, including detailed information about its permissions and usage statistics. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Return detailed information about a specific role
2. Include all permissions associated with the role
3. Include usage statistics (e.g., number of users assigned to the role)
4. Indicate whether the role can be modified

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:read' permission
3. Enforce tenant isolation (administrators can only see roles within their tenant scope)
4. Sanitize and validate all path parameters
5. Log access for audit purposes

### Performance Requirements

1. Response time should be < 200ms
2. Optimize query performance for role details
3. Implement caching for frequently accessed role data
4. Handle large permission sets efficiently

## API Specification

### Request

- Method: GET
- Path: /api/admin/roles/{id}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Path Parameters:
  - `id`: (string, required) - The unique identifier of the role

### Response

#### Success (200 OK)

```json
{
  "id": "role_1234567890",
  "name": "Site Administrator",
  "description": "Full control over site management",
  "tenantId": "tenant_0987654321",
  "isGlobal": false,
  "type": "system",
  "scope": "site",
  "aclEntries": [
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
        "tenantId": "tenant_0987654321",
        "siteId": "site_5678901234"
      },
      "permission": "manage"
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "tenant_0987654321",
        "siteId": "site_5678901234"
      },
      "permission": "manage"
    }
  ],
  "userCount": 5,
  "canModify": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Not Found (404 Not Found)

```json
{
  "error": "Role not found"
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
  "error": "Insufficient permissions to access role data"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve role"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve system role**
   - Expected: 200 OK with complete role details
   - Test: Send request with valid JWT for admin and system role ID
   - Validation: Verify response contains all role details and canModify is false

2. **Retrieve custom role**
   - Expected: 200 OK with complete role details
   - Test: Send request with valid JWT for admin and custom role ID
   - Validation: Verify response contains all role details and canModify is true

3. **Retrieve tenant-wide role**
   - Expected: 200 OK with complete role details
   - Test: Send request with valid JWT for admin and tenant-wide role ID
   - Validation: Verify response contains all role details with tenant-wide permissions

4. **Retrieve site-specific role**
   - Expected: 200 OK with complete role details
   - Test: Send request with valid JWT for admin and site-specific role ID
   - Validation: Verify response contains all role details with site-specific permissions

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 404 Not Found
   - Test: Send request as site admin for role in different tenant
   - Validation: Verify role not found error

3. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Error Scenarios

1. **Role not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent role ID
   - Validation: Verify role not found error

2. **Invalid role ID format**
   - Expected: 400 Bad Request
   - Test: Send request with invalid role ID format
   - Validation: Verify error response about invalid ID format

### Edge Case Scenarios

1. **Role with many permissions**
   - Expected: 200 OK with complete role details
   - Test: Retrieve role with large number of permissions
   - Validation: Verify all permissions are included in response

2. **Role with no users assigned**
   - Expected: 200 OK with complete role details
   - Test: Retrieve role with no assigned users
   - Validation: Verify userCount is 0

## Implementation Notes

- Cache role data with appropriate invalidation strategies
- Implement efficient permission set retrieval
- Pre-calculate user counts periodically to avoid expensive joins
- Use Redis for caching frequently accessed roles
- Implement proper tenant isolation through key prefixing
- Add appropriate logging for audit trail
- Consider implementing role hierarchy visualization data in response
