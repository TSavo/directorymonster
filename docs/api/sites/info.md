# Site Info API

The Site Info API provides endpoints for retrieving information about sites.

## API Structure

The API follows a RESTful structure with site-specific endpoints:

```http
/api/sites/[siteSlug]/info  # Information about a specific site
```

## Endpoints

### GET /api/sites/[siteSlug]/info

Retrieves information about a specific site by its slug.

#### Request

```http
GET /api/sites/example-site/info
```

#### Response

```json
{
  "site": {
    "id": "site123",
    "name": "Example Site",
    "slug": "example-site",
    "domain": "example.com",
    "settings": {
      "theme": "light",
      "featuredListings": 5
    },
    "createdAt": 1625097600000,
    "updatedAt": 1625097600000
  },
  "availableSites": [
    {
      "id": "site123",
      "name": "Example Site",
      "slug": "example-site",
      "domain": "example.com"
    },
    {
      "id": "site456",
      "name": "Another Site",
      "slug": "another-site",
      "domain": "another.com"
    }
  ]
}
```

#### Status Codes

- `200 OK`: The request was successful
- `404 Not Found`: The site was not found
- `500 Internal Server Error`: An error occurred on the server

## Deprecated API

The following API is deprecated and will be removed in a future version:

```http
GET /api/site-info
```

Please use the site-specific API instead:

```http
GET /api/sites/[siteSlug]/info
```

### Migration Guide

To migrate from the old API to the new API:

1. Determine the site slug from the current site context
2. Use the site slug in the new API endpoint: `/api/sites/[siteSlug]/info`
3. Update your code to handle the new response format

#### Example

Old API:

```javascript
// Old API usage
const response = await fetch('/api/site-info');
const data = await response.json();
const site = data.site;
```

New API:

```javascript
// New API usage
const siteSlug = 'example-site'; // Get this from your site context
const response = await fetch(`/api/sites/${siteSlug}/info`);
const data = await response.json();
const site = data.site;
```

## Notes

- The `availableSites` array contains a list of all sites in the system, which can be useful for navigation or site switching functionality.
- The `settings` object contains site-specific settings that can be configured by site administrators.
