# GET /api/admin/settings API Specification

## Overview

This endpoint retrieves system and tenant configuration settings. It provides a flexible way for administrators to view all configurable platform settings within their permission scope, supporting both global system settings and tenant-specific configurations.

## Requirements

### Functional Requirements

1. Return a comprehensive list of settings based on scope (system, tenant, site)
2. Support filtering by setting type or category
3. Include metadata about each setting (type, validation, default values)
4. Support nested settings structures
5. Include information about whether settings are overridden from defaults

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'setting:read' permission
3. Enforce tenant isolation (administrators can only see settings within their tenant scope)
4. Super admins can see global settings across all tenants
5. Hide sensitive settings based on user permissions
6. Log access for audit purposes

### Performance Requirements

1. Response time should be < 300ms for typical requests
2. Implement caching for settings data
3. Support batch retrieval to minimize round trips
4. Efficiently handle large settings collections

## API Specification

### Request

- Method: GET
- Path: /api/admin/settings
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `scope`: (string, optional) - Filter by setting scope ('system', 'tenant', 'site')
  - `category`: (string, optional) - Filter by setting category (e.g., 'email', 'appearance', 'integration')
  - `siteId`: (string, optional) - For site-specific settings
  - `includeDefaults`: (boolean, optional, default: true) - Include default values for comparison
  - `q`: (string, optional) - Search query across setting keys and descriptions

### Response

#### Success (200 OK)

```json
{
  "settings": [
    {
      "key": "email.smtp.host",
      "value": "smtp.example.com",
      "defaultValue": "smtp.default.com",
      "type": "string",
      "category": "email",
      "scope": "tenant",
      "description": "SMTP server hostname for outgoing emails",
      "isOverridden": true,
      "isEncrypted": false,
      "validation": {
        "required": true,
        "pattern": "^([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$"
      },
      "updatedAt": "2025-02-15T10:30:00Z",
      "updatedBy": {
        "id": "user_1234",
        "username": "admin_user"
      }
    },
    {
      "key": "email.smtp.port",
      "value": 587,
      "defaultValue": 25,
      "type": "number",
      "category": "email",
      "scope": "tenant",
      "description": "SMTP port for outgoing emails",
      "isOverridden": true,
      "isEncrypted": false,
      "validation": {
        "required": true,
        "min": 1,
        "max": 65535
      },
      "updatedAt": "2025-02-15T10:30:00Z",
      "updatedBy": {
        "id": "user_1234",
        "username": "admin_user"
      }
    },
    {
      "key": "email.smtp.password",
      "value": "********",
      "defaultValue": null,
      "type": "string",
      "category": "email",
      "scope": "tenant",
      "description": "SMTP password for authentication",
      "isOverridden": true,
      "isEncrypted": true,
      "validation": {
        "required": false
      },
      "updatedAt": "2025-02-15T10:32:15Z",
      "updatedBy": {
        "id": "user_1234",
        "username": "admin_user"
      }
    },
    {
      "key": "site.appearance.theme",
      "value": "ocean",
      "defaultValue": "default",
      "type": "string",
      "category": "appearance",
      "scope": "site",
      "description": "Visual theme for the site",
      "isOverridden": true,
      "isEncrypted": false,
      "validation": {
        "required": true,
        "enum": ["default", "dark", "light", "ocean", "forest"]
      },
      "updatedAt": "2025-03-10T14:15:30Z",
      "updatedBy": {
        "id": "user_5678",
        "username": "site_admin"
      },
      "siteId": "site_1234",
      "siteName": "Fishing Gear Reviews"
    },
    {
      "key": "integration.analytics.googleAnalyticsId",
      "value": "UA-12345678-1",
      "defaultValue": null,
      "type": "string",
      "category": "integration",
      "scope": "tenant",
      "description": "Google Analytics tracking ID",
      "isOverridden": true,
      "isEncrypted": false,
      "validation": {
        "required": false,
        "pattern": "^UA-\\d+-\\d+$"
      },
      "updatedAt": "2025-01-20T09:45:12Z",
      "updatedBy": {
        "id": "user_1234",
        "username": "admin_user"
      }
    }
  ],
  "metadata": {
    "totalSettings": 5,
    "categories": ["email", "appearance", "integration"],
    "scopes": ["tenant", "site"]
  }
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
  "error": "Insufficient permissions to access settings"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "param": "scope",
      "message": "Scope must be one of: system, tenant, site"
    }
  ]
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve settings"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all tenant settings**
   - Expected: 200 OK with complete settings list
   - Test: Send request with scope=tenant
   - Validation: Verify response contains all tenant-level settings

2. **Filter by category**
   - Expected: 200 OK with filtered settings
   - Test: Send request with category=email
   - Validation: Verify all settings in response belong to email category

3. **Site-specific settings**
   - Expected: 200 OK with site settings
   - Test: Send request with scope=site and siteId
   - Validation: Verify response contains settings for specified site

4. **Search functionality**
   - Expected: 200 OK with search results
   - Test: Send request with q=smtp
   - Validation: Verify results contain "smtp" in key or description

5. **Super admin global settings view**
   - Expected: 200 OK with system-level settings
   - Test: Send request as super admin with scope=system
   - Validation: Verify response contains system-wide settings

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 200 OK with settings only from admin's tenant
   - Test: Send request as site admin
   - Validation: Verify all settings belong to admin's tenant

3. **Site admin cannot access system settings**
   - Expected: 403 Forbidden or filtered response
   - Test: Send request as site admin with scope=system
   - Validation: Verify system settings are not accessible

4. **Sensitive settings are masked**
   - Expected: 200 OK with masked sensitive values
   - Test: Request settings with sensitive information
   - Validation: Verify sensitive values are masked (e.g., passwords)

### Edge Case Scenarios

1. **No settings match filters**
   - Expected: 200 OK with empty settings array
   - Test: Send request with filters that match no settings
   - Validation: Verify response has empty settings array

2. **Invalid category**
   - Expected: 200 OK with empty settings array
   - Test: Send request with non-existent category
   - Validation: Verify appropriate empty response

3. **Nested settings structures**
   - Expected: 200 OK with properly structured nested settings
   - Test: Request settings with nested data
   - Validation: Verify response preserves nested structure

## Implementation Notes

- Implement efficient settings storage using Redis hashes
- Use prefix-based keys for proper tenant isolation
- Cache settings with appropriate invalidation strategies
- Implement secure encryption for sensitive settings
- Consider hierarchical inheritance for settings (system → tenant → site)
- Implement proper schema validation for settings values
- Add appropriate logging for audit trail and security monitoring
- Consider implementing change history for settings
- Use JSON Schema for settings validation rules
- Ensure proper indexing for efficient filtering and search