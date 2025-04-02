# GET /api/admin/dashboard/stats API Specification

## Overview

This endpoint provides aggregated statistics and metrics for the administrative dashboard. It compiles data from multiple sources to present administrators with a comprehensive view of system activity, performance, and growth trends.

## Requirements

### Functional Requirements

1. Return aggregated statistics across various dimensions (users, listings, traffic, etc.)
2. Support time-frame filtering (daily, weekly, monthly, custom ranges)
3. Support comparison with previous periods
4. Provide multiple data categories in a single request
5. Include trend data for visualization

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has appropriate 'setting:read' permission
3. Enforce tenant isolation (statistics limited to admin's tenant scope)
4. Super admins can see global statistics across all tenants
5. Sanitize all query parameters
6. Redact sensitive information from statistics

### Performance Requirements

1. Response time should be < 1000ms despite complex aggregations
2. Implement caching for expensive calculations
3. Use pre-calculated aggregations where possible
4. Allow progressive loading of different stat groups

## API Specification

### Request

- Method: GET
- Path: /api/admin/dashboard/stats
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `period`: (string, optional, default: 'week') - Time period ('day', 'week', 'month', 'year')
  - `compare`: (boolean, optional, default: true) - Include comparison with previous period
  - `categories`: (string, optional) - Comma-separated list of stat categories to include
  - `startDate`: (string, optional) - ISO date string for custom date range start
  - `endDate`: (string, optional) - ISO date string for custom date range end
  - `siteId`: (string, optional) - Filter stats to specific site

### Response

#### Success (200 OK)

```json
{
  "period": {
    "start": "2025-03-25T00:00:00Z",
    "end": "2025-04-01T23:59:59Z",
    "label": "Last Week"
  },
  "userStats": {
    "total": 425,
    "active": 312,
    "new": 45,
    "trend": [8, 5, 12, 4, 6, 7, 3],
    "previousPeriod": {
      "new": 38,
      "change": "+18.4%"
    }
  },
  "listingStats": {
    "total": 1245,
    "published": 1042,
    "draft": 203,
    "new": 87,
    "trend": [15, 12, 8, 14, 16, 12, 10],
    "byCategory": [
      { "name": "Fishing Gear", "count": 430 },
      { "name": "Camping Equipment", "count": 325 },
      { "name": "Hiking Accessories", "count": 490 }
    ],
    "previousPeriod": {
      "new": 72,
      "change": "+20.8%"
    }
  },
  "trafficStats": {
    "pageviews": 24680,
    "visitors": 12540,
    "trend": [3240, 3120, 3450, 3290, 3860, 3920, 3800],
    "topSources": [
      { "name": "Google", "count": 9850 },
      { "name": "Direct", "count": 4200 },
      { "name": "Facebook", "count": 2430 }
    ],
    "previousPeriod": {
      "pageviews": 22450,
      "change": "+9.9%"
    }
  },
  "revenueStats": {
    "total": 12540.75,
    "currency": "USD",
    "bySource": [
      { "name": "Featured Listings", "amount": 8250.00 },
      { "name": "Premium Subscriptions", "amount": 3450.75 },
      { "name": "Other", "amount": 840.00 }
    ],
    "trend": [1840.25, 1720.50, 1825.00, 1795.25, 1840.75, 1760.00, 1759.00],
    "previousPeriod": {
      "total": 11250.50,
      "change": "+11.5%"
    }
  },
  "systemHealth": {
    "status": "healthy",
    "issues": 0,
    "performance": 92,
    "uptime": 99.98,
    "taskQueueSize": 14
  }
}
```

#### Missing Required Parameters (400 Bad Request)

```json
{
  "error": "Invalid parameters",
  "details": "End date must be after start date"
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
  "error": "Insufficient permissions to access dashboard statistics"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to retrieve dashboard statistics"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve default dashboard stats**
   - Expected: 200 OK with complete stats
   - Test: Send request with valid JWT for admin
   - Validation: Verify response contains all data categories

2. **Filter by time period**
   - Expected: 200 OK with filtered stats
   - Test: Send request with period=month
   - Validation: Verify response contains data for the last month

3. **Custom date range**
   - Expected: 200 OK with custom range stats
   - Test: Send request with startDate and endDate
   - Validation: Verify data corresponds to specified date range

4. **Site-specific stats**
   - Expected: 200 OK with site-specific stats
   - Test: Send request with siteId parameter
   - Validation: Verify data is filtered for specific site

5. **Select specific categories**
   - Expected: 200 OK with limited categories
   - Test: Send request with categories=userStats,trafficStats
   - Validation: Verify only requested categories are included

### Authorization Scenarios

1. **Regular user access denied**
   - Expected: 403 Forbidden
   - Test: Send request with JWT for non-admin user
   - Validation: Verify error response about insufficient permissions

2. **Site admin tenant isolation**
   - Expected: 200 OK with tenant-specific stats
   - Test: Send request as site admin
   - Validation: Verify stats only include data from admin's tenant

3. **Super admin global view**
   - Expected: 200 OK with cross-tenant stats
   - Test: Send request as super admin
   - Validation: Verify stats include data across all tenants

### Edge Case Scenarios

1. **Invalid date range**
   - Expected: 400 Bad Request
   - Test: Send request with endDate before startDate
   - Validation: Verify appropriate error message

2. **No data available**
   - Expected: 200 OK with zero values
   - Test: Request stats for period with no activity
   - Validation: Verify response contains appropriate zero values or empty arrays

3. **Request for non-existent site**
   - Expected: 404 Not Found or empty stats
   - Test: Request stats for non-existent siteId
   - Validation: Verify appropriate error or empty data

## Implementation Notes

- Implement aggressive caching for dashboard statistics
- Use background jobs to pre-calculate common aggregate metrics
- Consider implementing materialized views or data warehousing
- Use Redis sorted sets and hashes for efficient time-series data
- Implement proper tenant isolation in all queries
- Optimize database queries to leverage indexes effectively
- Consider implementing progressive loading for different stat groups
- Add appropriate logging for performance monitoring
- Handle currency conversions consistently for multi-region deployments
- Ensure sensitive revenue data is properly redacted based on permissions