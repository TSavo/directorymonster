# GET /api/admin/users API Specification

## Overview

This endpoint retrieves a paginated list of users in the system, filtered based on query parameters and the tenant context of the authenticated administrator. It's designed for administrative user management and provides robust filtering, sorting, and pagination capabilities.

## Requirements

### Functional Requirements

1. Return a paginated list of users accessible to the authenticated administrator
2. Support filtering by role, status, email, and other user attributes
3. Support sorting by various user fields (name, email, created date, etc.)
4. Return basic user information without sensitive data (passwords)
5. Include pagination metadata in response

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'user:read' permission
3. Enforce tenant isolation (administrators can only see users within their tenant scope)
4. Super admins can see users across all tenants
5. Sanitize and validate all query parameters
6. Log access for audit purposes

### Performance Requirements

1. Response time should be < 500ms for typical requests
2. Efficiently handle large user databases with proper pagination
3. Implement query optimization for filtered results
4. Cache frequently accessed user lists for improved performance

## API Specification

### Request

- Method: GET
- Path: /api/admin/users
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `limit`: (number, optional, default: 20) - Results per page
  - `sort`: (string, optional, default: 'createdAt') - Field to sort by
  - `order`: (string, optional, default: 'desc') - Sort order ('asc' or 'desc')
  - `role`: (string, optional) - Filter by user role
  - `status`: (string, optional) - Filter by user status (active, locked, etc.)
  - `email`: (string, optional) - Filter by email (partial match)
  - `q`: (string, optional) - Search query across user fields
  - `tenantId`: (string, optional) - For super admins to filter by specific tenant

### Response

#### Success (200 OK)

```json
{
  "users": [
    {
      "id": "user_1234567890",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "status": "active",
      "emailVerified": true,
      "tenants": [
        {
          "id": "tenant_1234",
          "name": "Main Organization",
          "role": "admin"
        }
      ],
      "lastLogin": "2025-03-15T14:30:45Z",
      "createdAt": "2024-08-01T10:15:30Z",
      "updatedAt": "2025-03-15T14:30:45Z"
    },
    {
      "id": "user_0987654321",
      "username": "janesmith",
      "email": "jane.smith@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "editor",
      "status": "active",
      "emailVerified": true,
      "tenants": [
        {
          "id": "tenant_1234",
          "name": "Main Organization",
          "role": "editor"
        }
      ],
      "lastLogin": "2025-04-01T09:12:33Z",
      "createdAt": "2024-09-15T08:30:00Z",
      "updatedAt": "2025-04-01T09:12:33Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
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
  "error": "Insufficient permissions to access user data"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "param": "limit",
      "message": "Limit must be between 1 and 100"
    }
  ]
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve users"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve default user list (first page)**
   - Expected: 200 OK with first page of users (20 items)
   - Test: Send request with valid JWT for admin
   - Validation: Verify response contains user array and pagination data

2. **Pagination works correctly**
   - Expected: 200 OK with specified page of users
   - Test: Send request with page=2&limit=10
   - Validation: Verify response contains correct page and limit in pagination

3. **Filter by role**
   - Expected: 200 OK with filtered list
   - Test: Send request with role=editor
   - Validation: Verify all users in response have editor role

4. **Search functionality**
   - Expected: 200 OK with search results
   - Test: Send request with q=john
   - Validation: Verify results contain 'john' in relevant fields

5. **Super admin cross-tenant view**
   - Expected: 200 OK with users from all tenants
   - Test: Send request as super admin without tenantId filter
   - Validation: Verify users from multiple tenants are included

6. **Super admin single-tenant filter**
   - Expected: 200 OK with users from specific tenant
   - Test: Send request as super admin with tenantId filter
   - Validation: Verify all users belong to specified tenant

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 200 OK with users only from admin's tenant
   - Test: Send request as site admin
   - Validation: Verify all users belong to admin's tenant

3. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without JWT
   - Validation: Verify authentication required error

### Edge Case Scenarios

1. **Empty result set**
   - Expected: 200 OK with empty users array
   - Test: Send request with filters that match no users
   - Validation: Verify response has empty users array and pagination showing total=0

2. **Invalid pagination parameters**
   - Expected: 400 Bad Request
   - Test: Send request with invalid pagination (e.g., page=-1)
   - Validation: Verify appropriate error response

3. **Too many results requested**
   - Expected: 400 Bad Request or truncated results
   - Test: Send request with very large limit value
   - Validation: Verify system either rejects or caps the request

## Implementation Notes

- Implement proper query parameter validation
- Use Redis transactions for consistency
- Apply tenant-specific key prefixing for data access
- Consider rate limiting for this endpoint to prevent abuse
- Implement proper logging for audit trail
- Ensure password hashes and other sensitive data are never returned
- Use JOINs or multiple queries efficiently when filtering by tenant
- Cache result sets for common queries (with appropriate invalidation)
- Implement efficient search across user fields