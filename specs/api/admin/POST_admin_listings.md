# POST /api/admin/listings API Specification

## Overview

This endpoint allows administrators to create new listings directly in the system, bypassing the normal submission process. This is useful for bulk imports, creating featured listings, or assisting users with listing creation. The endpoint handles validation, categorization, and immediate publishing options.

## Requirements

### Functional Requirements

1. Create new listings with all required fields
2. Support assignment to specific categories
3. Enable immediate publishing or draft status
4. Allow featured status designation
5. Support custom attributes based on category schema
6. Enable assignment to specific users or organizations
7. Support rich media content (images, videos) attachments
8. Enable proper SEO metadata configuration

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'listing:create' permission
3. Enforce tenant isolation for multi-tenant environments
4. Sanitize all user input to prevent injection attacks
5. Validate all URLs and external resources
6. Log creation events for audit purposes

### Performance Requirements

1. Response time should be < 1000ms including media processing
2. Support batch creation for multiple listings
3. Efficiently handle media uploads and processing
4. Scale to support enterprise-level listing volumes

## API Specification

### Request

- Method: POST
- Path: /api/admin/listings
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Body:

```json
{
  "siteId": "site_1234",
  "categoryId": "category_5678",
  "title": "Premium Fishing Rod XL-5000 Pro",
  "slug": "premium-fishing-rod-xl5000-pro",
  "description": "High-quality carbon fiber fishing rod for professional anglers",
  "longDescription": "<p>The XL-5000 Pro is our top-of-the-line fishing rod designed for serious anglers who demand the best. Crafted from premium carbon fiber materials, this rod offers...</p>",
  "price": {
    "value": 299.99,
    "currency": "USD",
    "type": "retail",
    "range": {
      "min": 249.99,
      "max": 349.99
    }
  },
  "images": [
    {
      "url": "https://example.com/images/fishing-rod-xl5000-main.jpg",
      "alt": "XL-5000 Pro Fishing Rod",
      "isPrimary": true,
      "sortOrder": 1
    },
    {
      "url": "https://example.com/images/fishing-rod-xl5000-detail.jpg",
      "alt": "XL-5000 Pro Handle Detail",
      "isPrimary": false,
      "sortOrder": 2
    }
  ],
  "videos": [
    {
      "url": "https://youtube.com/watch?v=abc123",
      "title": "XL-5000 Pro Features Overview",
      "thumbnail": "https://example.com/thumbnails/video1.jpg",
      "sortOrder": 1
    }
  ],
  "contactInfo": {
    "email": "sales@fisherpro.com",
    "phone": "+1-555-123-4567",
    "website": "https://fisherpro.com/xl5000pro",
    "address": {
      "line1": "123 Fishing Blvd",
      "line2": "Suite 100",
      "city": "Lakeville",
      "state": "MN",
      "zip": "55044",
      "country": "US"
    }
  },
  "attributes": {
    "brand": "FisherPro",
    "material": "Carbon Fiber",
    "length": "12ft",
    "weight": "8oz",
    "warranty": "Lifetime",
    "color": "Black/Silver"
  },
  "specifications": [
    {
      "name": "Power",
      "value": "Medium-Heavy"
    },
    {
      "name": "Action",
      "value": "Fast"
    },
    {
      "name": "Pieces",
      "value": "2"
    }
  ],
  "tags": ["professional", "carbon-fiber", "saltwater", "lightweight"],
  "seo": {
    "metaTitle": "Premium FisherPro XL-5000 Pro Fishing Rod | High-Performance Carbon Fiber",
    "metaDescription": "Experience unmatched performance with the FisherPro XL-5000 Pro carbon fiber fishing rod. Ideal for professional saltwater angling.",
    "keywords": ["fishing rod", "carbon fiber", "professional fishing gear", "FisherPro"]
  },
  "status": "published",
  "isFeatured": true,
  "featuredUntil": "2025-12-31T23:59:59Z",
  "ownerId": "user_1234567890",
  "reviewStatus": "approved",
  "reviewNote": "Admin-created featured listing for summer promotion",
  "publishDate": "2025-04-02T00:00:00Z",
  "expiryDate": "2026-04-02T00:00:00Z"
}
```

