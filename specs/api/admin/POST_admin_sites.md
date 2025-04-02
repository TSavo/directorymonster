# POST /api/admin/sites API Specification

## Overview

This endpoint allows administrators to create a new site within their tenant. It provisions all necessary resources and configurations for a new directory site.

## Requirements

### Functional Requirements

1. Create a new site with specified configuration
2. Set up site appearance and branding
3. Configure site settings and preferences
4. Set up SEO configuration
5. Create initial categories if specified
6. Return the newly created site details

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for site creation
4. Validate all input data for security
5. Log creation action for audit purposes
6. Implement rate limiting to prevent abuse

### Performance Requirements

1. Response time should be < 1000ms
2. Handle the transaction atomically
3. Implement proper error handling
4. Provision resources efficiently

## API Specification

### Request

- Method: POST
- Path: /api/admin/sites
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
  ```json
  {
    "name": "Fishing Gear Reviews",
    "slug": "fishing-gear-reviews",
    "domain": "fishinggearreviews.com",
    "description": "Expert reviews of the best fishing gear and equipment",
    "logo": {
      "file": "base64-encoded-image-data",
      "filename": "logo.png",
      "contentType": "image/png"
    },
    "favicon": {
      "file": "base64-encoded-image-data",
      "filename": "favicon.ico",
      "contentType": "image/x-icon"
    },
    "bannerImage": {
      "file": "base64-encoded-image-data",
      "filename": "banner.jpg",
      "contentType": "image/jpeg"
    },
    "theme": {
      "primaryColor": "#0066CC",
      "secondaryColor": "#FFFFFF",
      "accentColor": "#FF9900",
      "fontFamily": "Roboto, sans-serif",
      "headerStyle": "standard",
      "footerStyle": "detailed",
      "cardStyle": "shadow"
    },
    "contact": {
      "email": "contact@fishinggearreviews.com",
      "phone": "+1-555-123-4567",
      "address": {
        "street": "123 Main St",
        "city": "Seattle",
        "state": "WA",
        "zipCode": "98101",
        "country": "USA"
      },
      "socialMedia": {
        "facebook": "https://facebook.com/fishinggearreviews",
        "twitter": "https://twitter.com/fishinggearrev",
        "instagram": "https://instagram.com/fishinggearreviews",
        "youtube": "https://youtube.com/fishinggearreviews"
      }
    },
    "settings": {
      "general": {
        "listingsPerPage": 20,
        "showFeaturedListings": true,
        "featuredListingsCount": 6,
        "defaultSortOrder": "featured",
        "showCategoryDescription": true,
        "showBreadcrumbs": true,
        "enablePrintListings": true
      },
      "submissions": {
        "enableSubmissions": true,
        "requireApproval": true,
        "allowAnonymousSubmissions": false,
        "notifyAdminsOnNewSubmission": true,
        "submissionFormFields": [
          {"name": "title", "required": true},
          {"name": "description", "required": true},
          {"name": "url", "required": true},
          {"name": "contactEmail", "required": true},
          {"name": "contactName", "required": true},
          {"name": "contactPhone", "required": false},
          {"name": "images", "required": false, "max": 5}
        ],
        "submissionGuidelines": "Please provide accurate and detailed information about the fishing gear you're submitting. Include high-quality images and specific product details."
      },
      "interaction": {
        "enableComments": false,
        "moderateComments": true,
        "enableRatings": true,
        "enableSharing": true,
        "enableFavorites": true
      },
      "notifications": {
        "adminEmails": ["admin@fishinggearreviews.com", "john@fishinggearreviews.com"],
        "notifyOnNewComment": true,
        "notifyOnNewRating": true
      },
      "advanced": {
        "customHeaderHtml": null,
        "customFooterHtml": null,
        "customScripts": null,
        "robotsTxt": "User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://fishinggearreviews.com/sitemap.xml"
      }
    },
    "seo": {
      "metaTitle": "Fishing Gear Reviews - Expert Reviews of Fishing Equipment",
      "metaDescription": "Find expert reviews of the best fishing gear and equipment. Trusted recommendations for anglers of all levels.",
      "keywords": ["fishing gear", "fishing equipment", "fishing reviews", "fishing rods", "fishing reels"],
      "googleAnalyticsId": "UA-12345678-1",
      "googleSearchConsoleId": "abcdefghijklmnopqrst",
      "sitemapEnabled": true,
      "sitemapFrequency": "weekly",
      "canonicalUrl": "https://fishinggearreviews.com",
      "structuredData": {
        "type": "Organization",
        "name": "Fishing Gear Reviews",
        "url": "https://fishinggearreviews.com",
        "logo": "https://assets.directorymonster.com/tenants/fishing-gear/logos/main-logo.png"
      }
    },
    "initialCategories": [
      {
        "name": "Fishing Rods",
        "slug": "fishing-rods",
        "description": "Reviews and information about the best fishing rods for all types of fishing.",
        "image": {
          "file": "base64-encoded-image-data",
          "filename": "fishing-rods.jpg",
          "contentType": "image/jpeg"
        }
      },
      {
        "name": "Fishing Reels",
        "slug": "fishing-reels",
        "description": "Comprehensive reviews of spinning reels, baitcasting reels, and more.",
        "image": {
          "file": "base64-encoded-image-data",
          "filename": "fishing-reels.jpg",
          "contentType": "image/jpeg"
        }
      }
    ],
    "userAccess": [
      {
        "userId": "user_2345678901",
        "role": "editor",
        "permissions": ["publish", "edit", "view"]
      }
    ]
  }
  ```

