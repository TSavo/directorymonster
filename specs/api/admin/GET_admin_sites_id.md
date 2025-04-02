# GET /api/admin/sites/{siteId} API Specification

## Overview

This endpoint allows administrators to retrieve detailed information about a specific site within their tenant. It provides comprehensive site data including configuration, statistics, and content information.

## Requirements

### Functional Requirements

1. Return detailed information about a specific site
2. Include site configuration and settings
3. Include site statistics and usage metrics
4. Include site content information
5. Include site user access information
6. Support optional inclusion of related data

### Security Requirements

1. Require authentication with admin privileges
2. Validate tenant context for proper isolation
3. Enforce permission checks for site access
4. Log access for audit purposes
5. Implement rate limiting to prevent abuse

### Performance Requirements

1. Response time should be < 300ms
2. Implement proper caching for repeated access
3. Optimize database queries for performance

## API Specification

### Request

- Method: GET
- Path: /api/admin/sites/{siteId}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
- Query Parameters:
  - `includeCategories`: (boolean, optional, default: false) - Include category information
  - `includeListings`: (boolean, optional, default: false) - Include listing information
  - `includeUsers`: (boolean, optional, default: false) - Include user access information
  - `includeActivity`: (boolean, optional, default: false) - Include recent activity
  - `includeAnalytics`: (boolean, optional, default: false) - Include detailed analytics

### Response

#### Success (200 OK)

```json
{
  "site": {
    "id": "site_1234567890",
    "name": "Fishing Gear Reviews",
    "slug": "fishing-gear-reviews",
    "domain": "fishinggearreviews.com",
    "status": "active",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-03-20T14:45:30Z",
    "createdBy": {
      "id": "user_1234567890",
      "name": "John Smith"
    },
    "description": "Expert reviews of the best fishing gear and equipment",
    "logo": "https://assets.directorymonster.com/tenants/fishing-gear/logos/main-logo.png",
    "favicon": "https://assets.directorymonster.com/tenants/fishing-gear/logos/favicon.ico",
    "bannerImage": "https://assets.directorymonster.com/tenants/fishing-gear/banners/main-banner.jpg",
    "theme": {
      "primaryColor": "#0066CC",
      "secondaryColor": "#FFFFFF",
      "accentColor": "#FF9900",
      "fontFamily": "Roboto, sans-serif",
      "headerStyle": "standard",
      "footerStyle": "detailed",
      "cardStyle": "shadow",
      "customCss": null
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
    "stats": {
      "content": {
        "listingCount": 320,
        "categoryCount": 28,
        "featuredListings": 12,
        "pendingSubmissions": 15,
        "totalSubmissions": 450,
        "approvalRate": 0.85,
        "averageListingsPerCategory": 11.4
      },
      "traffic": {
        "viewsLastMonth": 45600,
        "uniqueVisitorsLastMonth": 12300,
        "averageTimeOnSite": 185, // seconds
        "bounceRate": 0.35,
        "topReferrers": [
          {"source": "Google", "visits": 8500},
          {"source": "Facebook", "visits": 2100},
          {"source": "Direct", "visits": 1700}
        ],
        "deviceBreakdown": {
          "desktop": 0.65,
          "mobile": 0.30,
          "tablet": 0.05
        }
      },
      "engagement": {
        "averagePageViewsPerVisit": 3.2,
        "searchUsageRate": 0.45,
        "categoryNavigationRate": 0.65,
        "listingClickThroughRate": 0.28
      },
      "growth": {
        "listingsGrowth": [
          {"month": "2024-01", "count": 120},
          {"month": "2024-02", "count": 210},
          {"month": "2024-03", "count": 320}
        ],
        "trafficGrowth": [
          {"month": "2024-01", "count": 15200},
          {"month": "2024-02", "count": 28400},
          {"month": "2024-03", "count": 45600}
        ]
      }
    },
    "categories": [
      {
        "id": "category_1234567890",
        "name": "Fishing Rods",
        "slug": "fishing-rods",
        "listingCount": 85,
        "featuredListings": 4,
        "isActive": true
      },
      {
        "id": "category_2345678901",
        "name": "Fishing Reels",
        "slug": "fishing-reels",
        "listingCount": 72,
        "featuredListings": 3,
        "isActive": true
      }
      // Additional categories if includeCategories=true
    ],
    "recentListings": [
      {
        "id": "listing_1234567890",
        "title": "Shimano Stradic FL Spinning Reel Review",
        "slug": "shimano-stradic-fl-spinning-reel-review",
        "categoryId": "category_2345678901",
        "categoryName": "Fishing Reels",
        "isFeatured": true,
        "createdAt": "2024-03-15T09:30:45Z"
      },
      {
        "id": "listing_2345678901",
        "title": "St. Croix Legend X Casting Rod Review",
        "slug": "st-croix-legend-x-casting-rod-review",
        "categoryId": "category_1234567890",
        "categoryName": "Fishing Rods",
        "isFeatured": true,
        "createdAt": "2024-03-10T14:20:30Z"
      }
      // Additional listings if includeListings=true
    ],
    "userAccess": [
      {
        "userId": "user_1234567890",
        "userName": "John Smith",
        "userEmail": "john@fishinggearreviews.com",
        "role": "owner",
        "permissions": ["manage", "publish", "edit", "delete", "view"],
        "lastAccessAt": "2024-04-03T09:15:22Z"
      },
      {
        "userId": "user_2345678901",
        "userName": "Jane Doe",
        "userEmail": "jane@fishinggearreviews.com",
        "role": "editor",
        "permissions": ["publish", "edit", "view"],
        "lastAccessAt": "2024-04-02T16:30:45Z"
      }
      // Additional users if includeUsers=true
    ],
    "recentActivity": [
      {
        "type": "listing_created",
        "timestamp": "2024-03-15T09:30:45Z",
        "user": {
          "id": "user_1234567890",
          "name": "John Smith"
        },
        "details": {
          "listingId": "listing_1234567890",
          "listingTitle": "Shimano Stradic FL Spinning Reel Review"
        }
      },
      {
        "type": "category_updated",
        "timestamp": "2024-03-12T11:45:30Z",
        "user": {
          "id": "user_2345678901",
          "name": "Jane Doe"
        },
        "details": {
          "categoryId": "category_1234567890",
          "categoryName": "Fishing Rods",
          "changes": ["description", "image"]
        }
      }
      // Additional activity if includeActivity=true
    ],
    "analytics": {
      // Detailed analytics if includeAnalytics=true
      "topSearchTerms": [
        {"term": "shimano reels", "count": 450},
        {"term": "carbon fiber rod", "count": 320},
        {"term": "saltwater fishing gear", "count": 280}
      ],
      "topListings": [
        {"id": "listing_1234567890", "title": "Shimano Stradic FL Spinning Reel Review", "views": 1250},
        {"id": "listing_2345678901", "title": "St. Croix Legend X Casting Rod Review", "views": 980}
      ],
      "conversionRates": {
        "listingToExternalSite": 0.28,
        "categoryToListing": 0.65,
        "searchToListing": 0.72
      },
      "geographicDistribution": {
        "countries": [
          {"name": "United States", "percentage": 0.65},
          {"name": "Canada", "percentage": 0.12},
          {"name": "United Kingdom", "percentage": 0.08}
        ],
        "regions": [
          {"name": "West Coast", "percentage": 0.35},
          {"name": "East Coast", "percentage": 0.25},
          {"name": "Midwest", "percentage": 0.15}
        ]
      }
    }
  }
}
```