### Response

#### Success (201 Created)

```json
{
  "listing": {
    "id": "listing_9876543210",
    "siteId": "site_1234",
    "siteName": "Fishing Gear Reviews",
    "categoryId": "category_5678",
    "categoryName": "Fishing Rods",
    "categoryPath": "Outdoor Gear > Fishing > Fishing Rods",
    "title": "Premium Fishing Rod XL-5000 Pro",
    "slug": "premium-fishing-rod-xl5000-pro",
    "url": "https://fishinggeardirectory.com/listings/premium-fishing-rod-xl5000-pro",
    "description": "High-quality carbon fiber fishing rod for professional anglers",
    "longDescription": "<p>The XL-5000 Pro is our top-of-the-line fishing rod designed for serious anglers who demand the best. Crafted from premium carbon fiber materials, this rod offers...</p>",
    "price": {
      "value": 299.99,
      "currency": "USD",
      "type": "retail",
      "range": {
        "min": 249.99,
        "max": 349.99
      }
    },
    "images": [
      {
        "id": "img_12345",
        "url": "https://example.com/images/fishing-rod-xl5000-main.jpg",
        "thumbnailUrl": "https://example.com/images/thumbnails/fishing-rod-xl5000-main.jpg",
        "alt": "XL-5000 Pro Fishing Rod",
        "isPrimary": true,
        "sortOrder": 1
      },
      {
        "id": "img_67890",
        "url": "https://example.com/images/fishing-rod-xl5000-detail.jpg",
        "thumbnailUrl": "https://example.com/images/thumbnails/fishing-rod-xl5000-detail.jpg",
        "alt": "XL-5000 Pro Handle Detail",
        "isPrimary": false,
        "sortOrder": 2
      }
    ],
    "videos": [
      {
        "id": "vid_12345",
        "url": "https://youtube.com/watch?v=abc123",
        "title": "XL-5000 Pro Features Overview",
        "thumbnail": "https://example.com/thumbnails/video1.jpg",
        "sortOrder": 1
      }
    ],
    "contactInfo": {
      "email": "sales@fisherpro.com",
      "phone": "+1-555-123-4567",
      "website": "https://fisherpro.com/xl5000pro",
      "address": {
        "line1": "123 Fishing Blvd",
        "line2": "Suite 100",
        "city": "Lakeville",
        "state": "MN",
        "zip": "55044",
        "country": "US"
      }
    },
    "attributes": {
      "brand": "FisherPro",
      "material": "Carbon Fiber",
      "length": "12ft",
      "weight": "8oz",
      "warranty": "Lifetime",
      "color": "Black/Silver"
    },
    "specifications": [
      {
        "name": "Power",
        "value": "Medium-Heavy"
      },
      {
        "name": "Action",
        "value": "Fast"
      },
      {
        "name": "Pieces",
        "value": "2"
      }
    ],
    "tags": ["professional", "carbon-fiber", "saltwater", "lightweight"],
    "seo": {
      "metaTitle": "Premium FisherPro XL-5000 Pro Fishing Rod | High-Performance Carbon Fiber",
      "metaDescription": "Experience unmatched performance with the FisherPro XL-5000 Pro carbon fiber fishing rod. Ideal for professional saltwater angling.",
      "keywords": ["fishing rod", "carbon fiber", "professional fishing gear", "FisherPro"]
    },
    "status": "published",
    "isFeatured": true,
    "featuredUntil": "2025-12-31T23:59:59Z",
    "ownerId": "user_1234567890",
    "ownerName": "FisherPro Official",
    "reviewStatus": "approved",
    "reviewNote": "Admin-created featured listing for summer promotion",
    "createdAt": "2025-04-02T16:45:30Z",
    "createdBy": {
      "id": "user_admin123",
      "username": "admin_user"
    },
    "publishDate": "2025-04-02T00:00:00Z",
    "expiryDate": "2026-04-02T00:00:00Z",
    "updatedAt": "2025-04-02T16:45:30Z"
  },
  "message": "Listing created successfully"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required and must be between 10 and 100 characters"
    },
    {
      "field": "categoryId",
      "message": "Category not found"
    },
    {
      "field": "images",
      "message": "At least one image is required"
    }
  ]
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
  "error": "Insufficient permissions to create listings"
}
```

