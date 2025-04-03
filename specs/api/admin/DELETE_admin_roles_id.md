# DELETE /api/admin/roles/{id} API Specification

## Overview

This endpoint deletes a specific role by its ID, removing it from the system. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Delete a specific role by its ID
2. Prevent deletion of system roles
3. Prevent deletion of roles that are assigned to users
4. Return success confirmation upon successful deletion

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:manage' permission
3. Enforce tenant isolation (administrators can only delete roles within their tenant scope)
4. Sanitize and validate all path parameters
5. Prevent deletion of system roles by any user
6. Log deletion for audit purposes

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper transaction handling for atomic deletion
3. Handle cascading effects efficiently (e.g., removing role references)

## API Specification

### Request

- Method: DELETE
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
  "error": "Insufficient permissions to delete roles"
}
```

```json
{
  "error": "System roles cannot be deleted"
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
  "error": "Cannot delete a role that is assigned to users"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to delete role"
}
```

## Testing Scenarios

### Success Scenarios

1. **Delete custom role**
   - Expected: 200 OK with success confirmation
   - Test: Send request with valid JWT for admin and custom role ID
   - Validation: Verify role is deleted from the system

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

4. **Attempt to delete system role**
   - Expected: 403 Forbidden
   - Test: Send request to delete a system role
   - Validation: Verify error response about system roles

### Error Scenarios

1. **Role not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent role ID
   - Validation: Verify role not found error

2. **Invalid role ID format**
   - Expected: 400 Bad Request
   - Test: Send request with invalid role ID format
   - Validation: Verify error response about invalid ID format

3. **Role assigned to users**
   - Expected: 409 Conflict
   - Test: Send request to delete role assigned to users
   - Validation: Verify error response about assigned users

### Edge Case Scenarios

1. **Role with complex permissions**
   - Expected: 200 OK with success confirmation
   - Test: Delete role with many permissions
   - Validation: Verify all permissions are removed with the role

2. **Last custom role in tenant**
   - Expected: 200 OK with success confirmation
   - Test: Delete the last custom role in a tenant
   - Validation: Verify role is deleted successfully

## Implementation Notes

- Implement proper tenant isolation through key prefixing
- Add appropriate logging for audit trail
- Implement transaction support for atomic role deletion
- Check for user assignments before deletion
- Consider implementing soft delete for audit purposes
- Implement proper error handling for database operations
- Consider impact on system integrity when roles are deleted
- Ensure proper cleanup of all role references
