# API Structure

DirectoryMonster follows a RESTful API structure with nested resources to provide a clear and intuitive interface for accessing data.

## RESTful Design Principles

The API is designed following these RESTful principles:

1. **Resource-Based**: Each endpoint represents a resource or collection of resources
2. **Hierarchical Structure**: Resources are organized in a hierarchical structure
3. **Standard HTTP Methods**: Uses standard HTTP methods (GET, POST, PUT, DELETE)
4. **Stateless**: Each request contains all information needed to process it
5. **Cacheable**: Responses include cache control headers for optimal performance

## API Endpoints

### Sites

```
/api/sites                                # All sites (admin only)
/api/sites/[siteSlug]                     # Specific site operations
```

### Categories

```
/api/sites/[siteSlug]/categories                # All categories for a site
/api/sites/[siteSlug]/categories/[categorySlug] # Specific category operations
```

### Listings

```
/api/sites/[siteSlug]/categories/[categorySlug]/listings # Listings within a specific category
/api/sites/[siteSlug]/listings                          # All listings for a site
/api/sites/[siteSlug]/listings/[listingSlug]            # Specific listing operations
```

### Users and Authentication

```
/api/auth/[...nextauth]                  # Authentication endpoints
/api/users                               # User management (admin only)
/api/tenants/[tenantId]/users            # Users within a tenant (admin only)
```

## URL Resolution

The platform supports multiple ways to access resources:

1. **Domain-based access**: 
   - `https://example.com/categories/category-name/listings`
   - `https://example.com/listings`

2. **Subdomain-based access**:
   - `https://site-name.example.com/categories/category-name/listings`
   - `https://site-name.example.com/listings`

3. **Path-based access**:
   - `/site/site-name/categories/category-name/listings`
   - `/site/site-name/listings`

4. **Query parameter-based access**:
   - `/categories/category-name/listings?site=site-name`
   - `/listings?site=site-name`

All these URL patterns are automatically rewritten to the canonical API endpoints by the edge middleware.

## Common Query Parameters

Most collection endpoints support these common query parameters:

- `page`: Page number for pagination (default: 1)
- `limit`: Number of items per page (default: 10, max: 100)
- `sort`: Field to sort by (e.g., createdAt, title)
- `order`: Sort order (asc or desc, default: asc)

## Response Format

All API responses follow a consistent format:

### Success Responses

For single resources:

```json
{
  "id": "resource_id",
  "field1": "value1",
  "field2": "value2",
  ...
}
```

For collections:

```json
{
  "results": [
    {
      "id": "resource_id_1",
      "field1": "value1",
      ...
    },
    {
      "id": "resource_id_2",
      "field1": "value2",
      ...
    }
  ],
  "pagination": {
    "totalResults": 42,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 10
  }
}
```

### Error Responses

```json
{
  "error": "Error message"
}
```

## Caching

All public API endpoints include appropriate cache control headers:

```
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=3600
```

This means:
- Responses can be cached by browsers and CDNs
- Responses are considered fresh for 60 seconds in browsers
- Responses are considered fresh for 300 seconds (5 minutes) in CDNs
- Stale responses can be used for up to 3600 seconds (1 hour) while revalidating in the background

## Authentication and Authorization

Protected endpoints require authentication using JWT tokens. The token should be included in the `Authorization` header:

```
Authorization: Bearer <token>
```

Different endpoints require different permissions based on the user's role and tenant membership.