### Response

#### Success (201 Created)

```json
{
  "success": true,
  "message": "Site created successfully",
  "site": {
    "id": "site_1234567890",
    "name": "Fishing Gear Reviews",
    "slug": "fishing-gear-reviews",
    "domain": "fishinggearreviews.com",
    "status": "active",
    "createdAt": "2024-04-04T16:30:45Z",
    "updatedAt": "2024-04-04T16:30:45Z",
    "createdBy": {
      "id": "user_1234567890",
      "name": "John Smith"
    },
    "description": "Expert reviews of the best fishing gear and equipment",
    "logo": "https://assets.directorymonster.com/tenants/fishing-gear/sites/fishing-gear-reviews/logo.png",
    "favicon": "https://assets.directorymonster.com/tenants/fishing-gear/sites/fishing-gear-reviews/favicon.ico",
    "bannerImage": "https://assets.directorymonster.com/tenants/fishing-gear/sites/fishing-gear-reviews/banner.jpg",
    "categories": [
      {
        "id": "category_1234567890",
        "name": "Fishing Rods",
        "slug": "fishing-rods"
      },
      {
        "id": "category_2345678901",
        "name": "Fishing Reels",
        "slug": "fishing-reels"
      }
    ],
    "userAccess": [
      {
        "userId": "user_1234567890",
        "userName": "John Smith",
        "role": "owner",
        "permissions": ["manage", "publish", "edit", "delete", "view"]
      },
      {
        "userId": "user_2345678901",
        "userName": "Jane Doe",
        "role": "editor",
        "permissions": ["publish", "edit", "view"]
      }
    ],
    "setupInstructions": {
      "nextSteps": [
        "Complete domain verification",
        "Add more categories if needed",
        "Create your first listings",
        "Customize site appearance"
      ],
      "setupGuideUrl": "https://admin.directorymonster.com/guides/new-site-setup"
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
      "message": "Site name is required"
    },
    {
      "field": "slug",
      "message": "Slug must contain only lowercase letters, numbers, and hyphens"
    }
  ]
}
```

#### Duplicate Site (409 Conflict)

```json
{
  "error": "Site already exists",
  "field": "slug",
  "value": "fishing-gear-reviews"
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
  "error": "Insufficient permissions to create sites"
}
```

#### Invalid Tenant (403 Forbidden)

```json
{
  "error": "Invalid tenant context"
}
```

#### Resource Limit Exceeded (403 Forbidden)

```json
{
  "error": "Resource limit exceeded",
  "resource": "sites",
  "limit": 3,
  "current": 3
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to create site"
}
```

## Testing Scenarios

### Success Scenarios

1. **Create site with all fields**
   - Expected: 201 Created with site details
   - Test: Send complete site creation request, verify site created with all specified settings

2. **Create site with minimal fields**
   - Expected: 201 Created with site details
   - Test: Send site creation with only required fields, verify site created with default settings for omitted fields

3. **Create site with initial categories**
   - Expected: 201 Created with site and category details
   - Test: Send creation request with initialCategories data, verify both site and categories are created

4. **Create site with user access**
   - Expected: 201 Created with user access configured
   - Test: Send creation request with userAccess data, verify user permissions are set correctly

### Validation Failure Scenarios

1. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send creation request missing required fields, verify appropriate validation errors

2. **Invalid data formats**
   - Expected: 400 Bad Request
   - Test: Send creation request with invalid domain, email, etc., verify validation errors

3. **Invalid image data**
   - Expected: 400 Bad Request
   - Test: Send creation request with invalid image data, verify validation error

### Conflict Scenarios

1. **Duplicate site slug**
   - Expected: 409 Conflict
   - Test: Attempt to create site with existing slug, verify conflict error

2. **Duplicate domain**
   - Expected: 409 Conflict
   - Test: Attempt to create site with existing domain, verify conflict error

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Non-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with non-admin JWT, verify 403 response

3. **Admin from different tenant**
   - Expected: 403 Forbidden
   - Test: Send request with admin JWT but for different tenant, verify proper tenant isolation

### Resource Limit Scenarios

1. **Exceed site limit**
   - Expected: 403 Forbidden with resource limit error
   - Test: Create sites up to subscription limit, then attempt to create one more, verify limit error

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use transactions to ensure atomicity of site creation process
- Process and store uploaded images securely
- Validate domain ownership or implement domain verification process
- Add appropriate logging for security and audit purposes
- Check subscription limits before creating new sites
- Generate proper slugs from site names if not provided
- Ensure proper isolation of site resources from creation
- Implement proper error handling with meaningful messages
- Consider adding post-creation setup wizard functionality
- Ensure all site-specific Redis keys are properly prefixed with tenant and site identifiers

## Site Creation Process

The site creation process involves several steps:

1. **Validation**: Validate all input data for correctness and uniqueness
2. **Resource Allocation**: Allocate necessary resources for the site
3. **Asset Processing**: Process and store uploaded images and assets
4. **Configuration**: Apply the specified settings and preferences
5. **Category Creation**: Create initial categories if specified
6. **User Access**: Configure user access permissions
7. **Indexing**: Set up search indexing for the new site
8. **Logging**: Log the creation for audit purposes

This comprehensive process ensures that new sites are properly provisioned and ready for use immediately after creation.