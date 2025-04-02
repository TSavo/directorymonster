# GET /api/admin/tenants API Specification

## Overview

This endpoint allows super-administrators to retrieve a list of all tenants in the system. It provides comprehensive tenant information for platform management and administration.

## Requirements

### Functional Requirements

1. Return a list of all tenants with filtering options
2. Support filtering by status, creation date, and subscription type
3. Support sorting by various fields (name, creation date, etc.)
4. Support pagination for efficient handling of large tenant volumes
5. Include tenant statistics and usage information
6. Support search functionality for finding specific tenants

### Security Requirements

1. Require authentication with super-admin privileges
2. Log access for audit purposes
3. Implement rate limiting to prevent abuse
4. Restrict sensitive tenant information based on permissions

### Performance Requirements

1. Response time should be < 500ms for typical requests
2. Handle large tenant volumes efficiently
3. Implement proper caching for repeated queries
4. Optimize database queries for performance

## API Specification

### Request

- Method: GET
- Path: /api/admin/tenants
- Headers:
  - Authorization: Bearer {JWT token}
- Query Parameters:
  - `status`: (string, optional) - Filter by tenant status (active, suspended, trial, archived)
  - `subscriptionType`: (string, optional) - Filter by subscription type (free, basic, professional, enterprise)
  - `fromDate`: (ISO date string, optional) - Filter tenants created after this date
  - `toDate`: (ISO date string, optional) - Filter tenants created before this date
  - `search`: (string, optional) - Search term for tenant name or domain
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `limit`: (number, optional, default: 20) - Results per page
  - `sort`: (string, optional, default: 'createdAt') - Field to sort by
  - `order`: (string, optional, default: 'desc') - Sort order ('asc' or 'desc')
  - `includeStats`: (boolean, optional, default: false) - Include detailed tenant statistics

### Response

#### Success (200 OK)

```json
{
  "tenants": [
    {
      "id": "tenant_1234567890",
      "name": "Fishing Gear Directory",
      "slug": "fishing-gear",
      "primaryDomain": "fishinggearreviews.com",
      "status": "active",
      "subscriptionType": "professional",
      "subscriptionRenewsAt": "2025-12-31T23:59:59Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-03-20T14:45:30Z",
      "owner": {
        "id": "user_1234567890",
        "name": "John Smith",
        "email": "john@fishinggearreviews.com"
      },
      "contactEmail": "admin@fishinggearreviews.com",
      "contactPhone": "+1-555-123-4567",
      "billingEmail": "billing@fishinggearreviews.com",
      "stats": {
        "siteCount": 3,
        "userCount": 12,
        "listingCount": 547,
        "categoryCount": 45,
        "submissionCount": 78,
        "pendingSubmissions": 15,
        "storageUsed": 2.4, // GB
        "apiRequestsLastMonth": 12450
      }
    },
    {
      "id": "tenant_0987654321",
      "name": "Camping Equipment Reviews",
      "slug": "camping-equipment",
      "primaryDomain": "campingequipmentreviews.com",
      "status": "trial",
      "subscriptionType": "basic",
      "trialEndsAt": "2024-05-15T23:59:59Z",
      "createdAt": "2024-04-01T08:15:00Z",
      "updatedAt": "2024-04-01T08:15:00Z",
      "owner": {
        "id": "user_0987654321",
        "name": "Jane Doe",
        "email": "jane@campingequipmentreviews.com"
      },
      "contactEmail": "info@campingequipmentreviews.com",
      "contactPhone": "+1-555-987-6543",
      "billingEmail": "jane@campingequipmentreviews.com",
      "stats": {
        "siteCount": 1,
        "userCount": 3,
        "listingCount": 42,
        "categoryCount": 8,
        "submissionCount": 12,
        "pendingSubmissions": 5,
        "storageUsed": 0.3, // GB
        "apiRequestsLastMonth": 450
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "stats": {
    "active": 32,
    "suspended": 3,
    "trial": 8,
    "archived": 2,
    "totalTenants": 45
  }
}
```

#### No Tenants Found (200 OK with empty array)

```json
{
  "tenants": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "pages": 0
  },
  "stats": {
    "active": 0,
    "suspended": 0,
    "trial": 0,
    "archived": 0,
    "totalTenants": 0
  }
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
  "error": "Failed to retrieve tenants"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve all tenants**
   - Expected: 200 OK with array of tenants
   - Test: Send request with valid super-admin JWT, verify response contains tenants

2. **Filter by status**
   - Expected: 200 OK with filtered tenants
   - Test: Send request with status=trial, verify only trial tenants returned

3. **Filter by subscription type**
   - Expected: 200 OK with filtered tenants
   - Test: Send request with subscriptionType=professional, verify only professional subscription tenants returned

4. **Search tenants**
   - Expected: 200 OK with search results
   - Test: Send request with search term, verify matching tenants returned

5. **Pagination works correctly**
   - Expected: 200 OK with paginated results
   - Test: Create multiple tenants, request with page=2&limit=10, verify correct page returned

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Non-super-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with regular admin JWT, verify 403 response

### Edge Case Scenarios

1. **Invalid filter parameters**
   - Expected: 400 Bad Request
   - Test: Send request with invalid filter values, verify appropriate error response

2. **Very large result set**
   - Expected: Proper pagination handling
   - Test: Create 100+ tenants, verify pagination works correctly

## Implementation Notes

- Implement proper permission checks for super-admin access
- Use Redis for caching frequently accessed tenant lists
- Consider implementing a tenant search index for efficient searching
- Add appropriate logging for security and audit purposes
- Optimize database queries for performance with large tenant volumes
- Implement proper error handling with meaningful messages
- Consider adding analytics for tenant growth and usage patterns
- Ensure sensitive tenant information is properly protected

## Tenant Status Types

1. **active**: Tenant is in good standing with an active subscription
2. **suspended**: Tenant has been temporarily suspended (e.g., for payment issues)
3. **trial**: Tenant is in trial period
4. **archived**: Tenant has been archived (not deleted but no longer active)

## Subscription Types

1. **free**: Limited functionality, suitable for small directories
2. **basic**: Standard functionality for medium-sized directories
3. **professional**: Advanced features for larger directories
4. **enterprise**: Full feature set with custom support for large organizations

## Relationship to Platform Management

This endpoint is essential for platform administration:

1. Super-administrators need visibility into all tenants
2. Tenant statistics help identify platform usage patterns
3. Filtering and search capabilities enable efficient tenant management
4. Status information helps identify tenants requiring attention

The tenant management endpoints form the foundation of the multi-tenant architecture, enabling proper isolation and management of tenant resources.