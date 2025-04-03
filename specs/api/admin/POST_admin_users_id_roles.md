# POST /api/admin/users/{id}/roles API Specification

## Overview

This endpoint assigns multiple roles to a specific user within the tenant context of the authenticated administrator. It supports the admin interface for user role management.

## Requirements

### Functional Requirements

1. Assign multiple roles to a specific user in a single operation
2. Validate that all roles exist and belong to the tenant
3. Support both tenant-wide and site-specific role assignments
4. Return success confirmation upon successful assignment

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:manage' permission
3. Enforce tenant isolation (administrators can only assign roles within their tenant scope)
4. Sanitize and validate all input data
5. Log role assignments for audit purposes

### Performance Requirements

1. Response time should be < 500ms
2. Implement proper transaction handling for atomic role assignments
3. Handle assignment of many roles efficiently

## API Specification

### Request

- Method: POST
- Path: /api/admin/users/{id}/roles
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Path Parameters:
  - `id`: (string, required) - The unique identifier of the user
- Body:
```json
{
  "roleIds": [
    "role_1234567890",
    "role_2345678901",
    "role_3456789012"
  ]
}
```

### Response

#### Success (200 OK)

```json
{
  "success": true
}
```

#### Bad Request (400 Bad Request)

```json
{
  "error": "At least one role ID is required"
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
  "error": "Insufficient permissions to assign roles"
}
```

#### Not Found (404 Not Found)

```json
{
  "error": "User not found"
}
```

```json
{
  "error": "Role role_1234567890 not found"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to assign roles to user"
}
```

## Testing Scenarios

### Success Scenarios

1. **Assign multiple roles to user**
   - Expected: 200 OK with success confirmation
   - Test: Send request with valid JWT for admin and multiple role IDs
   - Validation: Verify roles are assigned to the user

2. **Assign tenant-wide roles to user**
   - Expected: 200 OK with success confirmation
   - Test: Send request with tenant-wide role IDs
   - Validation: Verify tenant-wide roles are assigned to the user

3. **Assign site-specific roles to user**
   - Expected: 200 OK with success confirmation
   - Test: Send request with site-specific role IDs
   - Validation: Verify site-specific roles are assigned to the user

4. **Assign mix of tenant-wide and site-specific roles**
   - Expected: 200 OK with success confirmation
   - Test: Send request with mix of role types
   - Validation: Verify all roles are assigned to the user

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

### Validation Scenarios

1. **Empty role IDs array**
   - Expected: 400 Bad Request
   - Test: Send request with empty roleIds array
   - Validation: Verify error response about required role IDs

2. **Role from different tenant**
   - Expected: 404 Not Found
   - Test: Send request with role ID from different tenant
   - Validation: Verify role not found error

### Error Scenarios

1. **User not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent user ID
   - Validation: Verify user not found error

2. **Role not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent role ID
   - Validation: Verify role not found error

3. **Invalid user ID format**
   - Expected: 400 Bad Request
   - Test: Send request with invalid user ID format
   - Validation: Verify error response about invalid ID format

4. **Invalid role ID format**
   - Expected: 400 Bad Request
   - Test: Send request with invalid role ID format
   - Validation: Verify error response about invalid ID format

### Edge Case Scenarios

1. **Assign many roles at once**
   - Expected: 200 OK with success confirmation
   - Test: Send request with many role IDs
   - Validation: Verify all roles are assigned to the user

2. **Assign roles that user already has**
   - Expected: 200 OK with success confirmation
   - Test: Send request with role IDs that user already has
   - Validation: Verify no errors and roles remain assigned

## Implementation Notes

- Implement proper tenant isolation through key prefixing
- Add appropriate logging for audit trail
- Implement transaction support for atomic role assignments
- Consider impact on user permissions when roles are assigned
- Implement proper error handling for database operations
- Consider implementing optimistic concurrency control for updates
- Validate all role IDs before making any assignments
- Consider implementing role conflict detection and resolution
