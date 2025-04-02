# GET /api/admin/users/:id API Specification

## Overview

This endpoint retrieves detailed information about a specific user in the system. It provides comprehensive user data for administrative purposes, including role assignments, tenant memberships, and additional metadata not exposed through the regular user API.

## Requirements

### Functional Requirements

1. Return detailed information about a specific user
2. Include complete role and permission information
3. Include tenant memberships and site access details
4. Include user activity statistics
5. Provide usage and subscription information
6. Return information about user's authentication methods

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'user:read' permission
3. Enforce tenant isolation (administrators can only see users within their tenant scope)
4. Super admins can see users across all tenants
5. Sanitize sensitive information based on permissions
6. Log access for audit purposes
7. Prevent inferencing attacks through careful error handling

### Performance Requirements

1. Response time should be < 300ms for typical requests
2. Efficiently retrieve related data in minimal queries
3. Cache user data for frequently accessed admin users
4. Support selective field retrieval for optimized responses

## API Specification

### Request

- Method: GET
- Path: /api/admin/users/:id
- Path Parameters:
  - `id`: (string, required) - The ID of the user to retrieve
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `includeActivity`: (boolean, optional, default: false) - Include recent user activity
  - `includeListings`: (boolean, optional, default: false) - Include user's listings 
  - `includeSessions`: (boolean, optional, default: false) - Include active sessions

### Response

#### Success (200 OK)

```json
{
  "user": {
    "id": "user_1234567890",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active",
    "emailVerified": true,
    "phoneNumber": "+1234567890",
    "phoneVerified": false,
    "avatarUrl": "https://example.com/avatars/johndoe.jpg",
    "timezone": "America/New_York",
    "locale": "en-US",
    "createdAt": "2024-08-01T10:15:30Z",
    "updatedAt": "2025-03-15T14:30:45Z",
    "lastLoginAt": "2025-04-01T09:25:18Z",
    "roles": [
      {
        "id": "role_5678",
        "name": "Site Admin",
        "description": "Administrator for specific sites",
        "tenantId": "tenant_1234",
        "permissions": [
          "user:read",
          "user:create",
          "user:update",
          "listing:*",
          "category:*"
        ]
      }
    ],
    "tenants": [
      {
        "id": "tenant_1234",
        "name": "Main Organization",
        "role": "site_admin",
        "status": "active",
        "joinedAt": "2024-08-01T10:15:30Z"
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
        "role": "editor"
      }
    ],
    "authMethods": [
      {
        "type": "password",
        "createdAt": "2024-08-01T10:15:30Z",
        "lastUsed": "2025-04-01T09:25:18Z"
      },
      {
        "type": "google",
        "identifier": "john.doe@gmail.com",
        "createdAt": "2024-09-15T08:30:00Z",
        "lastUsed": "2025-03-15T14:30:45Z"
      }
    ],
    "mfaEnabled": true,
    "mfaMethods": [
      {
        "type": "app",
        "createdAt": "2024-10-05T11:20:00Z",
        "lastUsed": "2025-04-01T09:25:18Z"
      }
    ],
    "subscription": {
      "plan": "professional",
      "status": "active",
      "startDate": "2024-11-01T00:00:00Z",
      "endDate": "2025-11-01T00:00:00Z",
      "autoRenew": true,
      "paymentMethod": "credit_card",
      "lastPayment": {
        "amount": 199.99,
        "currency": "USD",
        "date": "2024-11-01T00:00:00Z"
      }
    },
    "metadata": {
      "referredBy": "existing_customer",
      "industry": "outdoor_recreation",
      "companySize": "11-50"
    }
  },
  "activity": {
    "totalLogins": 47,
    "lastLoginIp": "192.168.1.1",
    "lastUserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "recentActivity": [
      {
        "type": "login",
        "timestamp": "2025-04-01T09:25:18Z",
        "ipAddress": "192.168.1.1"
      },
      {
        "type": "listing_created",
        "timestamp": "2025-03-25T14:30:45Z",
        "details": {
          "listingId": "listing_5678",
          "title": "Premium Fishing Rod"
        }
      },
      {
        "type": "profile_updated",
        "timestamp": "2025-03-15T14:30:45Z"
      }
    ]
  },
  "listings": {
    "total": 12,
    "published": 8,
    "draft": 3,
    "pending": 1,
    "featured": 2,
    "recent": [
      {
        "id": "listing_5678",
        "title": "Premium Fishing Rod",
        "status": "published",
        "createdAt": "2025-03-25T14:30:45Z"
      },
      {
        "id": "listing_9012",
        "title": "Ultralight Tent",
        "status": "published",
        "createdAt": "2025-02-10T11:20:30Z"
      }
    ]
  },
  "activeSessions": [
    {
      "id": "session_1234",
      "createdAt": "2025-04-01T09:25:18Z",
      "expiresAt": "2025-04-02T09:25:18Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "device": "Desktop",
      "location": "New York, USA"
    }
  ]
}
```

#### Not Found (404 Not Found)

```json
{
  "error": "User not found"
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

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve user data"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve basic user details**
   - Expected: 200 OK with user data
   - Test: Send request with valid JWT for admin and valid user ID
   - Validation: Verify response contains complete user information

2. **Include activity history**
   - Expected: 200 OK with user data and activity
   - Test: Send request with includeActivity=true
   - Validation: Verify response includes activity section with recent events

3. **Include listings information**
   - Expected: 200 OK with user data and listings
   - Test: Send request with includeListings=true
   - Validation: Verify response includes listings section with statistics

4. **Include active sessions**
   - Expected: 200 OK with user data and sessions
   - Test: Send request with includeSessions=true
   - Validation: Verify response includes activeSessions array

5. **Super admin cross-tenant view**
   - Expected: 200 OK with complete data
   - Test: Send request as super admin for user in different tenant
   - Validation: Verify full user details are visible

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 200 OK or 404 Not Found
   - Test: Send request as site admin for user in different tenant
   - Validation: Verify admin cannot access users outside their tenant

3. **Limited admin sees appropriate data**
   - Expected: 200 OK with redacted sensitive fields
   - Test: Send request as admin with limited permissions
   - Validation: Verify sensitive data is not included

### Edge Case Scenarios

1. **User not found**
   - Expected: 404 Not Found
   - Test: Send request with non-existent user ID
   - Validation: Verify appropriate not found error

2. **User with complex role structure**
   - Expected: 200 OK with correctly nested roles
   - Test: Request user with multiple roles across tenants
   - Validation: Verify response correctly represents complex permission structure

3. **Deactivated user**
   - Expected: 200 OK with inactive status
   - Test: Request details for deactivated user
   - Validation: Verify status field shows proper deactivation state

4. **User with partial data**
   - Expected: 200 OK with partial fields
   - Test: Request recently created user with minimal profile
   - Validation: Verify response handles null/undefined fields appropriately

## Implementation Notes

- Implement efficient JOIN queries for related user data
- Use Redis caching for frequent admin user requests
- Apply proper tenant isolation through query filters
- Implement field-level permission checking for sensitive data
- Log all access to user profiles for audit purposes
- Use consistent error handling for not found vs forbidden scenarios
- Consider using database projections for optimized field selection
- Ensure password hashes and other credentials are never exposed
- Consider implementing rate limiting for this endpoint
- Apply proper indexing for efficient user lookups