#### Conflict (409 Conflict)

```json
{
  "error": "Listing with this slug already exists",
  "details": {
    "conflictingField": "slug",
    "conflictingValue": "premium-fishing-rod-xl5000-pro",
    "existingListingId": "listing_1234567890"
  }
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to create listing"
}
```

## Testing Scenarios

### Success Scenarios

1. **Basic listing creation**
   - Expected: 201 Created with listing details
   - Test: Send request with all required fields
   - Validation: Verify listing is created with correct attributes

2. **Create featured listing**
   - Expected: 201 Created with featured flag set
   - Test: Send request with isFeatured=true
   - Validation: Verify listing has featured status and expiry date

3. **Create listing with rich media**
   - Expected: 201 Created with processed media
   - Test: Send request with multiple images and videos
   - Validation: Verify media is properly processed and associated

4. **Create listing with custom attributes**
   - Expected: 201 Created with custom attributes
   - Test: Send request with category-specific attributes
   - Validation: Verify attributes are saved correctly

### Authorization Scenarios

1. **Missing permissions**
   - Expected: 403 Forbidden
   - Test: Send request as admin without listing:create permission
   - Validation: Verify appropriate error response

2. **Tenant isolation**
   - Expected: Validation error or hidden categories
   - Test: Admin attempts to use category from different tenant
   - Validation: Verify appropriate restrictions

### Validation Scenarios

1. **Missing required fields**
   - Expected: 400 Bad Request
   - Test: Send request missing title, category, etc.
   - Validation: Verify validation errors for missing fields

2. **Invalid category**
   - Expected: 400 Bad Request
   - Test: Send request with non-existent categoryId
   - Validation: Verify appropriate error response

3. **Invalid date formats**
   - Expected: 400 Bad Request
   - Test: Send request with improperly formatted dates
   - Validation: Verify date validation errors

### Edge Cases

1. **Duplicate slug**
   - Expected: 409 Conflict or auto-generated unique slug
   - Test: Create listing with slug that already exists
   - Validation: Verify conflict handling or unique slug generation

2. **Large media payload**
   - Expected: 201 Created with proper processing
   - Test: Send request with multiple high-resolution images
   - Validation: Verify media processing completes successfully

3. **Extensive custom attributes**
   - Expected: 201 Created with all attributes
   - Test: Create listing with many custom attributes
   - Validation: Verify all attributes are saved correctly

4. **Special character handling**
   - Expected: 201 Created with properly encoded characters
   - Test: Create listing with special characters in text fields
   - Validation: Verify proper encoding and storage

## Implementation Notes

- Implement comprehensive validation for all fields
- Support automatic slug generation from title
- Process and optimize images (resize, compress, create thumbnails)
- Validate video URLs (support YouTube, Vimeo, etc.)
- Implement proper category hierarchy validation
- Ensure proper indexing for search functionality
- Consider implementing revision history
- Support translatable content for multi-language sites
- Implement proper audit logging
- Validate owner permissions if assigning to specific user
- Support webhook notifications for listing creation
- Consider implementing content moderation for description fields
- Apply proper tenant isolation for multi-tenant environments
- Support batch operations for enterprise use cases