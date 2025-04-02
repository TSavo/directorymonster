# PUT /api/admin/users/:id API Specification

## Overview

This endpoint updates an existing user in the system. It allows administrators to modify user profiles, change roles and permissions, update tenant/site access, and manage user account status. The endpoint supports partial updates and handles validation of all modified fields.

## Requirements

### Functional Requirements

1. Update user profile information (name, email, etc.)
2. Modify user roles and permissions
3. Update tenant and site assignments
4. Change user status (active, suspended, locked)
5. Update authentication settings and methods
6. Support password resets and MFA configuration
7. Allow metadata updates

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'user:update' permission
3. Enforce tenant isolation (admins can only update users in their tenant)
4. Super admins can update users across tenants
5. Sanitize and validate all input data
6. Prevent privilege escalation attacks
7. Log all user updates for audit purposes
8. Implement proper validation for sensitive operations

### Performance Requirements

1. Response time should be < 500ms for typical updates
2. Efficiently handle concurrent update requests
3. Implement optimistic locking or versioning for race conditions
4. Cache invalidation for updated user data

## API Specification

### Request

- Method: PUT
- Path: /api/admin/users/:id
- Path Parameters:
  - `id`: (string, required) - The ID of the user to update
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:

```json
{
  "username": "updated_user2025",
  "email": "updated.user@example.com",
  "firstName": "Updated",
  "lastName": "User",
  "role": "manager",
  "status": "active",
  "resetPassword": false,
  "password": "NewSecureP@ssw0rd456!",
  "requirePasswordChange": false,
  "tenants": [
    {
      "id": "tenant_1234",
      "role": "manager"
    }
  ],
  "sites": [
    {
      "id": "site_5678",
      "role": "admin"
    },
    {
      "id": "site_9012",
      "role": "contributor"
    }
  ],
  "phoneNumber": "+1987654321",
  "timezone": "Europe/London",
  "locale": "en-GB",
  "metadata": {
    "department": "Product",
    "employeeId": "EMP67890",
    "notes": "Promoted in April restructuring"
  },
  "mfaEnabled": true,
  "mfaRequired": true
}
```

### Response

#### Success (200 OK)

```json
{
  "user": {
    "id": "user_1234567890",
    "username": "updated_user2025",
    "email": "updated.user@example.com",
    "firstName": "Updated",
    "lastName": "User",
    "role": "manager",
    "status": "active",
    "emailVerified": true,
    "phoneNumber": "+1987654321",
    "phoneVerified": true,
    "tenants": [
      {
        "id": "tenant_1234",
        "name": "Main Organization",
        "role": "manager"
      }
    ],
    "sites": [
      {
        "id": "site_5678",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear",
        "role": "admin"
      },
      {
        "id": "site_9012",
        "name": "Camping Equipment Reviews",
        "slug": "camping-equipment",
        "role": "contributor"
      }
    ],
    "timezone": "Europe/London",
    "locale": "en-GB",
    "createdAt": "2024-08-01T10:15:30Z",
    "updatedAt": "2025-04-02T16:45:20Z",
    "updatedBy": {
      "id": "user_admin123",
      "username": "admin_user"
    },
    "mfaEnabled": true,
    "lastLogin": "2025-03-28T09:12:33Z"
  },
  "changes": [
    "username",
    "email",
    "firstName",
    "lastName",
    "role",
    "phoneNumber",
    "timezone",
    "locale",
    "sites",
    "metadata",
    "mfaEnabled"
  ],
  "notifications": {
    "emailUpdateVerificationSent": true,
    "passwordResetCompleted": false
  }
}
```

#### Not Found (404 Not Found)

```json
{
  "error": "User not found"
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
  "error": "Update conflict",
  "details": [
    {
      "field": "email",
      "message": "Email address is already in use by another user"
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
  "error": "Insufficient permissions to update this user"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to update user"
}
```

## Testing Scenarios

### Success Scenarios

1. **Basic profile update**
   - Expected: 200 OK with updated user details
   - Test: Send request updating name and contact details
   - Validation: Verify user profile is updated correctly

2. **Role and permission changes**
   - Expected: 200 OK with updated role
   - Test: Send request changing user role
   - Validation: Verify user has new role and associated permissions

3. **Site/tenant assignment changes**
   - Expected: 200 OK with updated site assignments
   - Test: Send request with modified sites array
   - Validation: Verify user has updated site access

4. **Status change (suspend/activate)**
   - Expected: 200 OK with updated status
   - Test: Send request changing status to suspended/active
   - Validation: Verify user status is updated and access is affected

5. **Password reset**
   - Expected: 200 OK with password reset confirmation
   - Test: Send request with resetPassword=true and new password
   - Validation: Verify password is updated and user can log in with new password

6. **MFA configuration**
   - Expected: 200 OK with updated MFA settings
   - Test: Send request enabling/requiring MFA
   - Validation: Verify MFA settings are updated

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 403 Forbidden or 404 Not Found
   - Test: Send request as site admin trying to update user in different tenant
   - Validation: Verify admin cannot update users outside their tenant

3. **Permission escalation attempt**
   - Expected: 403 Forbidden
   - Test: Send request where admin tries to assign higher privileges than they possess
   - Validation: Verify permission escalation is prevented

### Edge Cases & Validation Scenarios

1. **Invalid email update**
   - Expected: 400 Bad Request
   - Test: Send request with invalid email format
   - Validation: Verify appropriate validation error response

2. **Duplicate email conflict**
   - Expected: 409 Conflict
   - Test: Send request with email that belongs to another user
   - Validation: Verify appropriate conflict error response

3. **Update non-existent user**
   - Expected: 404 Not Found
   - Test: Send request with invalid user ID
   - Validation: Verify user not found error

4. **Partial update handling**
   - Expected: 200 OK with only requested fields updated
   - Test: Send request with minimal fields to update
   - Validation: Verify only specified fields are modified

5. **Super admin updating protected user**
   - Expected: 200 OK or 403 Forbidden based on system policy
   - Test: Attempt to update a protected system user
   - Validation: Verify system behavior for protected accounts

6. **Self-update restrictions**
   - Expected: Success with limitations or error based on system policy
   - Test: Admin tries to downgrade their own privileges
   - Validation: Verify system prevents harmful self-modifications

## Implementation Notes

- Implement comprehensive input validation for all updated fields
- Check email uniqueness before applying update
- Use proper password hashing for any password updates
- Implement change tracking for auditing purposes
- Send verification emails for sensitive changes (e.g., email updates)
- Consider sending notifications for significant changes (status, role)
- Implement proper database transactions for complex updates
- Consider optimistic locking to prevent update conflicts
- Validate all role changes against admin's own permissions
- Apply tenant isolation at database query level
- Implement special handling for self-updates by admins
- Consider field-level permission checking for fine-grained control
- Cache invalidation for updated user data