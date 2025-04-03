# POST /api/admin/roles API Specification

## Overview

This endpoint creates a new role within the tenant context of the authenticated administrator. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Create a new role with specified name, description, and permissions
2. Support both tenant-wide and site-specific roles
3. Validate role data for completeness and correctness
4. Prevent duplicate role names within the same tenant
5. Return the created role with its assigned ID

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:manage' permission
3. Enforce tenant isolation (administrators can only create roles within their tenant scope)
4. Sanitize and validate all input data
5. Prevent creation of system roles by non-super admins
6. Log creation for audit purposes

### Performance Requirements

1. Response time should be < 500ms
2. Optimize storage of permission sets
3. Handle large permission sets efficiently

## API Specification

### Request

- Method: POST
- Path: /api/admin/roles
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
```json
{
  "name": "Content Manager",
  "description": "Can manage all content across the tenant",
  "isGlobal": false,
  "scope": "tenant",
  "permissions": [
    {
      "resource": "category",
      "action": "create"
    },
    {
      "resource": "category",
      "action": "read"
    },
    {
      "resource": "category",
      "action": "update"
    },
    {
      "resource": "listing",
      "action": "create"
    },
    {
      "resource": "listing",
      "action": "read"
    },
    {
      "resource": "listing",
      "action": "update"
    }
  ]
}
```

### Response

#### Success (201 Created)

```json
{
  "id": "role_1234567890",
  "name": "Content Manager",
  "description": "Can manage all content across the tenant",
  "tenantId": "tenant_0987654321",
  "isGlobal": false,
  "type": "custom",
  "scope": "tenant",
  "aclEntries": [
    {
      "resource": {
        "type": "category",
        "tenantId": "tenant_0987654321"
      },
      "permission": "create"
    },
    {
      "resource": {
        "type": "category",
        "tenantId": "tenant_0987654321"
      },
      "permission": "read"
    },
    {
      "resource": {
        "type": "category",
        "tenantId": "tenant_0987654321"
      },
      "permission": "update"
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "tenant_0987654321"
      },
      "permission": "create"
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "tenant_0987654321"
      },
      "permission": "read"
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "tenant_0987654321"
      },
      "permission": "update"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Bad Request (400 Bad Request)

```json
{
  "error": "Name and description are required"
}
```

```json
{
  "error": "At least one permission is required"
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
  "error": "Insufficient permissions to create roles"
}
```

#### Conflict (409 Conflict)

```json
{
  "error": "Role with this name already exists"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to create role"
}
```

## Testing Scenarios

### Success Scenarios

1. **Create tenant-wide role**
   - Expected: 201 Created with role details
   - Test: Send request with valid JWT for admin and tenant-wide permissions
   - Validation: Verify role is created with correct permissions and tenant ID

2. **Create site-specific role**
   - Expected: 201 Created with role details
   - Test: Send request with valid JWT for admin and site-specific permissions
   - Validation: Verify role is created with correct permissions, tenant ID, and site ID

3. **Create role with minimal permissions**
   - Expected: 201 Created with role details
   - Test: Send request with only one permission
   - Validation: Verify role is created with the single permission

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 201 Created with role in admin's tenant
   - Test: Send request as site admin
   - Validation: Verify created role belongs to admin's tenant

3. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Validation Scenarios

1. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send request without name or description
   - Validation: Verify error response about required fields

2. **No permissions specified**
   - Expected: 400 Bad Request
   - Test: Send request with empty permissions array
   - Validation: Verify error response about required permissions

3. **Duplicate role name**
   - Expected: 409 Conflict
   - Test: Create role with name that already exists in tenant
   - Validation: Verify error response about duplicate name

### Edge Case Scenarios

1. **Very long role name and description**
   - Expected: 201 Created with role details
   - Test: Send request with very long name and description
   - Validation: Verify role is created with truncated values if necessary

2. **Large number of permissions**
   - Expected: 201 Created with role details
   - Test: Send request with many permissions
   - Validation: Verify role is created with all permissions

## Implementation Notes

- Validate role name uniqueness within tenant scope
- Implement proper tenant isolation through key prefixing
- Store permissions efficiently to handle large permission sets
- Add appropriate logging for audit trail
- Consider implementing role templates for common permission sets
- Ensure proper error handling for database operations
- Implement transaction support for atomic role creation
