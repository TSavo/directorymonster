# POST /api/auth/setup API Testing Specification

## Overview

This endpoint handles the initial setup of the system by creating the first admin user and a default site. It should only work when no users exist in the system, providing a secure bootstrapping process for fresh installations.

## Requirements

### Functional Requirements

1. Create the first admin user with provided credentials
2. Create an initial site with the provided name
3. Generate and return JWT authentication token
4. Link the created user with the initial site
5. Prevent multiple initialization attempts

### Security Requirements

1. Validate CSRF token to prevent cross-site request forgery
2. Hash the password securely using Zero-Knowledge Proof (ZKP) authentication
3. Generate a secure random salt for password hashing
4. Set appropriate role ("admin") for the first user
5. Generate unique IDs for user and site

### Performance Requirements

1. Response time should be < 1000ms
2. Implement proper error handling
3. Provide meaningful error messages for validation failures

## API Specification

### Request

- Method: POST
- Path: /api/auth/setup
- Headers:
  - Content-Type: application/json
  - X-CSRF-Token: {CSRF token} (required except in test environment)
- Body:
  ```json
  {
    "username": "admin",
    "password": "securePassword123",
    "email": "admin@example.com", // Optional
    "siteName": "My Directory Site"
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "role": "admin",
    "id": "user-uuid-here"
  },
  "site": {
    "id": "site-uuid-here",
    "name": "My Directory Site",
    "slug": "my-directory-site"
  }
}
```

#### Missing Required Fields (400 Bad Request)

```json
{
  "success": false,
  "error": "Missing required fields"
}
```

#### Users Already Exist (403 Forbidden)

```json
{
  "success": false,
  "error": "Users already exist in the system"
}
```

#### Missing CSRF Token (403 Forbidden)

```json
{
  "success": false,
  "error": "Missing CSRF token"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Server error during setup"
}
```

## Testing Scenarios

### Success Scenarios

1. **First-time setup with all required fields**
   - Expected: 200 OK with user, site, and token
   - Test: Send valid POST request with all required fields
   - Validation: Verify response contains token, user info, and site info

2. **First-time setup with optional email field**
   - Expected: 200 OK with user, site, and token
   - Test: Send valid POST request including email field
   - Validation: Verify user is created with email

3. **Site slug generation from site name**
   - Expected: Site slug is properly generated from site name
   - Test: Provide site name with spaces and special characters
   - Validation: Verify slug is normalized (lowercase, hyphens, etc.)

### Validation Failure Scenarios

1. **Missing username**
   - Expected: 400 Bad Request
   - Test: Send POST request without username
   - Validation: Confirm error message is "Missing required fields"

2. **Missing password**
   - Expected: 400 Bad Request
   - Test: Send POST request without password
   - Validation: Confirm error message is "Missing required fields"

3. **Missing siteName**
   - Expected: 400 Bad Request
   - Test: Send POST request without siteName
   - Validation: Confirm error message is "Missing required fields"

### Security Scenarios

1. **Missing CSRF token**
   - Expected: 403 Forbidden
   - Test: Send request without X-CSRF-Token header
   - Validation: Confirm error message is "Missing CSRF token"

2. **Attempt setup when users already exist**
   - Expected: 403 Forbidden
   - Test: Create a user, then send a setup request
   - Validation: Confirm error message is "Users already exist in the system"

3. **Password security through ZKP**
   - Expected: Password is not stored in plaintext
   - Test: Set up user, then check Redis for user data
   - Validation: Verify Redis has publicKey and salt but no plaintext password

### Redis Data Integrity Scenarios

1. **User data in Redis after setup**
   - Expected: User data is stored in Redis with correct format
   - Test: Complete setup, then retrieve user data from Redis
   - Validation: Verify Redis user key format and fields

2. **Site data in Redis after setup**
   - Expected: Site data is stored in Redis with correct format
   - Test: Complete setup, then retrieve site data from Redis
   - Validation: Verify Redis site key and fields

3. **Domain mapping in Redis**
   - Expected: 'localhost' domain is mapped to the created site
   - Test: Complete setup, then check domain mapping
   - Validation: Verify 'domains:localhost' key exists and maps to site ID

### Token Validation Scenarios

1. **JWT token validity**
   - Expected: Generated token contains correct claims
   - Test: Complete setup, decode the returned token
   - Validation: Verify token contains username, role, and userId

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios
- Implement token validation utilities to verify JWT content
- Create test utilities to check Redis data integrity after setup
- Include test cases for both test environment and production environment
- For each test, ensure Redis is empty before starting (or mock Redis)
- Test CSRF validation with special handling for test environment