#### Site Not Found (404 Not Found)

```json
{
  "error": "Site not found"
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
  "error": "Insufficient permissions to access this site"
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
  "error": "Failed to retrieve site details"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve site details**
   - Expected: 200 OK with detailed site information
   - Test: Send request with valid admin JWT, tenant ID, and site ID

2. **Retrieve site with categories**
   - Expected: 200 OK with site and category information
   - Test: Send request with includeCategories=true, verify category details included

3. **Retrieve site with listings**
   - Expected: 200 OK with site and listing information
   - Test: Send request with includeListings=true, verify listing details included

4. **Retrieve site with users**
   - Expected: 200 OK with site and user access information
   - Test: Send request with includeUsers=true, verify user access details included

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
   - Test: Request non-existent site ID, verify 404 response

2. **Site with large data volumes**
   - Expected: Proper handling of large data sets
   - Test: Create site with many categories, listings, and users, verify proper response

## Implementation Notes

- Implement proper tenant isolation using the tenant context header
- Use Redis for caching frequently accessed site details
- Implement conditional loading of detailed information based on query parameters
- Add appropriate logging for security and audit purposes
- Optimize database queries for performance
- Implement proper error handling with meaningful messages
- Consider implementing site data export functionality
- Ensure sensitive site information is properly protected

## Relationship to Site Management

This endpoint provides the detailed information administrators need to:

1. Understand site configuration and usage
2. Monitor site growth and activity
3. Analyze site performance and engagement
4. Manage site content and structure
5. Control user access and permissions

The detailed site view is essential for effective site management, enabling administrators to make informed decisions about their directory sites.