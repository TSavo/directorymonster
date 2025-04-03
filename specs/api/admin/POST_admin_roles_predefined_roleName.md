# POST /api/admin/roles/predefined/{roleName} API Specification

## Overview

This endpoint creates a specific predefined role in the tenant context of the authenticated administrator. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Create a specific predefined role in the tenant
2. Support both tenant-wide and site-specific roles
3. Prevent duplicate role creation
4. Return the created role with its assigned ID

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:manage' permission
3. Enforce tenant isolation (administrators can only create roles within their tenant scope)
4. Log creation for audit purposes

### Performance Requirements

1. Response time should be < 500ms
2. Implement proper transaction handling for atomic role creation

## API Specification

### Request

- Method: POST
- Path: /api/admin/roles/predefined/{roleName}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Path Parameters:
  - `roleName`: (string, required) - The name of the predefined role template (e.g., "Tenant Admin", "Site Editor")
- Body:
```json
{
  "siteId": "site_1234567890"
}
```

The `siteId` parameter is required only for site-specific roles.

### Response

#### Success (200 OK)

```json
{
  "id": "role_1234567890",
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
        "siteId": "site_1234567890"
      },
      "permission": "create"
    },
    {
      "resource": {
        "type": "category",
        "tenantId": "tenant_0987654321",
        "siteId": "site_1234567890"
      },
      "permission": "read"
    },
    {
      "resource": {
        "type": "category",
        "tenantId": "tenant_0987654321",
        "siteId": "site_1234567890"
      },
      "permission": "update"
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "tenant_0987654321",
        "siteId": "site_1234567890"
      },
      "permission": "create"
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "tenant_0987654321",
        "siteId": "site_1234567890"
      },
      "permission": "read"
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "tenant_0987654321",
        "siteId": "site_1234567890"
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
  "error": "Site ID is required for site-specific role: Site Editor"
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

#### Not Found (404 Not Found)

```json
{
  "error": "Predefined role 'Invalid Role' not found"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to create predefined role"
}
```

## Testing Scenarios

### Success Scenarios

1. **Create tenant-wide role**
   - Expected: 200 OK with created role
   - Test: Send request with valid JWT for admin and tenant role name
   - Validation: Verify tenant-wide role is created with correct permissions

2. **Create site-specific role**
   - Expected: 200 OK with created role
   - Test: Send request with valid JWT for admin, site role name, and valid siteId
   - Validation: Verify site-specific role is created with correct permissions

3. **Create role that already exists**
   - Expected: 200 OK with existing role
   - Test: Send request for role that already exists
   - Validation: Verify existing role is returned without error

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

1. **Missing site ID for site role**
   - Expected: 400 Bad Request
   - Test: Send request for site role without siteId
   - Validation: Verify error response about required site ID

2. **Invalid site ID**
   - Expected: 400 Bad Request
   - Test: Send request with invalid siteId format
   - Validation: Verify error response about invalid site ID

### Error Scenarios

1. **Role template not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent role name
   - Validation: Verify role not found error

2. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent siteId
   - Validation: Verify site not found error

## Implementation Notes

- Implement proper tenant isolation through key prefixing
- Add appropriate logging for audit trail
- Implement transaction support for atomic role creation
- Check for existing role before creation to avoid duplicates
- Consider implementing role template versioning
- Ensure proper error handling for database operations
- Validate role name against available predefined templates
