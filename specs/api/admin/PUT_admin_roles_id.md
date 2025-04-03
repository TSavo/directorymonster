# PUT /api/admin/roles/{id} API Specification

## Overview

This endpoint updates an existing role by its ID, allowing administrators to modify the role's name, description, and permissions. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Update an existing role's name, description, and permissions
2. Validate role data for completeness and correctness
3. Prevent duplicate role names within the same tenant
4. Return the updated role with its complete details
5. Prevent modification of system roles

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:manage' permission
3. Enforce tenant isolation (administrators can only update roles within their tenant scope)
4. Sanitize and validate all input data
5. Prevent modification of system roles by non-super admins
6. Log updates for audit purposes

### Performance Requirements

1. Response time should be < 500ms
2. Optimize storage of permission sets
3. Handle large permission sets efficiently
4. Implement proper transaction handling for atomic updates

## API Specification

### Request

- Method: PUT
- Path: /api/admin/roles/{id}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Path Parameters:
  - `id`: (string, required) - The unique identifier of the role
- Body:
```json
{
  "name": "Updated Content Manager",
  "description": "Can manage all content across the tenant with additional permissions",
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
      "resource": "category",
      "action": "delete"
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
    },
    {
      "resource": "listing",
      "action": "delete"
    }
  ]
}
```

### Response

#### Success (200 OK)

```json
{
  "id": "role_1234567890",
  "name": "Updated Content Manager",
  "description": "Can manage all content across the tenant with additional permissions",
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
        "type": "category",
        "tenantId": "tenant_0987654321"
      },
      "permission": "delete"
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
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "tenant_0987654321"
      },
      "permission": "delete"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
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
  "error": "Insufficient permissions to update roles"
}
```

```json
{
  "error": "System roles cannot be modified"
}
```

#### Not Found (404 Not Found)

```json
{
  "error": "Role not found"
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
  "error": "Failed to update role"
}
```

## Testing Scenarios

### Success Scenarios

1. **Update custom role name and description**
   - Expected: 200 OK with updated role details
   - Test: Send request with valid JWT for admin and updated name/description
   - Validation: Verify role is updated with new name and description

2. **Update role permissions**
   - Expected: 200 OK with updated role details
   - Test: Send request with valid JWT for admin and modified permissions
   - Validation: Verify role is updated with new permissions

3. **Update role scope**
   - Expected: 200 OK with updated role details
   - Test: Send request with valid JWT for admin and changed scope
   - Validation: Verify role is updated with new scope

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

4. **Attempt to modify system role**
   - Expected: 403 Forbidden
   - Test: Send request to update a system role
   - Validation: Verify error response about system roles

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
   - Test: Update role with name that already exists in tenant
   - Validation: Verify error response about duplicate name

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

1. **Very long role name and description**
   - Expected: 200 OK with updated role details
   - Test: Send request with very long name and description
   - Validation: Verify role is updated with truncated values if necessary

2. **Large number of permissions**
   - Expected: 200 OK with updated role details
   - Test: Send request with many permissions
   - Validation: Verify role is updated with all permissions

3. **No changes in update**
   - Expected: 200 OK with unchanged role details
   - Test: Send request with same data as current role
   - Validation: Verify role is unchanged but response is successful

## Implementation Notes

- Validate role name uniqueness within tenant scope
- Implement proper tenant isolation through key prefixing
- Store permissions efficiently to handle large permission sets
- Add appropriate logging for audit trail
- Implement transaction support for atomic role updates
- Consider impact on users with this role when permissions change
- Implement proper error handling for database operations
- Consider implementing optimistic concurrency control for updates
