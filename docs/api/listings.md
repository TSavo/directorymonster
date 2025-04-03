# Listings API

The Listings API provides endpoints for retrieving listings from sites and categories.

## API Structure

The API follows a RESTful structure with nested resources:

```http
/api/sites/[siteSlug]/categories/[categorySlug]/listings  # Listings within a specific category
/api/sites/[siteSlug]/listings                           # All listings for a site
/api/sites/[siteSlug]/listings/[listingSlug]             # Specific listing operations
```

## URL Resolution

The API supports multiple ways to access listings:

1. **Domain-based access**:
   - `https://example.com/categories/category-name/listings`
   - `https://example.com/listings`
   - Rewritten to: `/api/sites/example/categories/category-name/listings`

2. **Subdomain-based access**:
   - `https://site-name.example.com/categories/category-name/listings`
   - `https://site-name.example.com/listings`
   - Rewritten to: `/api/sites/site-name/categories/category-name/listings`

3. **Path-based access**:
   - `/site/site-name/categories/category-name/listings`
   - `/site/site-name/listings`
   - Rewritten to: `/api/sites/site-name/categories/category-name/listings`

4. **Query parameter-based access**:
   - `/categories/category-name/listings?site=site-name`
   - `/listings?site=site-name`
   - Rewritten to: `/api/sites/site-name/categories/category-name/listings`

All these URL patterns are automatically rewritten to the canonical API endpoints by the edge middleware.

## Endpoints

### GET /api/sites/[siteSlug]/listings

Retrieves all listings for a site, with optional filtering, sorting, and pagination.

**Query Parameters:**
- `categoryId` (optional): Filter listings by category ID
- `name` (optional): Filter listings by name (partial match)
- `status` (optional): Filter listings by status
- `sort` (optional): Field to sort by (e.g., createdAt, title)
- `order` (optional, default: asc): Sort order (asc or desc)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Results per page

**Response:**
```json
{
  "results": [
    {
      "id": "listing_1234567890",
      "siteId": "site_1234567890",
      "title": "Example Listing",
      "slug": "example-listing",
      "categoryId": "category_1234567890",
      "metaDescription": "Example description",
      "content": "Example content",
      "backlinkUrl": "https://example.com",
      "backlinkAnchorText": "Example Link",
      "backlinkPosition": "prominent",
      "backlinkType": "dofollow",
      "createdAt": 1615482366000,
      "updatedAt": 1632145677000
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

> Note: `createdAt` and `updatedAt` are Unix timestamps in milliseconds.

### GET /api/sites/[siteSlug]/listings/[listingSlug]

Retrieves a specific listing by its slug.

**Response:**
```json
{
  "id": "listing_1234567890",
  "siteId": "site_1234567890",
  "title": "Example Listing",
  "slug": "example-listing",
  "categoryId": "category_1234567890",
  "metaDescription": "Example description",
  "content": "Example content",
  "backlinkUrl": "https://example.com",
  "backlinkAnchorText": "Example Link",
  "backlinkPosition": "prominent",
  "backlinkType": "dofollow",
  "createdAt": 1615482366000,
  "updatedAt": 1632145677000
}
```

> Note: `createdAt` and `updatedAt` are Unix timestamps in milliseconds.

### GET /api/sites/[siteSlug]/categories/[categorySlug]/listings

Retrieves listings for a specific category within a site, with optional filtering, sorting, and pagination.

**Query Parameters:**
- `name` (optional): Filter listings by name (partial match)
- `status` (optional): Filter listings by status
- `sort` (optional): Field to sort by (e.g., createdAt, title)
- `order` (optional, default: asc): Sort order (asc or desc)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Results per page

**Response:**
```json
{
  "results": [
    {
      "id": "listing_1234567890",
      "siteId": "site_1234567890",
      "title": "Example Listing",
      "slug": "example-listing",
      "categoryId": "category_1234567890",
      "metaDescription": "Example description",
      "content": "Example content",
      "backlinkUrl": "https://example.com",
      "backlinkAnchorText": "Example Link",
      "backlinkPosition": "prominent",
      "backlinkType": "dofollow",
      "createdAt": 1615482366000,
      "updatedAt": 1632145677000
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

## Caching

All listing endpoints include appropriate cache control headers:

```http
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=3600
```

This means:
- Responses can be cached by browsers and CDNs
- Responses are considered fresh for 60 seconds in browsers
- Responses are considered fresh for 300 seconds (5 minutes) in CDNs
- Stale responses can be used for up to 3600 seconds (1 hour) while revalidating in the background

### Cache Invalidation

The API implements the following cache invalidation strategies:

1. **Time-based expiration**: Cached responses automatically expire based on the cache control headers.
2. **Conditional requests**: Clients can use `If-Modified-Since` and `If-None-Match` headers to validate cached responses.
3. **Manual invalidation**: When a listing is updated or deleted, related cache entries are automatically purged.

Error responses (4xx and 5xx status codes) and non-GET requests are never cached.
