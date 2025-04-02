# POST /api/admin/users API Specification

## Overview

This endpoint creates a new user in the system. It allows administrators to set up user accounts with appropriate profiles, roles, permissions, and tenant/site access. The endpoint handles validation, secure password setup, and initial user configuration.

## Requirements

### Functional Requirements

1. Create new user accounts with basic profile information
2. Assign appropriate roles and permissions
3. Configure tenant and site access
4. Set initial account status
5. Generate secure temporary passwords or trigger invitation workflows
6. Support single sign-on and external authentication setup
7. Allow custom metadata for organization-specific user attributes

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'user:create' permission
3. Enforce tenant isolation (admins can only create users in their tenant)
4. Super admins can create users across tenants
5. Sanitize and validate all input data
6. Generate secure temporary passwords if needed
7. Log all user creation for audit purposes
8. Enforce password complexity requirements

### Performance Requirements

1. Response time should be < 500ms for user creation
2. Handle concurrent user creation requests
3. Implement efficient validation checks
4. Properly index relevant database fields

## API Specification

### Request

- Method: POST
- Path: /api/admin/users
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:

```json
{
  "username": "newuser2025",
  "email": "new.user@example.com",
  "firstName": "New",
  "lastName": "User",
  "role": "editor",
  "status": "active",
  "generateTemporaryPassword": true,
  "password": null,
  "requirePasswordChange": true,
  "tenants": [
    {
      "id": "tenant_1234",
      "role": "editor"
    }
  ],
  "sites": [
    {
      "id": "site_5678",
      "role": "contributor"
    },
    {
      "id": "site_9012",
      "role": "viewer"
    }
  ],
  "phoneNumber": "+19876543210",
  "timezone": "America/New_York",
  "locale": "en-US",
  "sendWelcomeEmail": true,
  "metadata": {
    "department": "Marketing",
    "employeeId": "EMP12345",
    "startDate": "2025-04-15"
  },
  "mfaEnabled": false,
  "mfaRequired": false,
  "externalAuthProviders": {
    "google": "google_id_12345",
    "azure": null
  }
}
```

### Response

#### Success (201 Created)

```json
{
  "user": {
    "id": "user_9876543210",
    "username": "newuser2025",
    "email": "new.user@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "editor",
    "status": "active",
    "emailVerified": false,
    "phoneNumber": "+19876543210",
    "phoneVerified": false,
    "tenants": [
      {
        "id": "tenant_1234",
        "name": "Main Organization",
        "role": "editor"
      }
    ],
    "sites": [
      {
        "id": "site_5678",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear",
        "role": "contributor"
      },
      {
        "id": "site_9012",
        "name": "Camping Equipment Reviews",
        "slug": "camping-equipment",
        "role": "viewer"
      }
    ],
    "timezone": "America/New_York",
    "locale": "en-US",
    "createdAt": "2025-04-02T16:30:00Z",
    "createdBy": {
      "id": "user_admin123",
      "username": "admin_user"
    },
    "mfaEnabled": false,
    "externalAuthProviders": ["google"]
  },
  "inviteStatus": {
    "emailSent": true,
    "temporaryPasswordGenerated": true,
    "expiresAt": "2025-04-09T16:30:00Z"
  },
  "temporaryCredentials": {
    "password": "TempP@ss123!",
    "validUntil": "2025-04-09T16:30:00Z"
  }
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "role",
      "message": "Invalid role specified"
    }
  ]
}
```

#### Conflict (409 Conflict)

```json
{
  "error": "User creation conflict",
  "details": [
    {
      "field": "email",
      "message": "Email address is already in use"
    },
    {
      "field": "username",
      "message": "Username is already taken"
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
  "error": "Insufficient permissions to create users"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to create user"
}
```

## Testing Scenarios

### Success Scenarios

1. **Basic user creation**
   - Expected: 201 Created with user details
   - Test: Send request with valid user data
   - Validation: Verify user is created with correct attributes

2. **User creation with temporary password**
   - Expected: 201 Created with user details and temporary credentials
   - Test: Send request with generateTemporaryPassword=true
   - Validation: Verify temporary password is generated and included in response

3. **User creation with welcome email**
   - Expected: 201 Created with email confirmation
   - Test: Send request with sendWelcomeEmail=true
   - Validation: Verify welcome email is sent and inviteStatus reflects this

4. **User creation with external auth provider**
   - Expected: 201 Created with external auth configuration
   - Test: Send request with externalAuthProviders data
   - Validation: Verify user is created with external auth mapping

5. **Super admin creating user in different tenant**
   - Expected: 201 Created with cross-tenant user
   - Test: Super admin creates user in specified tenant
   - Validation: Verify user is created in correct tenant

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 403 Forbidden
   - Test: Site admin tries to create user in different tenant
   - Validation: Verify admin cannot create users outside their tenant

3. **Role limitation enforcement**
   - Expected: 403 Forbidden
   - Test: Admin tries to create user with higher role than they possess
   - Validation: Verify role elevation is prevented

### Edge Cases & Validation Scenarios

1. **Invalid email format**
   - Expected: 400 Bad Request
   - Test: Send request with invalid email format
   - Validation: Verify appropriate validation error response

2. **Duplicate email**
   - Expected: 409 Conflict
   - Test: Send request with email that already exists
   - Validation: Verify appropriate conflict error response

3. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send request missing required user attributes
   - Validation: Verify validation error for missing fields

4. **Invalid tenant or site IDs**
   - Expected: 400 Bad Request
   - Test: Send request with non-existent tenant/site IDs
   - Validation: Verify appropriate error response

5. **Password complexity requirements**
   - Expected: 400 Bad Request
   - Test: Send request with weak password
   - Validation: Verify password complexity validation

6. **Custom metadata validation**
   - Expected: Success or validation error based on metadata schema
   - Test: Send request with various metadata structures
   - Validation: Verify metadata is stored correctly or validated appropriately

## Implementation Notes

- Implement comprehensive input validation
- Check email and username uniqueness before creation
- Use proper password hashing
- Implement secure temporary password generation
- Consider email verification workflows
- Implement proper database transactions
- Apply tenant isolation at database query level
- Consider rate limiting for user creation
- Implement proper audit logging
- Consider integration with notification services for welcome emails
- Validate all roles against admin's own permissions
- Consider field-level permission checking for privileged attributes