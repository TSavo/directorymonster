# GET /api/admin/tenants/{tenantId} API Specification

## Overview

This endpoint allows super-administrators to retrieve detailed information about a specific tenant. It provides comprehensive tenant data including configuration, statistics, and activity history.

## Requirements

### Functional Requirements

1. Return detailed information about a specific tenant
2. Include tenant configuration and settings
3. Include tenant statistics and usage metrics
4. Include billing and subscription information
5. Include tenant activity history
6. Include tenant user information

### Security Requirements

1. Require authentication with super-admin privileges
2. Log access for audit purposes
3. Implement rate limiting to prevent abuse
4. Restrict sensitive tenant information based on permissions

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper caching for repeated access
3. Optimize database queries for performance

## API Specification

### Request

- Method: GET
- Path: /api/admin/tenants/{tenantId}
- Headers:
  - Authorization: Bearer {JWT token}
- Query Parameters:
  - `includeUsers`: (boolean, optional, default: false) - Include detailed user information
  - `includeSites`: (boolean, optional, default: false) - Include detailed site information
  - `includeActivity`: (boolean, optional, default: false) - Include detailed activity history
  - `includeBilling`: (boolean, optional, default: false) - Include detailed billing history

### Response

#### Success (200 OK)

```json
{
  "tenant": {
    "id": "tenant_1234567890",
    "name": "Fishing Gear Directory",
    "slug": "fishing-gear",
    "primaryDomain": "fishinggearreviews.com",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-03-20T14:45:30Z",
    "owner": {
      "id": "user_1234567890",
      "name": "John Smith",
      "email": "john@fishinggearreviews.com",
      "phone": "+1-555-123-4567",
      "role": "owner",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLoginAt": "2024-04-03T09:15:22Z"
    },
    "contact": {
      "name": "John Smith",
      "email": "admin@fishinggearreviews.com",
      "phone": "+1-555-123-4567",
      "address": {
        "street": "123 Main St",
        "city": "Seattle",
        "state": "WA",
        "zipCode": "98101",
        "country": "USA"
      }
    },
    "subscription": {
      "type": "professional",
      "status": "active",
      "startedAt": "2024-01-15T10:30:00Z",
      "renewsAt": "2025-12-31T23:59:59Z",
      "price": 199.99,
      "billingCycle": "monthly",
      "paymentMethod": "credit_card",
      "features": {
        "maxSites": 10,
        "maxUsersPerSite": 25,
        "maxStorageGB": 50,
        "maxApiRequestsPerMonth": 100000,
        "customDomain": true,
        "whiteLabel": true,
        "prioritySupport": true
      }
    },
    "billing": {
      "email": "billing@fishinggearreviews.com",
      "company": "Fishing Gear Reviews LLC",
      "taxId": "12-3456789",
      "address": {
        "street": "123 Main St",
        "city": "Seattle",
        "state": "WA",
        "zipCode": "98101",
        "country": "USA"
      },
      "recentInvoices": [
        {
          "id": "invoice_1234567890",
          "amount": 199.99,
          "status": "paid",
          "issuedAt": "2024-03-01T00:00:00Z",
          "paidAt": "2024-03-01T12:34:56Z"
        },
        {
          "id": "invoice_0987654321",
          "amount": 199.99,
          "status": "paid",
          "issuedAt": "2024-02-01T00:00:00Z",
          "paidAt": "2024-02-01T10:23:45Z"
        }
      ]
    },
    "settings": {
      "timezone": "America/Los_Angeles",
      "dateFormat": "MM/DD/YYYY",
      "language": "en-US",
      "notificationSettings": {
        "emailNotifications": true,
        "billingAlerts": true,
        "securityAlerts": true,
        "marketingEmails": false
      },
      "securitySettings": {
        "mfaRequired": true,
        "passwordPolicy": {
          "minLength": 12,
          "requireSpecialChars": true,
          "requireNumbers": true,
          "requireUppercase": true,
          "expiryDays": 90
        },
        "sessionTimeout": 60, // minutes
        "ipRestrictions": []
      },
      "submissionSettings": {
        "requireApproval": true,
        "autoApproveVerifiedUsers": false,
        "notifyAdminsOnNewSubmission": true,
        "maxSubmissionsPerDay": 50
      }
    },
    "stats": {
      "overview": {
        "siteCount": 3,
        "userCount": 12,
        "listingCount": 547,
        "categoryCount": 45,
        "submissionCount": 78,
        "pendingSubmissions": 15,
        "storageUsed": 2.4, // GB
        "apiRequestsLastMonth": 12450
      },
      "usage": {
        "storageUsage": {
          "total": 2.4, // GB
          "images": 1.8, // GB
          "attachments": 0.4, // GB
          "other": 0.2 // GB
        },
        "apiUsage": {
          "total": 12450,
          "reads": 11200,
          "writes": 1250,
          "byEndpoint": {
            "/api/sites": 5230,
            "/api/listings": 4120,
            "/api/categories": 1850,
            "/api/search": 1250
          }
        },
        "userActivity": {
          "activeUsersLast30Days": 10,
          "averageSessionDuration": 25.4, // minutes
          "totalSessionsLastMonth": 245
        }
      },
      "growth": {
        "listingsGrowth": [
          {"month": "2024-01", "count": 120},
          {"month": "2024-02", "count": 210},
          {"month": "2024-03", "count": 450},
          {"month": "2024-04", "count": 547}
        ],
        "usersGrowth": [
          {"month": "2024-01", "count": 3},
          {"month": "2024-02", "count": 5},
          {"month": "2024-03", "count": 8},
          {"month": "2024-04", "count": 12}
        ],
        "submissionsGrowth": [
          {"month": "2024-01", "count": 15},
          {"month": "2024-02", "count": 22},
          {"month": "2024-03", "count": 30},
          {"month": "2024-04", "count": 11}
        ]
      }
    },
    "users": [
      {
        "id": "user_1234567890",
        "name": "John Smith",
        "email": "john@fishinggearreviews.com",
        "role": "owner",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "lastLoginAt": "2024-04-03T09:15:22Z"
      },
      {
        "id": "user_2345678901",
        "name": "Jane Doe",
        "email": "jane@fishinggearreviews.com",
        "role": "admin",
        "status": "active",
        "createdAt": "2024-01-20T14:25:10Z",
        "lastLoginAt": "2024-04-02T16:30:45Z"
      }
      // Additional users if includeUsers=true
    ],
    "sites": [
      {
        "id": "site_1234567890",
        "name": "Fishing Gear Reviews",
        "slug": "fishing-gear-reviews",
        "domain": "fishinggearreviews.com",
        "status": "active",
        "createdAt": "2024-01-15T10:35:00Z",
        "listingCount": 320,
        "categoryCount": 28
      },
      {
        "id": "site_2345678901",
        "name": "Fishing Equipment Deals",
        "slug": "fishing-equipment-deals",
        "domain": "fishingequipmentdeals.com",
        "status": "active",
        "createdAt": "2024-02-10T09:20:15Z",
        "listingCount": 227,
        "categoryCount": 17
      }
      // Additional sites if includeSites=true
    ],
    "activity": [
      {
        "type": "subscription_changed",
        "timestamp": "2024-03-15T11:30:45Z",
        "user": {
          "id": "user_1234567890",
          "name": "John Smith"
        },
        "details": {
          "from": "basic",
          "to": "professional",
          "reason": "upgrade"
        }
      },
      {
        "type": "site_created",
        "timestamp": "2024-02-10T09:20:15Z",
        "user": {
          "id": "user_1234567890",
          "name": "John Smith"
        },
        "details": {
          "siteId": "site_2345678901",
          "siteName": "Fishing Equipment Deals"
        }
      }
      // Additional activity if includeActivity=true
    ],
    "support": {
      "dedicatedAgent": {
        "name": "Sarah Johnson",
        "email": "sarah.johnson@directorymonster.com",
        "phone": "+1-555-987-6543"
      },
      "openTickets": 1,
      "recentTickets": [
        {
          "id": "ticket_1234567890",
          "subject": "Custom domain configuration issue",
          "status": "open",
          "priority": "medium",
          "createdAt": "2024-04-01T14:30:22Z",
          "lastUpdatedAt": "2024-04-02T10:15:30Z"
        }
      ]
    }
  }
}
```

