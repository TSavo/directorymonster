# GET /api/admin/roles/predefined/{roleName} API Specification

## Overview

This endpoint retrieves a specific predefined role template by name. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Return a specific predefined role template by name
2. Include detailed permission information for the template

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'role:read' permission
3. Log access for audit purposes

### Performance Requirements

1. Response time should be < 200ms
2. Implement caching for predefined role templates

## API Specification

### Request

- Method: GET
- Path: /api/admin/roles/predefined/{roleName}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Path Parameters:
  - `roleName`: (string, required) - The name of the predefined role template (e.g., "Tenant Admin", "Site Editor")

### Response

#### Success (200 OK)

```json
{
  "name": "Tenant Admin",
  "description": "Full administrative access to all resources across all sites",
  "isGlobal": false,
  "aclEntries": [
    {
      "resource": {
        "type": "user",
        "tenantId": "{tenantId}"
      },
      "permission": "manage"
    },
    {
      "resource": {
        "type": "site",
        "tenantId": "{tenantId}"
      },
      "permission": "manage"
    },
    {
      "resource": {
        "type": "category",
        "tenantId": "{tenantId}"
      },
      "permission": "manage"
    },
    {
      "resource": {
        "type": "listing",
        "tenantId": "{tenantId}"
      },
      "permission": "manage"
    },
    {
      "resource": {
        "type": "role",
        "tenantId": "{tenantId}"
      },
      "permission": "manage"
    }
  ]
}
```

#### Not Found (404 Not Found)

```json
{
  "error": "Predefined role 'Invalid Role' not found"
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
  "error": "Insufficient permissions to access role templates"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve predefined role"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve tenant-wide role template**
   - Expected: 200 OK with role template
   - Test: Send request with valid JWT for admin and tenant role name
   - Validation: Verify response contains the correct tenant-wide role template

2. **Retrieve site-specific role template**
   - Expected: 200 OK with role template
   - Test: Send request with valid JWT for admin and site role name
   - Validation: Verify response contains the correct site-specific role template

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Error Scenarios

1. **Role template not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent role name
   - Validation: Verify role not found error

## Implementation Notes

- Implement caching for predefined role templates
- Add appropriate logging for audit trail
- Consider implementing versioning for predefined role templates
- Ensure templates include placeholders for tenant and site IDs
