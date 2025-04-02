# GET /api/auth/me API Specification

## Overview

This endpoint returns the profile information of the currently authenticated user. It provides a way for the client application to access user details, permissions, and configuration settings associated with the authenticated user.

## Requirements

### Functional Requirements

1. Return profile information for the authenticated user
2. Include tenant membership and permissions information
3. Return user preferences and settings
4. Provide user-specific configuration values
5. Support optional fields inclusion/exclusion

### Security Requirements

1. Require valid authentication token
2. Do not expose sensitive user information (password hashes, security questions)
3. Only return information the user has permission to access
4. Filter tenant information based on current context

### Performance Requirements

1. Response time should be < 200ms
2. Cache user data appropriately for improved performance
3. Optimize response size for frequently accessed endpoint
4. Support ETag or other caching mechanisms

## API Specification

### Request

- Method: GET
- Path: /api/auth/me
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID} (optional, for multi-tenant context)
- Query Parameters:
  - fields: Comma-separated list of fields to include (optional)
  - include: Additional related data to include (optional)

### Response

#### Success (200 OK)

```json
{
  "id": "user-uuid-here",
  "username": "username",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "avatarUrl": "https://example.com/avatars/username.jpg",
  "role": "admin",
  "isEmailVerified": true,
  "preferredLanguage": "en-US",
  "createdAt": "2024-10-15T14:30:00Z",
  "lastLoginAt": "2025-04-01T08:15:00Z",
  "tenants": [
    {
      "id": "tenant-id-1",
      "name": "Tenant Name 1",
      "role": "admin",
      "permissions": ["site:read", "site:write", "user:read", "user:write"]
    },
    {
      "id": "tenant-id-2",
      "name": "Tenant Name 2",
      "role": "editor",
      "permissions": ["site:read", "site:write"]
    }
  ],
  "currentTenant": {
    "id": "tenant-id-1",
    "name": "Tenant Name 1",
    "role": "admin",
    "permissions": ["site:read", "site:write", "user:read", "user:write"]
  },
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false
    },
    "dashboardLayout": "compact"
  }
}
```

#### Unauthorized (401 Unauthorized)

```json
{
  "error": "Unauthorized. Authentication required."
}
```

#### Token Expired (401 Unauthorized)

```json
{
  "error": "Token expired. Please login again."
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve user information"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve authenticated user profile**
   - Expected: 200 OK with user profile data
   - Test: Send request with valid authentication token
   - Validation: Verify response contains all expected user fields

2. **Filtered fields**
   - Expected: 200 OK with only requested fields
   - Test: Send request with fields parameter
   - Validation: Verify response contains only specified fields

3. **Tenant-specific context**
   - Expected: 200 OK with tenant-specific data
   - Test: Send request with X-Tenant-ID header
   - Validation: Verify currentTenant reflects requested tenant

### Authentication Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without Authorization header
   - Validation: Verify appropriate error response

2. **Expired token**
   - Expected: 401 Unauthorized
   - Test: Send request with expired token
   - Validation: Verify appropriate error response with expired message

3. **Invalid token**
   - Expected: 401 Unauthorized
   - Test: Send request with malformed token
   - Validation: Verify appropriate error response

### Multi-tenant Scenarios

1. **User with multiple tenants**
   - Expected: 200 OK with all tenants listed
   - Test: Authenticate as user with multiple tenant memberships
   - Validation: Verify response includes array of all tenants

2. **Current tenant selection**
   - Expected: 200 OK with correct current tenant
   - Test: Send request with X-Tenant-ID header
   - Validation: Verify currentTenant matches requested tenant

3. **Invalid tenant context**
   - Expected: 403 Forbidden or tenant ignored
   - Test: Send request with X-Tenant-ID for tenant user doesn't belong to
   - Validation: Verify appropriate error or default tenant selection

### Performance Scenarios

1. **Response caching**
   - Expected: Subsequent requests use cache
   - Test: Send identical requests in sequence
   - Validation: Verify proper ETag/304 behavior or cache headers

## Implementation Notes

- Implement response compression for larger user objects
- Consider field filtering implementation for optimizing response size
- Cache user profile data with appropriate invalidation strategy
- Ensure sensitive fields are properly excluded
- Document all fields in API documentation
- Consider implementing GraphQL for more complex field selection