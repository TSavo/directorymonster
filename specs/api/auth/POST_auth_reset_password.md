# POST /api/auth/reset-password API Specification

## Overview

This endpoint initiates or completes a password reset process for users who have forgotten their passwords. The endpoint should handle both the initial request (with email only) and the password reset completion (with token and new password).

## Requirements

### Functional Requirements

1. Support two-step password reset flow:
   a. Request a reset token (email only)
   b. Reset password with token (token + new password)
2. Generate secure, time-limited reset tokens
3. Send password reset instructions via email
4. Validate new password complexity
5. Update user's password securely
6. Invalidate old password and active sessions

### Security Requirements

1. Time-limited reset tokens (typically 24 hours)
2. One-time use reset tokens
3. Secure token generation and validation
4. Rate limiting for reset requests
5. Log password reset events for security auditing
6. Secure password hashing for new password

### Performance Requirements

1. Response time should be < 300ms
2. Separate email sending from API response
3. Implement proper error handling with user-friendly messages
4. Handle concurrent reset requests for the same user

## API Specification

### Request (Initiate Reset)

- Method: POST
- Path: /api/auth/reset-password
- Headers:
  - Content-Type: application/json
  - X-CSRF-Token: {CSRF token} (required except in test environment)
- Body:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Response (Initiate Reset)

#### Success (200 OK)

```json
{
  "success": true,
  "message": "If the email exists in our system, reset instructions have been sent"
}
```

### Request (Complete Reset)

- Method: POST
- Path: /api/auth/reset-password
- Headers:
  - Content-Type: application/json
  - X-CSRF-Token: {CSRF token} (required except in test environment)
- Body:
  ```json
  {
    "token": "reset-token-from-email",
    "password": "newSecurePassword123"
  }
  ```

### Response (Complete Reset)

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

#### Invalid or Expired Token (400 Bad Request)

```json
{
  "success": false,
  "error": "Invalid or expired password reset token"
}
```

#### Password Validation Error (400 Bad Request)

```json
{
  "success": false,
  "error": "Password must be at least 8 characters with at least one number and one special character"
}
```

#### Rate Limited (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Too many reset attempts. Please try again later.",
  "retryAfter": 300
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Password reset failed"
}
```

## Testing Scenarios

### Initiate Reset Scenarios

1. **Request reset for existing email**
   - Expected: 200 OK with success message
   - Test: Send request with valid email address
   - Validation: Verify reset token is generated and email is queued

2. **Request reset for non-existent email**
   - Expected: 200 OK with same message as valid email
   - Test: Send request with unknown email address
   - Validation: Verify no token is generated but same response is returned (security through obscurity)

3. **Request reset with malformed email**
   - Expected: 400 Bad Request
   - Test: Send request with invalid email format
   - Validation: Verify appropriate error response

### Complete Reset Scenarios

1. **Reset with valid token and password**
   - Expected: 200 OK with success message
   - Test: Send request with valid token and compliant new password
   - Validation: Verify password is updated and user can login with new password

2. **Reset with expired token**
   - Expected: 400 Bad Request
   - Test: Send request with expired token
   - Validation: Verify appropriate error response

3. **Reset with invalid token**
   - Expected: 400 Bad Request
   - Test: Send request with invalid token
   - Validation: Verify appropriate error response

4. **Reset with weak password**
   - Expected: 400 Bad Request
   - Test: Send request with valid token but weak password
   - Validation: Verify appropriate error with password requirements

### Security Scenarios

1. **Rate limiting on initiate reset**
   - Expected: 429 Too Many Requests after threshold
   - Test: Send multiple reset requests for same email
   - Validation: Verify rate limiting is applied

2. **CSRF protection**
   - Expected: 403 Forbidden
   - Test: Send request without CSRF token
   - Validation: Verify appropriate error response

3. **Token uniqueness and security**
   - Expected: Each token is unique and secure
   - Test: Request multiple resets and analyze tokens
   - Validation: Verify tokens are sufficiently random and unique

4. **Session invalidation after password reset**
   - Expected: Existing sessions are invalidated
   - Test: Reset password while having active sessions
   - Validation: Verify existing tokens are invalidated after reset

## Implementation Notes

- Implement token expiration with Redis TTL or similar mechanism
- Use secure random token generation with sufficient entropy
- Consider implementing progressive delays for sequential reset attempts
- Keep reset token length sufficient for security (min 32 characters)
- Log reset attempts with timestamps but without including tokens
- Use HTTPS for all communication to prevent token interception