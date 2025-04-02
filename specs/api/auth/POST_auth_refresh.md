# POST /api/auth/refresh API Testing Specification

## Overview

This endpoint refreshes an existing JWT authentication token, extending the session lifetime. It verifies the current token is valid, checks that the associated user still exists and is not locked, then issues a new token.

## Requirements

### Functional Requirements

1. Validate the existing JWT token
2. Verify the user associated with the token exists and is not locked
3. Generate and return a new JWT token with updated expiry time
4. Maintain the same claims (username, role, userId) in the new token

### Security Requirements

1. Validate token signature using the JWT secret
2. Verify token hasn't been tampered with
3. Check that the user hasn't been locked or deleted since the token was issued
4. Generate the new token with the same security parameters

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper error handling
3. Log token refresh attempts (especially failures)

## API Specification

### Request

- Method: POST
- Path: /api/auth/refresh
- Headers:
  - Authorization: Bearer {JWT token}
- Body: (empty)

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Invalid Token Format (401 Unauthorized)

```json
{
  "success": false,
  "error": "Invalid token format"
}
```

#### Invalid or Expired Token (401 Unauthorized)

```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Token refresh failed"
}
```

## Testing Scenarios

### Success Scenarios

1. **Refresh a valid token**
   - Expected: 200 OK with new token
   - Test: Create valid token, send refresh request, verify new token is returned
   - Validation: Decode new token and verify claims match original

2. **Refresh maintains same claims**
   - Expected: New token with same username, role, and userId
   - Test: Create token with specific claims, refresh, decode new token
   - Validation: Compare claims in original and new token

3. **Refresh extends expiration time**
   - Expected: New token with later expiration time
   - Test: Create token, wait briefly, refresh, decode both tokens
   - Validation: Verify exp claim in new token is later than original

### Authentication Failure Scenarios

1. **Missing Authorization header**
   - Expected: 401 Unauthorized
   - Test: Send request without Authorization header
   - Validation: Confirm error message is "Invalid token format"

2. **Malformed Authorization header**
   - Expected: 401 Unauthorized
   - Test: Send request with incorrect Authorization format (missing "Bearer" prefix)
   - Validation: Confirm error message is "Invalid token format"

3. **Invalid JWT token**
   - Expected: 401 Unauthorized
   - Test: Send request with tampered JWT token
   - Validation: Confirm error message is "Invalid or expired token"

4. **Expired JWT token**
   - Expected: 401 Unauthorized
   - Test: Create token with short expiry, wait until expired, attempt refresh
   - Validation: Confirm error message is "Invalid or expired token"

### User Validation Scenarios

1. **Token for deleted user**
   - Expected: 401 Unauthorized
   - Test: Create valid token, delete user from Redis, attempt refresh
   - Validation: Confirm error message is "Invalid or expired token"

2. **Token for locked user**
   - Expected: 401 Unauthorized
   - Test: Create valid token, mark user as locked in Redis, attempt refresh
   - Validation: Confirm error message is "Invalid or expired token"

### Error Handling Scenarios

1. **Redis connection failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis connection failure, attempt refresh
   - Validation: Confirm error message is "Token refresh failed"

2. **JWT verification throws exception**
   - Expected: 401 Unauthorized
   - Test: Send badly formatted token that causes exception in verification
   - Validation: Confirm error message is "Invalid or expired token"

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create helper utilities for JWT token generation and verification
- Create mocks for Redis client to simulate different user states
- Test both happy path and various failure scenarios
- Include test cases for token expiration
- Verify token claims to ensure identity preservation
- Test with various JWT token formats including malformed ones
