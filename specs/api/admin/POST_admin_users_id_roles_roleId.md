# POST /api/admin/users/{id}/roles/{roleId} API Specification

## Overview

This endpoint assigns a specific role to a user within the tenant context of the authenticated administrator. It supports the admin interface for user role management.

## Requirements

### Functional Requirements

1. Assign a specific role to a user
2. Validate that the role exists and belongs to the tenant
3. Support both tenant-wide and site-specific role assignments
4. Return success confirmation upon successful assignment

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:manage' permission
3. Enforce tenant isolation (administrators can only assign roles within their tenant scope)
4. Sanitize and validate all path parameters
5. Log role assignment for audit purposes

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper transaction handling for atomic role assignment

## API Specification

### Request

- Method: POST
- Path: /api/admin/users/{id}/roles/{roleId}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Path Parameters:
  - `id`: (string, required) - The unique identifier of the user
  - `roleId`: (string, required) - The unique identifier of the role to assign

### Response

#### Success (200 OK)

```json
{
  "success": true
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
  "error": "Role not found"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to assign role to user"
}
```

## Testing Scenarios

### Success Scenarios

1. **Assign tenant-wide role to user**
   - Expected: 200 OK with success confirmation
   - Test: Send request with valid JWT for admin and tenant-wide role ID
   - Validation: Verify role is assigned to the user

2. **Assign site-specific role to user**
   - Expected: 200 OK with success confirmation
   - Test: Send request with valid JWT for admin and site-specific role ID
   - Validation: Verify role is assigned to the user

3. **Assign role user already has**
   - Expected: 200 OK with success confirmation
   - Test: Send request with role ID that user already has
   - Validation: Verify no errors and role remains assigned

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

2. **Role not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent role ID
   - Validation: Verify role not found error

3. **Role from different tenant**
   - Expected: 404 Not Found
   - Test: Send request with role ID from different tenant
   - Validation: Verify role not found error

4. **Invalid user ID format**
   - Expected: 400 Bad Request
   - Test: Send request with invalid user ID format
   - Validation: Verify error response about invalid ID format

5. **Invalid role ID format**
   - Expected: 400 Bad Request
   - Test: Send request with invalid role ID format
   - Validation: Verify error response about invalid ID format

## Implementation Notes

- Implement proper tenant isolation through key prefixing
- Add appropriate logging for audit trail
- Implement transaction support for atomic role assignment
- Consider impact on user permissions when role is assigned
- Implement proper error handling for database operations
- Consider implementing optimistic concurrency control for updates
- Consider implementing role conflict detection and resolution
