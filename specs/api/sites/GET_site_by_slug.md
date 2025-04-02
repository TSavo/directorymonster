# GET /api/sites/[siteSlug] API Testing Specification

## Overview

This endpoint retrieves detailed information about a specific site identified by its slug. It returns the complete site configuration if the site exists and the user has access to it.

## Requirements

### Functional Requirements

1. Retrieve site details by slug
2. Handle test environment by using appropriate key prefixes
3. Return complete site configuration data
4. Convert any string JSON responses to proper objects

### Security Requirements

1. Require tenant context validation (for administrative access)
2. Implement public access for site frontend rendering (with limited data)
3. Handle permissions appropriately based on access context

## API Specification

### Request

- Method: GET
- Path: /api/sites/{siteSlug}
- Headers:
  - Authorization: Bearer {JWT token} (optional for public access)
  - X-Tenant-ID: {tenant ID} (optional for public access)

### Response

#### Success (200 OK)

```json
{
  "id": "site_1234567890",
  "name": "Fishing Gear Reviews",
  "slug": "fishing-gear",
  "domain": "fishinggearreviews.com",
  "primaryKeyword": "fishing equipment reviews",
  "metaDescription": "Expert reviews of the best fishing gear",
  "headerText": "Expert Fishing Gear Reviews",
  "logoUrl": "https://example.com/logo.png",
  "defaultLinkAttributes": "dofollow",
  "createdAt": 1615482366000,
  "updatedAt": 1632145677000
}
```

#### Not Found (404 Not Found)

```json
{
  "error": "Site not found"
}
```

#### Unauthorized (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

#### Forbidden (403 Forbidden)

```json
{
  "error": "Insufficient permissions"
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

1. **Retrieve existing site by slug (authenticated admin)**
   - Expected: 200 OK with complete site object
   - Test: Send request with valid JWT and tenant ID for an existing site, verify response contains full site details

2. **Retrieve existing site by slug (public access)**
   - Expected: 200 OK with limited site object
   - Test: Send request without authentication for a publicly accessible site, verify response contains limited site details

3. **Retrieve site with JSON string from Redis**
   - Expected: 200 OK with properly parsed site object
   - Test: Mock Redis to return JSON string, verify response contains properly parsed object

### Error Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent site slug, verify 404 response

2. **Invalid site data in Redis**
   - Expected: 500 Internal Server Error or 404 Not Found
   - Test: Mock Redis to return invalid JSON, verify appropriate error response

### Authentication and Authorization Scenarios

1. **Access restricted site without authentication**
   - Expected: 401 Unauthorized or limited data response
   - Test: Send public request for restricted site, verify appropriate response

2. **Access site from different tenant**
   - Expected: 404 Not Found or limited data response
   - Test: Send authenticated request from tenant1 for site in tenant2, verify appropriate response

3. **Access with insufficient permissions**
   - Expected: 403 Forbidden or limited data response
   - Test: Send request with JWT for user without site:read permission, verify appropriate response

### Environment Handling Scenarios

1. **Test environment key prefixing**
   - Expected: 200 OK when test prefix is used in test environment
   - Test: In test environment, mock Redis to return data for "test:site:slug:{slug}" but not for "site:slug:{slug}", verify 200 response

## Implementation Notes

- Test both direct Redis string responses and object responses
- Verify proper handling of JSON parsing errors
- Test both authenticated and public access patterns
- Implement environment-aware testing to validate test prefixing
- Create test fixtures for sites with varying visibility and access settings
