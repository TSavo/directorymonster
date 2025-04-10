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

## Site-Specific API Pattern

This API follows the site-specific pattern used throughout the application. All content in the system is site-specific, and the API URLs reflect this by including the site slug in the path.

### Usage Example

```javascript
// Get site information
const siteSlug = 'example-site'; // Get this from your site context
const response = await fetch(`/api/sites/${siteSlug}/info`);
const data = await response.json();
const site = data.site;
```

### Benefits of Site-Specific APIs

- **Security**: Explicit site context in the URL prevents cross-site data access
- **Clarity**: The URL clearly indicates which site's data is being accessed
- **Consistency**: All content APIs follow the same pattern
- **Simplicity**: No need to pass site IDs as query parameters

## Notes

- The `availableSites` array contains a list of all sites in the system, which can be useful for navigation or site switching functionality.
- The `settings` object contains site-specific settings that can be configured by site administrators.
