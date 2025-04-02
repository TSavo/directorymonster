# GET /api/sites API Specification

## Overview

This endpoint retrieves a list of all publicly available sites. As part of the public API, this endpoint is read-only and does not require authentication, making it suitable for public consumption of directory data.

## Requirements

### Functional Requirements

1. Return an array of published site configurations
2. Support pagination for large result sets
3. Allow filtering by optional query parameters
4. Include essential site details in the response (id, name, slug, domain, etc.)

### Security Requirements

1. No authentication required (public endpoint)
2. Return only published sites that are meant for public viewing
3. Exclude any sensitive or internal site configuration details
4. Rate limit requests to prevent abuse

### Performance Requirements

1. Response time should be < 200ms for typical requests
2. Implement aggressive caching for improved performance
3. Use efficient Redis queries to minimize database load
4. Support CDN caching with appropriate cache headers

## API Specification

### Request

- Method: GET
- Path: /api/sites
- Query Parameters:
  - `page`: (number, optional, default: 1) - Page number for pagination
  - `limit`: (number, optional, default: 20) - Results per page
  - `sort`: (string, optional, default: 'name') - Field to sort by
  - `order`: (string, optional, default: 'asc') - Sort order ('asc' or 'desc')

### Response

#### Success (200 OK)

```json
[
  {
    "id": "site_1234567890",
    "name": "Fishing Gear Reviews",
    "slug": "fishing-gear",
    "domain": "fishinggearreviews.com",
    "primaryKeyword": "fishing equipment reviews",
    "metaDescription": "Expert reviews of the best fishing gear",
    "headerText": "Expert Fishing Gear Reviews",
    "defaultLinkAttributes": "dofollow",
    "createdAt": 1615482366000,
    "updatedAt": 1632145677000
  },
  {
    "id": "site_0987654321",
    "name": "Hiking Gear Directory",
    "slug": "hiking-gear",
    "domain": "hikinggear.example.com",
    "primaryKeyword": "hiking equipment directory",
    "metaDescription": "Comprehensive directory of hiking gear",
    "headerText": "Find the Best Hiking Gear",
    "defaultLinkAttributes": "dofollow",
    "createdAt": 1625482366000,
    "updatedAt": 1632145677000
  }
]
```

#### No Sites Found (200 OK with empty array)

```json
[]
```

#### Rate Limit Exceeded (429 Too Many Requests)

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error"
}
```

## Testing Scenarios

### Success Scenarios

1. **Request all sites**
   - Expected: 200 OK with array of published sites
   - Test: Send request without parameters, verify response contains published sites

2. **Paginated request**
   - Expected: 200 OK with paginated results
   - Test: Send request with page=2&limit=10, verify correct page of results returned

3. **Sorted results**
   - Expected: 200 OK with sorted sites
   - Test: Send request with sort=createdAt&order=desc, verify sites are sorted by creation date in descending order

4. **No published sites**
   - Expected: 200 OK with empty array
   - Test: In a test environment with no published sites, verify empty array response

### Performance Scenarios

1. **Cached response**
   - Expected: Fast response with appropriate cache headers
   - Test: Send request twice, verify second request uses cached data

2. **Large result set handling**
   - Expected: Proper pagination with large number of sites
   - Test: In environment with 100+ sites, verify pagination works correctly

### Error Handling Scenarios

1. **Invalid pagination parameters**
   - Expected: 400 Bad Request
   - Test: Send request with invalid pagination (e.g., page=-1), verify error response

2. **Rate limiting**
   - Expected: 429 Too Many Requests after threshold exceeded
   - Test: Send multiple requests in quick succession, verify rate limit response

### Error Handling Scenarios

1. **Redis connection failure**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis connection failure, verify 500 response

2. **Malformed site data in Redis**
   - Expected: Skip malformed sites, return valid sites
   - Test: Seed Redis with mix of valid and invalid site data, verify only valid sites returned

## Implementation Notes

- This endpoint is part of the public API and should be read-only
- No authentication or authorization checks are required
- Implement proper caching with appropriate cache headers for CDN compatibility
- Consider implementing rate limiting to prevent abuse
- Only return published sites that are meant for public viewing
- Exclude any sensitive configuration details from the response
- Use Redis sorted sets for efficient pagination and sorting
- Consider implementing field filtering to allow clients to request only needed fields

## Why No POST/PUT/DELETE Operations

The public API is intentionally read-only for several reasons:
1. **Security**: Limiting public endpoints to read-only operations reduces the attack surface
2. **Separation of Concerns**: Content creation and management belongs in the admin API
3. **User Experience**: Public users consume content, they don't manage it
4. **Performance**: Read-only endpoints can be heavily cached and optimized

For content submission, use the dedicated submission API (`/api/submit/*`) which has proper authentication and workflow controls. For content management, use the admin API (`/api/admin/*`) which has comprehensive security and permission checks.
