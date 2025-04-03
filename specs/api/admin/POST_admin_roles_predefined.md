# POST /api/admin/roles/predefined API Specification

## Overview

This endpoint creates predefined roles in the tenant context of the authenticated administrator. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Create predefined roles in the tenant
2. Support creating tenant-wide roles, site-specific roles, or both
3. Prevent duplicate role creation
4. Return the created roles with their assigned IDs

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:manage' permission
3. Enforce tenant isolation (administrators can only create roles within their tenant scope)
4. Log creation for audit purposes

### Performance Requirements

1. Response time should be < 1000ms
2. Handle creation of multiple roles efficiently
3. Implement proper transaction handling for atomic role creation

## API Specification

### Request

- Method: POST
- Path: /api/admin/roles/predefined
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
```json
{
  "type": "all",
  "siteId": "site_1234567890"
}
```

The `type` parameter can be:
- `"all"`: Create both tenant-wide and site-specific roles (default)
- `"tenant"`: Create only tenant-wide roles
- `"site"`: Create only site-specific roles

The `siteId` parameter is required when `type` is `"all"` or `"site"`.

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
    "aclEntries": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": "role_2345678901",
    "name": "Tenant Editor",
    "description": "Can create, edit, and publish content across all sites",
    "tenantId": "tenant_0987654321",
    "isGlobal": false,
    "type": "system",
    "scope": "tenant",
    "aclEntries": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": "role_3456789012",
    "name": "Site Admin",
    "description": "Full administrative access to a specific site",
    "tenantId": "tenant_0987654321",
    "isGlobal": false,
    "type": "system",
    "scope": "site",
    "aclEntries": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  ...
]
```

#### Bad Request (400 Bad Request)

```json
{
  "error": "Site ID is required for site-specific roles"
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

```json
{
  "error": "You do not have permission to create roles in this tenant"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to create predefined roles"
}
```

## Testing Scenarios

### Success Scenarios

1. **Create all predefined roles**
   - Expected: 200 OK with array of created roles
   - Test: Send request with valid JWT for admin, type="all", and valid siteId
   - Validation: Verify both tenant-wide and site-specific roles are created

2. **Create only tenant-wide roles**
   - Expected: 200 OK with array of created tenant-wide roles
   - Test: Send request with valid JWT for admin and type="tenant"
   - Validation: Verify only tenant-wide roles are created

3. **Create only site-specific roles**
   - Expected: 200 OK with array of created site-specific roles
   - Test: Send request with valid JWT for admin, type="site", and valid siteId
   - Validation: Verify only site-specific roles are created

4. **Create roles with some already existing**
   - Expected: 200 OK with array of all roles (new and existing)
   - Test: Send request when some roles already exist
   - Validation: Verify existing roles are returned along with newly created ones

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 403 Forbidden
   - Test: Send request as site admin for different tenant
   - Validation: Verify error response about tenant permissions

3. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Validation Scenarios

1. **Missing site ID for site roles**
   - Expected: 400 Bad Request
   - Test: Send request with type="site" but no siteId
   - Validation: Verify error response about required site ID

2. **Invalid site ID**
   - Expected: 400 Bad Request
   - Test: Send request with invalid siteId format
   - Validation: Verify error response about invalid site ID

### Error Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent siteId
   - Validation: Verify site not found error

## Implementation Notes

- Implement proper tenant isolation through key prefixing
- Add appropriate logging for audit trail
- Implement transaction support for atomic role creation
- Check for existing roles before creation to avoid duplicates
- Consider implementing role template versioning
- Ensure proper error handling for database operations
- Consider implementing progress tracking for large role sets
