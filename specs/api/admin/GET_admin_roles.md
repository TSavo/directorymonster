# GET /api/admin/roles API Specification

## Overview

This endpoint retrieves a list of roles available in the system, filtered based on the tenant context of the authenticated administrator. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Return a list of roles accessible to the authenticated administrator
2. Include associated permissions for each role
3. Support filtering by role type and scope
4. Support sorting by various attributes
5. Include usage statistics (e.g., number of users assigned to each role)

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:read' permission
3. Enforce tenant isolation (administrators can only see roles within their tenant scope)
4. Super admins can see global and tenant-specific roles
5. Sanitize and validate all query parameters
6. Log access for audit purposes

### Performance Requirements

1. Response time should be < 300ms
2. Optimize query performance for role hierarchies
3. Implement caching for frequently accessed role data
4. Handle large permission sets efficiently

## API Specification

### Request

- Method: GET
- Path: /api/admin/roles
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `type`: (string, optional) - Filter by role type (system, custom)
  - `scope`: (string, optional) - Filter by scope (global, tenant, site)
  - `sort`: (string, optional, default: 'name') - Field to sort by
  - `order`: (string, optional, default: 'asc') - Sort order ('asc' or 'desc')

### Response

#### Success (200 OK)

```json
{
  "roles": [
    {
      "id": "role_1234567890",
      "name": "Site Administrator",
      "description": "Full control over site management",
      "type": "system",
      "scope": "site",
      "isDefault": false,
      "permissions": [
        {
          "resource": "site",
          "actions": ["create", "read", "update", "delete", "manage"]
        },
        {
          "resource": "category",
          "actions": ["create", "read", "update", "delete", "manage"]
        },
        {
          "resource": "listing",
          "actions": ["create", "read", "update", "delete", "manage"]
        }
      ],
      "userCount": 5,
      "canModify": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "role_0987654321",
      "name": "Content Editor",
      "description": "Can edit content but cannot modify site settings",
      "type": "custom",
      "scope": "tenant",
      "isDefault": false,
      "permissions": [
        {
          "resource": "site",
          "actions": ["read"]
        },
        {
          "resource": "category",
          "actions": ["read", "update"]
        },
        {
          "resource": "listing",
          "actions": ["create", "read", "update"]
        }
      ],
      "userCount": 12,
      "canModify": true,
      "createdAt": "2024-02-15T10:30:00Z",
      "updatedAt": "2025-03-05T14:22:00Z"
    }
  ]
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
  "error": "Failed to retrieve roles"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all roles (admin)**
   - Expected: 200 OK with complete role list
   - Test: Send request with valid JWT for admin
   - Validation: Verify response contains all roles in tenant

2. **Filter by role type**
   - Expected: 200 OK with filtered list
   - Test: Send request with type=custom
   - Validation: Verify all roles in response are custom type

3. **Filter by role scope**
   - Expected: 200 OK with filtered list
   - Test: Send request with scope=site
   - Validation: Verify all roles in response have site scope

4. **Super admin global view**
   - Expected: 200 OK with all roles
   - Test: Send request as super admin
   - Validation: Verify response includes global and tenant-specific roles

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 200 OK with roles only from admin's tenant
   - Test: Send request as site admin
   - Validation: Verify all roles belong to admin's tenant

3. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Edge Case Scenarios

1. **No roles match filters**
   - Expected: 200 OK with empty roles array
   - Test: Send request with filters that match no roles
   - Validation: Verify response has empty roles array

2. **Sort by different attributes**
   - Expected: 200 OK with sorted results
   - Test: Try different sort parameters
   - Validation: Verify correct sorting in response

## Implementation Notes

- Cache role data with appropriate invalidation strategies
- Implement efficient permission set comparison for roles
- Pre-calculate user counts periodically to avoid expensive joins
- Consider using a graph database or specialized ACL store for complex permission hierarchies
- Use Redis sorted sets for efficient filtering and sorting
- Implement proper tenant isolation through key prefixing
- Add appropriate logging for audit trail
- Consider implementing role hierarchy visualization data in response