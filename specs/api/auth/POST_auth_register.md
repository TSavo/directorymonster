# POST /api/auth/register API Specification

## Overview

This endpoint handles user registration for the DirectoryMonster platform. It should create new user accounts, validate input data, and establish the initial user state without requiring administrator privileges.

## Requirements

### Functional Requirements

1. Create a new user account with provided registration details
2. Validate all user input data for format and uniqueness
3. Support optional email verification workflow
4. Associate new users with appropriate tenant(s)
5. Assign default user role and permissions
6. Return appropriate user information without sensitive data

### Security Requirements

1. Hash passwords securely using Zero-Knowledge Proof (ZKP) authentication
2. Generate unique user identifiers securely
3. Validate CSRF token to prevent cross-site request forgery
4. Implement rate limiting for registration attempts
5. Include anti-bot mechanisms (e.g., CAPTCHA/reCAPTCHA)
6. Log registration events for security auditing

### Performance Requirements

1. Response time should be < 500ms
2. Handle concurrent registration requests appropriately
3. Implement proper error handling with clear validation messages
4. Scale effectively under high load

## API Specification

### Request

- Method: POST
- Path: /api/auth/register
- Headers:
  - Content-Type: application/json
  - X-CSRF-Token: {CSRF token} (required except in test environment)
- Body:
  ```json
  {
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "securePassword123",
    "firstName": "John", // Optional
    "lastName": "Doe", // Optional
    "tenantId": "tenant-uuid", // Optional, for invited users
    "inviteToken": "invite-token" // Optional, for invited users
  }
  ```

### Response

#### Success (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user-uuid-here",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false,
    "createdAt": "2025-04-02T10:30:00Z"
  },
  "verificationRequired": true // Whether email verification is required
}
```

#### Email Already Exists (409 Conflict)

```json
{
  "success": false,
  "error": "Email address is already registered"
}
```

#### Username Already Exists (409 Conflict)

```json
{
  "success": false,
  "error": "Username is already taken"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters with at least one number and one special character"
    }
  ]
}
```

#### Registration Closed (403 Forbidden)

```json
{
  "success": false,
  "error": "Registration is currently closed or by invitation only"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Registration failed due to a server error"
}
```

## Testing Scenarios

### Success Scenarios

1. **Register new user with all fields**
   - Expected: 201 Created with user information
   - Test: Send valid registration request with all fields
   - Validation: Verify user is created in system with correct information

2. **Register with invitation token**
   - Expected: 201 Created with user in correct tenant
   - Test: Send registration with valid invitation token
   - Validation: Verify user is associated with correct tenant

3. **Register without optional fields**
   - Expected: 201 Created with user information
   - Test: Send valid registration with only required fields
   - Validation: Verify user is created with default values for optional fields

### Validation Failure Scenarios

1. **Invalid email format**
   - Expected: 400 Bad Request
   - Test: Send registration with malformed email
   - Validation: Confirm error message about invalid email format

2. **Email already registered**
   - Expected: 409 Conflict
   - Test: Try to register with email of existing user
   - Validation: Confirm error message about email already in use

3. **Username already taken**
   - Expected: 409 Conflict
   - Test: Try to register with username of existing user
   - Validation: Confirm error message about username already taken

4. **Weak password**
   - Expected: 400 Bad Request
   - Test: Send registration with simple password
   - Validation: Confirm error message about password requirements

### Security Scenarios

1. **CSRF protection**
   - Expected: 403 Forbidden
   - Test: Send request without X-CSRF-Token header
   - Validation: Confirm error message about missing CSRF token

2. **Rate limiting**
   - Expected: 429 Too Many Requests
   - Test: Submit many registration requests in a short time period
   - Validation: Confirm rate limiting kicks in and returns appropriate error

3. **Password security**
   - Expected: Password is stored securely
   - Test: Register user, check database
   - Validation: Verify password is not stored in plain text

### Tenant Association Scenarios

1. **Registration with valid invitation**
   - Expected: 201 Created with user in correct tenant
   - Test: Register with valid invitation token
   - Validation: Verify user has correct tenant access

2. **Registration with invalid invitation**
   - Expected: 400 Bad Request
   - Test: Register with expired or invalid invitation token
   - Validation: Confirm error message about invalid invitation

### Email Verification Scenarios

1. **Verification email sent on registration**
   - Expected: Email sent and verification status set to false
   - Test: Register new user, check email queue
   - Validation: Verify email was queued and user state reflects verification needed

## Implementation Notes

- Implement strong validation for all user input
- Use secure methods for generating user IDs
- Consider implementing progressive registration for complex user profiles
- Test registration flow in both standalone and invitation-based contexts
- Implement clear error messages for all validation failures
- Consider supporting social login integration in future versions