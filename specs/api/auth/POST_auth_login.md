# POST /api/auth/login API Specification

## Overview

This endpoint authenticates a user and issues a JWT token for subsequent API requests. It should validate credentials, maintain security through appropriate authentication mechanisms, and return user information along with the token.

## Requirements

### Functional Requirements

1. Validate user credentials against stored authentication data
2. Support multi-tenant authentication (users may belong to multiple sites)
3. Return JWT token with appropriate claims and expiration
4. Return basic user profile information
5. Track login attempts to prevent brute force attacks
6. Support both username/password and email/password login methods

### Security Requirements

1. Use Zero-Knowledge Proof (ZKP) authentication to avoid password transmission
2. Implement rate limiting to prevent brute force attacks
3. Generate secure JWT tokens with appropriate expiration times
4. Include tenant context in token claims for multi-tenant authorization
5. Validate CSRF token to prevent cross-site request forgery
6. Log authentication events for security auditing

### Performance Requirements

1. Response time should be < 300ms
2. Cache frequently accessed user data to improve performance
3. Implement proper error handling with clear messages
4. Function correctly under high load conditions

## API Specification

### Request

- Method: POST
- Path: /api/auth/login
- Headers:
  - Content-Type: application/json
  - X-CSRF-Token: {CSRF token} (required except in test environment)
- Body:
  ```json
  {
    "username": "user@example.com", // Can be username or email
    "password": "securePassword123",
    "tenant": "tenant-id" // Optional, for multi-tenant contexts
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-here",
    "username": "username",
    "email": "user@example.com",
    "role": "admin",
    "tenants": [
      {
        "id": "tenant-id-1",
        "name": "Tenant Name 1",
        "role": "admin"
      },
      {
        "id": "tenant-id-2",
        "name": "Tenant Name 2",
        "role": "editor"
      }
    ]
  },
  "expiresAt": 1712345678 // Unix timestamp when token expires
}
```

#### Invalid Credentials (401 Unauthorized)

```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

#### Account Locked (403 Forbidden)

```json
{
  "success": false,
  "error": "Account locked due to multiple failed attempts. Please reset your password."
}
```

#### Missing CSRF Token (403 Forbidden)

```json
{
  "success": false,
  "error": "Missing CSRF token"
}
```

#### Rate Limited (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Too many login attempts. Please try again in X minutes.",
  "retryAfter": 300 // Seconds until next attempt is allowed
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Authentication service unavailable"
}
```

## Testing Scenarios

### Success Scenarios

1. **Login with username and password**
   - Expected: 200 OK with token and user information
   - Test: Send valid credentials with username
   - Validation: Verify token can be decoded and contains correct claims

2. **Login with email and password**
   - Expected: 200 OK with token and user information
   - Test: Send valid credentials with email instead of username
   - Validation: Same user should be authenticated as with username login

3. **Login with tenant context**
   - Expected: 200 OK with token containing tenant claims
   - Test: Send valid credentials with tenant ID
   - Validation: Verify token includes tenant context in claims

### Authentication Failure Scenarios

1. **Invalid username**
   - Expected: 401 Unauthorized
   - Test: Send login request with non-existent username
   - Validation: Confirm error message is generic "Invalid username or password"

2. **Invalid password**
   - Expected: 401 Unauthorized
   - Test: Send login request with correct username but wrong password
   - Validation: Confirm error message is generic "Invalid username or password"

3. **Account locked after multiple failures**
   - Expected: 403 Forbidden after exceeding max attempts
   - Test: Submit multiple failed login attempts, then try with correct password
   - Validation: Confirm account is locked and returns appropriate error

### Security Scenarios

1. **CSRF protection**
   - Expected: 403 Forbidden
   - Test: Send request without X-CSRF-Token header
   - Validation: Confirm error message about missing CSRF token

2. **Rate limiting**
   - Expected: 429 Too Many Requests
   - Test: Submit many login requests in a short time period
   - Validation: Confirm rate limiting kicks in and returns appropriate error

3. **JWT token security**
   - Expected: Token with appropriate claims and expiration
   - Test: Login successfully and decode the token
   - Validation: Verify claims include user ID, role, and appropriate expiration

### Multi-tenant Scenarios

1. **User belongs to multiple tenants**
   - Expected: 200 OK with list of tenants in user data
   - Test: Login as user with access to multiple tenants
   - Validation: Verify response includes complete array of accessible tenants with roles and permissions for each

2. **Login with specific tenant context**
   - Expected: 200 OK with token scoped to specific tenant
   - Test: Login with tenant parameter set
   - Validation: Verify token contains tenant-specific claims and correct tenant-specific permissions

3. **Login without tenant specification (multi-tenant user)**
   - Expected: 200 OK with token for default tenant
   - Test: Login as multi-tenant user without specifying tenant
   - Validation: Verify token contains claims for user's primary/default tenant

4. **Login with invalid tenant**
   - Expected: 403 Forbidden
   - Test: Login with tenant ID that user doesn't have access to
   - Validation: Verify authentication fails with appropriate tenant access error

5. **Super-admin login behavior**
   - Expected: 200 OK with all tenant access
   - Test: Login as super-admin user
   - Validation: Verify token contains elevated privileges and system-wide tenant access indicators

6. **Login with tenant-specific role restrictions**
   - Expected: 200 OK with tenant-appropriate permissions
   - Test: Login as user with different roles across tenants
   - Validation: Verify token contains only permissions appropriate for the specified tenant

### Authorization Context Handling

1. **Tenant-specific permission scoping**
   - Expected: Token should encode tenant-specific permissions
   - Test: Login with user having different roles in different tenants
   - Validation: Verify permission claims in token match the tenant context

2. **Cross-tenant authorized operations**
   - Expected: Token should contain appropriate cross-tenant identifiers
   - Test: Login as user with cross-tenant privileges
   - Validation: Verify token contains any cross-tenant operation permissions

## Implementation Notes

- Implement clear separation between authentication logic and business logic
- Use secure JWT algorithm (HS256 or stronger)
- Store authentication events for audit purposes
- Test both production and development environments
- Consider separate token-based authentication and session-based authentication options
- Include refresh token mechanism to extend sessions securely
- Support standard OAuth flows for third-party integrations
- Implement tenant isolation in all data retrieval operations
- Consider using tenant-specific key prefixes for data storage
- Implement tenant context propagation throughout the application stack
- Cache tenant permission matrices for improved performance
- Support dynamic tenant switching without requiring full re-authentication