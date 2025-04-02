# POST /api/admin/tenants API Specification

## Overview

This endpoint allows super-administrators to create a new tenant in the system. It provisions all necessary resources and configurations for a new tenant to operate on the platform.

## Requirements

### Functional Requirements

1. Create a new tenant with specified configuration
2. Create initial owner user account
3. Set up tenant subscription and billing information
4. Configure tenant settings and preferences
5. Provision necessary resources for the tenant
6. Return the newly created tenant details

### Security Requirements

1. Require authentication with super-admin privileges
2. Validate all input data for security
3. Log creation action for audit purposes
4. Generate secure initial credentials for tenant owner
5. Implement rate limiting to prevent abuse

### Performance Requirements

1. Response time should be < 2000ms (tenant creation involves multiple operations)
2. Handle the transaction atomically
3. Implement proper error handling
4. Provision resources efficiently

## API Specification

### Request

- Method: POST
- Path: /api/admin/tenants
- Headers:
  - Authorization: Bearer {JWT token}
  - Content-Type: application/json
- Body:
  ```json
  {
    "name": "Fishing Gear Directory",
    "slug": "fishing-gear",
    "primaryDomain": "fishinggearreviews.com",
    "owner": {
      "name": "John Smith",
      "email": "john@fishinggearreviews.com",
      "phone": "+1-555-123-4567"
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
      "billingCycle": "monthly",
      "trialPeriodDays": 30
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
      }
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
        }
      },
      "submissionSettings": {
        "requireApproval": true,
        "autoApproveVerifiedUsers": false,
        "notifyAdminsOnNewSubmission": true
      }
    },
    "initialSite": {
      "name": "Fishing Gear Reviews",
      "slug": "fishing-gear-reviews",
      "domain": "fishinggearreviews.com",
      "description": "Expert reviews of the best fishing gear and equipment",
      "keywords": ["fishing gear", "fishing equipment", "fishing reviews"]
    },
    "sendWelcomeEmail": true,
    "notes": "Enterprise customer with custom support requirements. Migrating from competitor platform."
  }
  ```

### Response

#### Success (201 Created)

```json
{
  "success": true,
  "message": "Tenant created successfully",
  "tenant": {
    "id": "tenant_1234567890",
    "name": "Fishing Gear Directory",
    "slug": "fishing-gear",
    "primaryDomain": "fishinggearreviews.com",
    "status": "trial",
    "trialEndsAt": "2024-05-04T23:59:59Z",
    "createdAt": "2024-04-04T14:30:15Z",
    "updatedAt": "2024-04-04T14:30:15Z",
    "owner": {
      "id": "user_1234567890",
      "name": "John Smith",
      "email": "john@fishinggearreviews.com",
      "temporaryPassword": "TempP@ss123456"
    },
    "subscription": {
      "type": "professional",
      "status": "trial",
      "startedAt": "2024-04-04T14:30:15Z",
      "trialEndsAt": "2024-05-04T23:59:59Z",
      "billingCycle": "monthly"
    },
    "initialSite": {
      "id": "site_1234567890",
      "name": "Fishing Gear Reviews",
      "slug": "fishing-gear-reviews",
      "domain": "fishinggearreviews.com"
    },
    "welcomeEmailSent": true,
    "setupInstructions": {
      "nextSteps": [
        "Complete domain verification",
        "Set up initial categories",
        "Customize site appearance",
        "Add first listings"
      ],
      "setupGuideUrl": "https://admin.directorymonster.com/guides/getting-started"
    }
  }
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Tenant name is required"
    },
    {
      "field": "owner.email",
      "message": "Valid email address is required"
    }
  ]
}
```

#### Duplicate Tenant (409 Conflict)

```json
{
  "error": "Tenant already exists",
  "field": "slug",
  "value": "fishing-gear"
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
  "error": "Insufficient permissions to create tenants"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to create tenant"
}
```

## Testing Scenarios

### Success Scenarios

1. **Create tenant with all fields**
   - Expected: 201 Created with tenant details
   - Test: Send complete tenant creation request, verify tenant created with all specified settings

2. **Create tenant with minimal fields**
   - Expected: 201 Created with tenant details
   - Test: Send tenant creation with only required fields, verify tenant created with default settings for omitted fields

3. **Create tenant with initial site**
   - Expected: 201 Created with tenant and site details
   - Test: Send creation request with initialSite data, verify both tenant and site are created

4. **Create tenant with welcome email**
   - Expected: 201 Created and email sent
   - Test: Send creation request with sendWelcomeEmail=true, verify welcome email is sent

### Validation Failure Scenarios

1. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send creation request missing required fields, verify appropriate validation errors

2. **Invalid data formats**
   - Expected: 400 Bad Request
   - Test: Send creation request with invalid email, phone, etc., verify validation errors

3. **Invalid subscription type**
   - Expected: 400 Bad Request
   - Test: Send creation request with non-existent subscription type, verify validation error

### Conflict Scenarios

1. **Duplicate tenant slug**
   - Expected: 409 Conflict
   - Test: Attempt to create tenant with existing slug, verify conflict error

2. **Duplicate primary domain**
   - Expected: 409 Conflict
   - Test: Attempt to create tenant with existing primary domain, verify conflict error

3. **Owner email already in use**
   - Expected: 409 Conflict
   - Test: Attempt to create tenant with owner email already registered, verify conflict error

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Non-super-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with regular admin JWT, verify 403 response

## Implementation Notes

- Implement proper permission checks for super-admin access
- Use transactions to ensure atomicity of tenant creation process
- Generate secure temporary passwords for initial owner accounts
- Implement email notifications for new tenant creation
- Add appropriate logging for security and audit purposes
- Consider implementing tenant templates for faster creation
- Ensure proper isolation of tenant resources from creation
- Implement domain verification process for new tenants
- Consider adding post-creation setup wizard functionality
- Ensure all tenant-specific Redis keys are properly prefixed

## Tenant Creation Process

The tenant creation process involves several steps:

1. **Validation**: Validate all input data for correctness and uniqueness
2. **Resource Allocation**: Allocate necessary resources for the tenant
3. **User Creation**: Create the initial owner user account
4. **Subscription Setup**: Configure the subscription and billing information
5. **Settings Configuration**: Apply the specified settings and preferences
6. **Site Creation**: Create the initial site if specified
7. **Notification**: Send welcome emails and setup instructions
8. **Logging**: Log the creation for audit purposes

This comprehensive process ensures that new tenants are properly provisioned and ready for use immediately after creation.