#### Tenant Not Found (404 Not Found)

```json
{
  "error": "Tenant not found"
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
  "error": "Insufficient permissions to access tenant information"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve tenant details"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve tenant details**
   - Expected: 200 OK with detailed tenant information
   - Test: Send request with valid super-admin JWT and tenant ID

2. **Retrieve tenant with users**
   - Expected: 200 OK with tenant and detailed user information
   - Test: Send request with includeUsers=true, verify user details included

3. **Retrieve tenant with sites**
   - Expected: 200 OK with tenant and detailed site information
   - Test: Send request with includeSites=true, verify site details included

4. **Retrieve tenant with activity**
   - Expected: 200 OK with tenant and activity history
   - Test: Send request with includeActivity=true, verify activity details included

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Non-super-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with regular admin JWT, verify 403 response

### Edge Case Scenarios

1. **Tenant not found**
   - Expected: 404 Not Found
   - Test: Request non-existent tenant ID, verify 404 response

2. **Tenant with large data volumes**
   - Expected: Proper handling of large data sets
   - Test: Create tenant with many users, sites, and activities, verify proper response

## Implementation Notes

- Implement proper permission checks for super-admin access
- Use Redis for caching frequently accessed tenant details
- Implement conditional loading of detailed information based on query parameters
- Add appropriate logging for security and audit purposes
- Optimize database queries for performance
- Implement proper error handling with meaningful messages
- Consider implementing tenant data export functionality
- Ensure sensitive tenant information is properly protected

## Relationship to Platform Management

This endpoint provides the detailed information super-administrators need to:

1. Understand tenant configuration and usage
2. Monitor tenant growth and activity
3. Troubleshoot tenant issues
4. Manage tenant billing and subscriptions
5. Provide appropriate support to tenant administrators

The detailed tenant view is essential for platform management, enabling super-administrators to effectively support and manage tenants across the platform.