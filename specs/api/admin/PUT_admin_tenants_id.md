# PUT /api/admin/tenants/{tenantId} API Specification

## Overview

This endpoint allows super-administrators to update an existing tenant's configuration, settings, and status. It provides comprehensive control over tenant properties and enables management of tenant lifecycle.

## Requirements

### Functional Requirements

1. Update tenant configuration and settings
2. Modify tenant subscription and billing information
3. Change tenant status (active, suspended, etc.)
4. Update tenant owner and contact information
5. Modify tenant security and notification settings
6. Return the updated tenant details

### Security Requirements

1. Require authentication with super-admin privileges
2. Validate all input data for security
3. Log update action for audit purposes
4. Implement rate limiting to prevent abuse
5. Prevent changes to critical tenant identifiers

### Performance Requirements

1. Response time should be < 1000ms
2. Handle the transaction atomically
3. Implement proper error handling
4. Update resources efficiently

## API Specification

### Request

- Method: PUT
- Path: /api/admin/tenants/{tenantId}
- Headers:
  - Authorization: Bearer {JWT token}
  - Content-Type: application/json
- Body:
  ```json
  {
    "name": "Updated Fishing Gear Directory",
    "primaryDomain": "newfishinggearreviews.com",
    "status": "active",
    "owner": {
      "id": "user_2345678901",
      "name": "Jane Doe",
      "email": "jane@fishinggearreviews.com",
      "phone": "+1-555-987-6543"
    },
    "contact": {
      "name": "Jane Doe",
      "email": "admin@fishinggearreviews.com",
      "phone": "+1-555-987-6543",
      "address": {
        "street": "456 Oak St",
        "city": "Seattle",
        "state": "WA",
        "zipCode": "98102",
        "country": "USA"
      }
    },
    "subscription": {
      "type": "enterprise",
      "billingCycle": "annual",
      "renewsAt": "2026-04-04T23:59:59Z",
      "features": {
        "maxSites": 25,
        "maxUsersPerSite": 50,
        "maxStorageGB": 100,
        "maxApiRequestsPerMonth": 500000,
        "customDomain": true,
        "whiteLabel": true,
        "prioritySupport": true,
        "dedicatedHosting": true
      }
    },
    "billing": {
      "email": "finance@fishinggearreviews.com",
      "company": "Fishing Gear Enterprises LLC",
      "taxId": "98-7654321",
      "address": {
        "street": "456 Oak St",
        "city": "Seattle",
        "state": "WA",
        "zipCode": "98102",
        "country": "USA"
      }
    },
    "settings": {
      "timezone": "America/New_York",
      "dateFormat": "YYYY-MM-DD",
      "language": "en-US",
      "notificationSettings": {
        "emailNotifications": true,
        "billingAlerts": true,
        "securityAlerts": true,
        "marketingEmails": true
      },
      "securitySettings": {
        "mfaRequired": true,
        "passwordPolicy": {
          "minLength": 14,
          "requireSpecialChars": true,
          "requireNumbers": true,
          "requireUppercase": true,
          "expiryDays": 60
        },
        "sessionTimeout": 30, // minutes
        "ipRestrictions": [
          {
            "ipRange": "192.168.1.0/24",
            "description": "Office network"
          }
        ]
      },
      "submissionSettings": {
        "requireApproval": true,
        "autoApproveVerifiedUsers": true,
        "notifyAdminsOnNewSubmission": true,
        "maxSubmissionsPerDay": 100
      }
    },
    "notes": "Enterprise customer upgraded from Professional plan. Added dedicated hosting and increased resource limits.",
    "sendNotification": true,
    "notificationMessage": "Your account has been upgraded to Enterprise with increased resource limits and dedicated hosting."
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "tenant": {
    "id": "tenant_1234567890",
    "name": "Updated Fishing Gear Directory",
    "slug": "fishing-gear",
    "primaryDomain": "newfishinggearreviews.com",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-04-04T15:45:30Z",
    "owner": {
      "id": "user_2345678901",
      "name": "Jane Doe",
      "email": "jane@fishinggearreviews.com"
    },
    "subscription": {
      "type": "enterprise",
      "status": "active",
      "startedAt": "2024-01-15T10:30:00Z",
      "renewsAt": "2026-04-04T23:59:59Z",
      "billingCycle": "annual"
    },
    "notificationSent": true,
    "changeLog": [
      {
        "field": "name",
        "oldValue": "Fishing Gear Directory",
        "newValue": "Updated Fishing Gear Directory",
        "changedAt": "2024-04-04T15:45:30Z"
      },
      {
        "field": "primaryDomain",
        "oldValue": "fishinggearreviews.com",
        "newValue": "newfishinggearreviews.com",
        "changedAt": "2024-04-04T15:45:30Z"
      },
      {
        "field": "subscription.type",
        "oldValue": "professional",
        "newValue": "enterprise",
        "changedAt": "2024-04-04T15:45:30Z"
      },
      {
        "field": "owner",
        "oldValue": "user_1234567890",
        "newValue": "user_2345678901",
        "changedAt": "2024-04-04T15:45:30Z"
      }
    ]
  }
}
```

