# Role Management APIs

This document describes the APIs for managing roles in DirectoryMonster.

## Overview

The role management APIs allow you to:

- Retrieve, create, update, and delete roles
- Assign and remove roles from users
- Retrieve roles assigned to a user

All role APIs require authentication and appropriate permissions.

## API Endpoints

### Roles

#### GET /api/admin/roles

Retrieves all roles for the current tenant.

**Query Parameters:**
- `type` (optional): Filter roles by type (system, custom)
- `scope` (optional): Filter roles by scope (tenant, site)
- `sort` (optional): Sort field (default: name)
- `order` (optional): Sort order (asc, desc) (default: asc)

**Response:**
```json
{
  "roles": [
    {
      "id": "role_123",
      "name": "Tenant Admin",
      "description": "Full administrative access to all resources across all sites",
      "tenantId": "tenant_456",
      "isGlobal": false,
      "type": "system",
      "scope": "tenant",
      "aclEntries": [...],
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "userCount": 5,
      "canModify": false
    },
    ...
  ]
}
```

#### POST /api/admin/roles

Creates a new role.

**Request Body:**
```json
{
  "name": "Custom Role",
  "description": "A custom role with specific permissions",
  "isGlobal": false,
  "scope": "tenant",
  "permissions": [
    {
      "resource": "category",
      "action": "read",
      "siteId": "site_123" // Optional, only for site-specific permissions
    },
    {
      "resource": "listing",
      "action": "read"
    }
  ]
}
```

**Response:**
```json
{
  "id": "role_789",
  "name": "Custom Role",
  "description": "A custom role with specific permissions",
  "tenantId": "tenant_456",
  "isGlobal": false,
  "type": "custom",
  "scope": "tenant",
  "aclEntries": [...],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### GET /api/admin/roles/{id}

Retrieves a specific role.

**Response:**
```json
{
  "id": "role_123",
  "name": "Tenant Admin",
  "description": "Full administrative access to all resources across all sites",
  "tenantId": "tenant_456",
  "isGlobal": false,
  "type": "system",
  "scope": "tenant",
  "aclEntries": [...],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z",
  "userCount": 5,
  "canModify": false
}
```

#### PUT /api/admin/roles/{id}

Updates a specific role.

**Request Body:**
```json
{
  "name": "Updated Role",
  "description": "An updated role with different permissions",
  "isGlobal": false,
  "scope": "tenant",
  "permissions": [
    {
      "resource": "category",
      "action": "read"
    },
    {
      "resource": "category",
      "action": "create"
    }
  ]
}
```

**Response:**
```json
{
  "id": "role_789",
  "name": "Updated Role",
  "description": "An updated role with different permissions",
  "tenantId": "tenant_456",
  "isGlobal": false,
  "type": "custom",
  "scope": "tenant",
  "aclEntries": [...],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### DELETE /api/admin/roles/{id}

Deletes a specific role.

**Response:**
```json
{
  "success": true
}
```

### User Roles

#### GET /api/admin/users/{id}/roles

Retrieves roles assigned to a user.

**Response:**
```json
[
  {
    "id": "role_123",
    "name": "Tenant Admin",
    "description": "Full administrative access to all resources across all sites",
    "tenantId": "tenant_456",
    "isGlobal": false,
    "type": "system",
    "scope": "tenant",
    "aclEntries": [...],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  ...
]
```

#### POST /api/admin/users/{id}/roles

Assigns multiple roles to a user.

**Request Body:**
```json
{
  "roleIds": ["role_123", "role_456"]
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/admin/users/{id}/roles/{roleId}

Assigns a specific role to a user.

**Response:**
```json
{
  "success": true
}
```

#### DELETE /api/admin/users/{id}/roles/{roleId}

Removes a specific role from a user.

**Response:**
```json
{
  "success": true
}
```

## Error Responses

All APIs return appropriate error responses with status codes:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., role name already exists)
- `500 Internal Server Error`: Server error

Example error response:
```json
{
  "error": "Role not found"
}
```

## Permissions

The following permissions are required for role management:

- `read:role`: Required to retrieve roles
- `manage:role`: Required to create, update, or delete roles, and to assign or remove roles from users

## Best Practices

1. **Use predefined roles** when possible instead of creating custom roles
2. **Assign the minimum necessary permissions** to custom roles
3. **Avoid deleting roles** that are assigned to users
4. **Use descriptive names and descriptions** for custom roles
5. **Consider the scope** (tenant or site) when creating roles
6. **Regularly audit role assignments** to ensure users have appropriate access
