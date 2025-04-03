# GET /api/admin/roles/predefined API Specification

## Overview

This endpoint retrieves all predefined role templates available in the system. It supports the admin interface for role-based access control management.

## Requirements

### Functional Requirements

1. Return all predefined role templates
2. Group templates by type (tenant-wide and site-specific)
3. Include detailed permission information for each template

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
- Path: /api/admin/roles/predefined
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}

### Response

#### Success (200 OK)

```json
{
  "tenantRoles": [
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
    },
    {
      "name": "Tenant Editor",
      "description": "Can create, edit, and publish content across all sites",
      "isGlobal": false,
      "aclEntries": [
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}"
          },
          "permission": "create"
        },
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}"
          },
          "permission": "update"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}"
          },
          "permission": "create"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}"
          },
          "permission": "update"
        }
      ]
    },
    {
      "name": "Tenant Author",
      "description": "Can create and edit their own content across all sites",
      "isGlobal": false,
      "aclEntries": [
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}"
          },
          "permission": "create"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}"
          },
          "permission": "read"
        }
      ]
    },
    {
      "name": "Tenant Viewer",
      "description": "Read-only access to content across all sites",
      "isGlobal": false,
      "aclEntries": [
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "site",
            "tenantId": "{tenantId}"
          },
          "permission": "read"
        }
      ]
    }
  ],
  "siteRoles": [
    {
      "name": "Site Admin",
      "description": "Full administrative access to a specific site",
      "isGlobal": false,
      "aclEntries": [
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "manage"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "manage"
        }
      ]
    },
    {
      "name": "Site Editor",
      "description": "Can create, edit, and publish content for a specific site",
      "isGlobal": false,
      "aclEntries": [
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "create"
        },
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "update"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "create"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "update"
        }
      ]
    },
    {
      "name": "Site Author",
      "description": "Can create and edit their own content for a specific site",
      "isGlobal": false,
      "aclEntries": [
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "create"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "read"
        }
      ]
    },
    {
      "name": "Site Viewer",
      "description": "Read-only access to content for a specific site",
      "isGlobal": false,
      "aclEntries": [
        {
          "resource": {
            "type": "category",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "read"
        },
        {
          "resource": {
            "type": "listing",
            "tenantId": "{tenantId}",
            "siteId": "{siteId}"
          },
          "permission": "read"
        }
      ]
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
  "error": "Insufficient permissions to access role templates"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve predefined roles"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all predefined role templates**
   - Expected: 200 OK with role templates
   - Test: Send request with valid JWT for admin
   - Validation: Verify response contains both tenant-wide and site-specific role templates

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

## Implementation Notes

- Implement caching for predefined role templates
- Add appropriate logging for audit trail
- Consider implementing versioning for predefined role templates
- Ensure templates include placeholders for tenant and site IDs
- Consider implementing role template customization options
