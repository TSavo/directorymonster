# PUT /api/admin/sites/{siteId} API Specification

## Overview

This endpoint allows administrators to update an existing site's configuration, settings, and appearance. It provides comprehensive control over all aspects of a directory site.

## Requirements

### Functional Requirements

1. Update site configuration and settings
2. Modify site appearance and branding
3. Update SEO configuration
4. Change site status
5. Modify user access permissions
6. Return the updated site details

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for site management
4. Validate all input data for security
5. Log update action for audit purposes
6. Implement rate limiting to prevent abuse

### Performance Requirements

1. Response time should be < 1000ms
2. Handle the transaction atomically
3. Implement proper error handling
4. Update resources efficiently

## API Specification

### Request

- Method: PUT
- Path: /api/admin/sites/{siteId}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:
  ```json
  {
    "name": "Updated Fishing Gear Reviews",
    "domain": "newfishinggearreviews.com",
    "status": "active",
    "description": "Expert reviews and guides for the best fishing gear and equipment",
    "logo": {
      "file": "base64-encoded-image-data",
      "filename": "new-logo.png",
      "contentType": "image/png"
    },
    "theme": {
      "primaryColor": "#005599",
      "secondaryColor": "#FFFFFF",
      "accentColor": "#FF6600",
      "fontFamily": "Montserrat, sans-serif",
      "headerStyle": "modern",
      "footerStyle": "simple",
      "cardStyle": "rounded"
    },
    "contact": {
      "email": "info@newfishinggearreviews.com",
      "phone": "+1-555-987-6543",
      "address": {
        "street": "456 Oak St",
        "city": "Seattle",
        "state": "WA",
        "zipCode": "98102",
        "country": "USA"
      },
      "socialMedia": {
        "facebook": "https://facebook.com/newfishinggearreviews",
        "twitter": "https://twitter.com/newfishinggear",
        "instagram": "https://instagram.com/newfishinggearreviews",
        "youtube": "https://youtube.com/newfishinggearreviews"
      }
    },
    "settings": {
      "general": {
        "listingsPerPage": 30,
        "showFeaturedListings": true,
        "featuredListingsCount": 8,
        "defaultSortOrder": "newest",
        "showCategoryDescription": true,
        "showBreadcrumbs": true,
        "enablePrintListings": true
      },
      "submissions": {
        "enableSubmissions": true,
        "requireApproval": true,
        "allowAnonymousSubmissions": true,
        "notifyAdminsOnNewSubmission": true,
        "submissionFormFields": [
          {"name": "title", "required": true},
          {"name": "description", "required": true},
          {"name": "url", "required": true},
          {"name": "contactEmail", "required": true},
          {"name": "contactName", "required": false},
          {"name": "contactPhone", "required": false},
          {"name": "images", "required": true, "max": 10}
        ],
        "submissionGuidelines": "Please provide accurate and detailed information about the fishing gear you're submitting. High-quality images are required. Include specific product specifications and features."
      },
      "interaction": {
        "enableComments": true,
        "moderateComments": true,
        "enableRatings": true,
        "enableSharing": true,
        "enableFavorites": true
      },
      "notifications": {
        "adminEmails": ["admin@newfishinggearreviews.com", "editor@newfishinggearreviews.com"],
        "notifyOnNewComment": true,
        "notifyOnNewRating": true
      },
      "advanced": {
        "customHeaderHtml": "<script>console.log('Custom header script');</script>",
        "customFooterHtml": "<div class='custom-footer'>Custom footer content</div>",
        "customScripts": null,
        "robotsTxt": "User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://newfishinggearreviews.com/sitemap.xml"
      }
    },
    "seo": {
      "metaTitle": "Updated Fishing Gear Reviews - Expert Guides & Reviews",
      "metaDescription": "Find expert reviews and guides for the best fishing gear and equipment. Trusted recommendations from experienced anglers.",
      "keywords": ["fishing gear", "fishing equipment", "fishing reviews", "fishing guides", "fishing rods", "fishing reels"],
      "googleAnalyticsId": "UA-87654321-1",
      "googleSearchConsoleId": "zyxwvutsrqponmlkjih",
      "sitemapEnabled": true,
      "sitemapFrequency": "daily",
      "canonicalUrl": "https://newfishinggearreviews.com",
      "structuredData": {
        "type": "Organization",
        "name": "Updated Fishing Gear Reviews",
        "url": "https://newfishinggearreviews.com",
        "logo": "https://assets.directorymonster.com/tenants/fishing-gear/sites/fishing-gear-reviews/new-logo.png"
      }
    },
    "userAccess": [
      {
        "userId": "user_3456789012",
        "role": "admin",
        "permissions": ["manage", "publish", "edit", "view"]
      },
      {
        "userId": "user_4567890123",
        "role": "contributor",
        "permissions": ["edit", "view"]
      }
    ]
  }
  ```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Site updated successfully",
  "site": {
    "id": "site_1234567890",
    "name": "Updated Fishing Gear Reviews",
    "slug": "fishing-gear-reviews",
    "domain": "newfishinggearreviews.com",
    "status": "active",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-04-04T17:15:30Z",
    "updatedBy": {
      "id": "user_1234567890",
      "name": "John Smith"
    },
    "description": "Expert reviews and guides for the best fishing gear and equipment",
    "logo": "https://assets.directorymonster.com/tenants/fishing-gear/sites/fishing-gear-reviews/new-logo.png",
    "userAccess": [
      {
        "userId": "user_1234567890",
        "userName": "John Smith",
        "role": "owner",
        "permissions": ["manage", "publish", "edit", "delete", "view"]
      },
      {
        "userId": "user_3456789012",
        "userName": "Robert Johnson",
        "role": "admin",
        "permissions": ["manage", "publish", "edit", "view"]
      },
      {
        "userId": "user_4567890123",
        "userName": "Sarah Williams",
        "role": "contributor",
        "permissions": ["edit", "view"]
      }
    ],
    "changeLog": [
      {
        "field": "name",
        "oldValue": "Fishing Gear Reviews",
        "newValue": "Updated Fishing Gear Reviews",
        "changedAt": "2024-04-04T17:15:30Z"
      },
      {
        "field": "domain",
        "oldValue": "fishinggearreviews.com",
        "newValue": "newfishinggearreviews.com",
        "changedAt": "2024-04-04T17:15:30Z"
      },
      {
        "field": "theme",
        "changedAt": "2024-04-04T17:15:30Z"
      },
      {
        "field": "settings",
        "changedAt": "2024-04-04T17:15:30Z"
      },
      {
        "field": "seo",
        "changedAt": "2024-04-04T17:15:30Z"
      },
      {
        "field": "userAccess",
        "changedAt": "2024-04-04T17:15:30Z"
      }
    ]
  }
}
```

#### Site Not Found (404 Not Found)

```json
{
  "error": "Site not found"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "domain",
      "message": "Domain must be a valid hostname"
    },
    {
      "field": "settings.general.listingsPerPage",
      "message": "Must be a number between 5 and 100"
    }
  ]
}
```

#### Duplicate Domain (409 Conflict)

```json
{
  "error": "Domain already in use",
  "field": "domain",
  "value": "newfishinggearreviews.com"
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
  "error": "Insufficient permissions to update this site"
}
```

#### Invalid Tenant (403 Forbidden)

```json
{
  "error": "Invalid tenant context"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to update site"
}
```

## Testing Scenarios

### Success Scenarios

1. **Update site basic information**
   - Expected: 200 OK with updated site details
   - Test: Send update request with new name and domain, verify changes applied

2. **Update site appearance**
   - Expected: 200 OK with updated appearance
   - Test: Send update with new theme and logo, verify appearance updated

3. **Update site settings**
   - Expected: 200 OK with updated settings
   - Test: Send update with new settings configuration, verify settings updated

4. **Update user access**
   - Expected: 200 OK with updated user access
   - Test: Send update with new user access configuration, verify permissions updated

5. **Update site status**
   - Expected: 200 OK with new status
   - Test: Send update with status change (e.g., active to inactive), verify status updated

### Validation Failure Scenarios

1. **Invalid data formats**
   - Expected: 400 Bad Request
   - Test: Send update with invalid domain, email, etc., verify validation errors

2. **Invalid image data**
   - Expected: 400 Bad Request
   - Test: Send update with invalid image data, verify validation error

3. **Invalid settings values**
   - Expected: 400 Bad Request
   - Test: Send update with invalid settings values, verify validation errors

### Conflict Scenarios

1. **Duplicate domain**
   - Expected: 409 Conflict
   - Test: Attempt to update with domain already used by another site, verify conflict error

### Authentication and Authorization Scenarios

1. **Missing authentication**
   - Expected: 401 Unauthorized
   - Test: Send request without authentication token, verify 401 response

2. **Non-admin user**
   - Expected: 403 Forbidden
   - Test: Send request with non-admin JWT, verify 403 response

3. **Admin from different tenant**
   - Expected: 404 Not Found or 403 Forbidden
   - Test: Send request with admin JWT but for different tenant, verify proper tenant isolation

### Edge Case Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Attempt to update non-existent site ID, verify 404 response

2. **No changes in update**
   - Expected: 200 OK with unchanged site
   - Test: Send update identical to current data, verify no changes and appropriate response

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use transactions to ensure atomicity of site update process
- Track and log all changes for audit purposes
- Process and store uploaded images securely
- Validate domain ownership or implement domain verification process for domain changes
- Add appropriate logging for security and audit purposes
- Ensure proper validation of all updated fields
- Handle domain changes carefully, including DNS verification
- Consider implementing approval workflows for critical changes
- Implement proper error handling with meaningful messages
- Consider implementing site update templates for common scenarios
- Ensure all site-specific Redis keys are properly updated if identifiers change

## Site Status Types

1. **active**: Site is live and accessible to users
2. **inactive**: Site is temporarily disabled but not deleted
3. **maintenance**: Site is in maintenance mode (shows maintenance page)
4. **archived**: Site has been archived (not deleted but no longer active)

## Critical Changes Requiring Special Handling

Some site changes require special handling:

1. **Domain Changes**: May require DNS verification and certificate updates
2. **Status Changes**: May affect site accessibility and functionality
3. **User Access Changes**: Should notify affected users
4. **SEO Changes**: May require search engine reindexing
5. **Custom Script Changes**: Should be validated for security

These critical changes should be carefully validated and may require additional confirmation steps.