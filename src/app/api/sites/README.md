# Sites API

This directory contains API endpoints for site-related operations.

## API Structure

The API follows a RESTful structure with nested resources:

```
/api/sites/[siteSlug]                                  # Site-level operations
/api/sites/[siteSlug]/categories                       # All categories for a site
/api/sites/[siteSlug]/categories/[categorySlug]        # Specific category operations
/api/sites/[siteSlug]/categories/[categorySlug]/listings # Listings within a specific category
/api/sites/[siteSlug]/listings                         # All listings for a site
/api/sites/[siteSlug]/listings/[listingSlug]           # Specific listing operations
```

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
  "createdAt": 1615482366000,
  "updatedAt": 1632145677000
}
```

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

## Implementation Details

The API endpoints use a service-based architecture:

- `SiteService`: Handles site-related operations
- `CategoryService`: Handles category-related operations
- `ListingService`: Handles listing-related operations

This approach provides better separation of concerns and makes the code more maintainable and testable.