#### Tenant Not Found (404 Not Found)

```json
{
  "error": "Tenant not found"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "primaryDomain",
      "message": "Domain is already in use by another tenant"
    },
    {
      "field": "subscription.type",
      "message": "Invalid subscription type"
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
  "error": "Insufficient permissions to update tenants"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to update tenant"
}
```

## Testing Scenarios

### Success Scenarios

1. **Update tenant basic information**
   - Expected: 200 OK with updated tenant details
   - Test: Send update request with new name and domain, verify changes applied

2. **Update tenant subscription**
   - Expected: 200 OK with updated subscription
   - Test: Send update with new subscription type and billing cycle, verify subscription updated

3. **Change tenant owner**
   - Expected: 200 OK with new owner
   - Test: Send update with new owner ID, verify ownership transferred

4. **Update tenant status**
   - Expected: 200 OK with new status
   - Test: Send update with status change (e.g., active to suspended), verify status updated

5. **Update with notification**
   - Expected: 200 OK and notification sent
   - Test: Send update with sendNotification=true, verify notification sent to tenant

### Validation Failure Scenarios

1. **Invalid data formats**
   - Expected: 400 Bad Request
   - Test: Send update with invalid email, domain, etc., verify validation errors

2. **Duplicate domain**
   - Expected: 400 Bad Request
   - Test: Attempt to update with domain already used by another tenant, verify validation error

3. **Invalid subscription type**
   - Expected: 400 Bad Request
   - Test: Send update with non-existent subscription type, verify validation error

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
   - Test: Attempt to update non-existent tenant ID, verify 404 response

2. **No changes in update**
   - Expected: 200 OK with unchanged tenant
   - Test: Send update identical to current data, verify no changes and appropriate response

## Implementation Notes

- Implement proper permission checks for super-admin access
- Use transactions to ensure atomicity of tenant update process
- Track and log all changes for audit purposes
- Implement notifications for significant tenant changes
- Add appropriate logging for security and audit purposes
- Consider implementing approval workflows for critical changes
- Ensure proper validation of all updated fields
- Handle domain changes carefully, including DNS verification
- Consider implementing tenant update templates for common scenarios
- Ensure all tenant-specific Redis keys are properly updated if identifiers change

## Tenant Status Types

1. **active**: Tenant is in good standing with an active subscription
2. **suspended**: Tenant has been temporarily suspended (e.g., for payment issues)
3. **trial**: Tenant is in trial period
4. **archived**: Tenant has been archived (not deleted but no longer active)

## Critical Changes Requiring Special Handling

Some tenant changes require special handling:

1. **Domain Changes**: May require DNS verification and certificate updates
2. **Ownership Changes**: Should notify both old and new owners
3. **Subscription Downgrades**: May require resource limit enforcement
4. **Status Changes**: May affect tenant accessibility and functionality
5. **Security Setting Changes**: May affect all users of the tenant

These critical changes should be carefully validated and may require additional confirmation steps.