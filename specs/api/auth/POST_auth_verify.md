# POST /api/auth/verify API Specification

## Overview

This endpoint handles email verification for new user registrations or email changes. It validates the verification token sent to the user's email and updates their account status accordingly.

## Requirements

### Functional Requirements

1. Validate email verification tokens
2. Mark user emails as verified upon successful verification
3. Support re-sending verification emails
4. Handle expired verification tokens
5. Update user record with verification timestamp
6. Support verification for new accounts and email changes
7. Handle tenant-specific verification contexts

### Security Requirements

1. Time-limited verification tokens (typically 7 days)
2. One-time use verification tokens
3. Secure token generation and validation
4. Log verification events for security auditing
5. Rate limiting for verification attempts
6. Ensure tenant isolation for verification tokens

### Performance Requirements

1. Response time should be < 300ms
2. Optimize for mobile and slow connections
3. Clear success/failure messages for user experience
4. Implement proper error handling

## API Specification

### Request (Verify Email)

- Method: POST
- Path: /api/auth/verify
- Headers:
  - Content-Type: application/json
  - X-Tenant-ID: {tenant ID} (optional, for multi-tenant context)
- Body:
  ```json
  {
    "token": "verification-token-from-email"
  }
  ```

### Response (Verify Email)

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "user-uuid-here",
    "email": "verified@example.com",
    "isEmailVerified": true,
    "verifiedAt": "2025-04-02T12:34:56Z"
  }
}
```

#### Invalid or Expired Token (400 Bad Request)

```json
{
  "success": false,
  "error": "Invalid or expired verification token"
}
```

### Request (Resend Verification)

- Method: POST
- Path: /api/auth/verify/resend
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer {JWT token} (optional, if user is logged in)
  - X-Tenant-ID: {tenant ID} (optional, for multi-tenant context)
- Body:
  ```json
  {
    "email": "unverified@example.com",
    "tenantId": "tenant-uuid" // Optional, for specific tenant verification
  }
  ```

### Response (Resend Verification)

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Verification email has been sent"
}
```

#### Rate Limited (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Too many verification attempts. Please try again later.",
  "retryAfter": 300
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to process verification"
}
```

## Testing Scenarios

### Verification Scenarios

1. **Verify with valid token**
   - Expected: 200 OK with success message and user data
   - Test: Send request with valid verification token
   - Validation: Verify user's email is marked as verified in database

2. **Verify with expired token**
   - Expected: 400 Bad Request
   - Test: Send request with expired verification token
   - Validation: Verify appropriate error response and email remains unverified

3. **Verify with invalid token**
   - Expected: 400 Bad Request
   - Test: Send request with malformed or invalid token
   - Validation: Verify appropriate error response

4. **Verify already verified email**
   - Expected: 200 OK or 400 Bad Request (implementation-dependent)
   - Test: Try to verify an already verified email
   - Validation: Verify appropriate response indicates email is already verified

### Resend Verification Scenarios

1. **Resend for unverified email**
   - Expected: 200 OK with success message
   - Test: Request verification email for unverified account
   - Validation: Verify new token is generated and email is queued

2. **Resend for verified email**
   - Expected: 400 Bad Request
   - Test: Request verification for already verified email
   - Validation: Verify appropriate error response

3. **Resend with invalid email**
   - Expected: 200 OK (to prevent email enumeration)
   - Test: Request verification for non-existent email
   - Validation: Verify response is identical to valid email case

### Security Scenarios

1. **Rate limiting on resend requests**
   - Expected: 429 Too Many Requests after threshold
   - Test: Send multiple resend requests for same email
   - Validation: Verify rate limiting is applied

2. **Token security**
   - Expected: Tokens should be unique and secure
   - Test: Request verification emails and analyze tokens
   - Validation: Verify tokens have sufficient entropy and uniqueness

3. **User identification after verification**
   - Expected: User data returned doesn't include sensitive information
   - Test: Complete verification and check returned user object
   - Validation: Verify no sensitive fields are included in response

### Multi-tenant Verification Scenarios

1. **Tenant-specific verification token**
   - Expected: Token should be scoped to specific tenant
   - Test: Request verification in tenant context, verify in same context
   - Validation: Verification succeeds and updates tenant-specific verification status

2. **Cross-tenant verification attempt**
   - Expected: 403 Forbidden or 400 Bad Request
   - Test: Request verification in one tenant context, verify in different tenant
   - Validation: Verify operation fails with appropriate error

3. **Global verification with tenant-specific fallback**
   - Expected: 200 OK with correct tenant context
   - Test: Verify with global token but include tenant header
   - Validation: Verification succeeds with correct tenant association

4. **Multiple tenant verification propagation**
   - Expected: Verification status potentially propagates to related tenants
   - Test: Verify email in one tenant, check status in related tenants
   - Validation: Verify behavior matches system requirements for verification propagation

### Tenant Context Handling

1. **Default tenant selection**
   - Expected: System selects appropriate default tenant
   - Test: Verify without explicit tenant context
   - Validation: Verification succeeds with appropriate tenant association

2. **Multi-tenant user email updates**
   - Expected: Email changes affect all associated tenant profiles
   - Test: Change and verify email for multi-tenant user
   - Validation: Verify behavior matches system requirements for tenant profile updates

## Implementation Notes

- Implement token expiration with Redis TTL or similar mechanism
- Use secure random token generation (min 32 characters)
- Consider implementing a verification landing page for better UX
- Implement clear error messages for expired tokens with resend option
- Track verification attempts in Redis or similar for rate limiting
- Consider token hashing in database for additional security
- Consider implementing notification when verification is complete
- Store tenant context within verification tokens when applicable
- Use tenant-specific key prefixes for verification token storage
- Implement token lookup strategies that respect tenant boundaries
- Consider verification status propagation rules between related tenants
- Document tenant verification policies in user onboarding materials