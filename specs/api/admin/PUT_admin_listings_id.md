# PUT /api/admin/listings/{listingId} API Specification

## Overview

This endpoint allows administrators to update existing listings in the system. It provides comprehensive control over all listing attributes, enabling admins to correct information, update content, modify status, and manage featured flags. The endpoint supports partial updates, allowing admins to modify only the fields that need to change.

## Requirements

### Functional Requirements

1. Update existing listings with complete or partial data
2. Allow modification of all listing attributes including media
3. Support category reassignment
4. Enable status changes (published, draft, suspended)
5. Allow featured flag and duration changes
6. Support reassignment to different users or organizations
7. Enable SEO metadata updates
8. Support rich media content updates

### Security Requirements

1. Require authentication with valid admin JWT token
2. Verify user has 'listing:update' permission
3. Enforce tenant isolation for multi-tenant environments
4. Sanitize all user input to prevent injection attacks
5. Validate all URLs and external resources
6. Log all changes for audit purposes

### Performance Requirements

1. Response time should be < 800ms including media processing
2. Handle large listing data efficiently
3. Process media updates properly (additions, removals, order changes)
4. Update search indices efficiently after changes

## API Specification

### Request

- Method: PUT
- Path: /api/admin/listings/{listingId}
- Headers:
  - Authorization: Bearer {JWT token}
  - X-Tenant-ID: {tenant ID}
  - Content-Type: application/json
- Path Parameters:
  - listingId: Unique identifier of the listing to update
- Body (partial update example):

```json
{
  "title": "Updated Premium Fishing Rod XL-5000 Pro Max",
  "description": "Updated high-quality carbon fiber fishing rod for professional anglers with improved grip",
  "price": {
    "value": 349.99,
    "currency": "USD"
  },
  "attributes": {
    "brand": "FisherPro",
    "material": "Carbon Fiber with Titanium Guides",
    "length": "12ft",
    "weight": "7.5oz",
    "warranty": "Lifetime Plus"
  },
  "specifications": [
    {
      "name": "Power",
      "value": "Medium-Heavy"
    },
    {
      "name": "Action",
      "value": "Extra-Fast"
    },
    {
      "name": "Pieces",
      "value": "2"
    }
  ],
  "tags": ["professional", "carbon-fiber", "saltwater", "lightweight", "tournament-grade"],
  "status": "published",
  "isFeatured": true,
  "featuredUntil": "2026-06-30T23:59:59Z"
}
```

### Response

#### Success (200 OK)

```json
{
  "listing": {
    "id": "listing_9876543210",
    "siteId": "site_1234",
    "siteName": "Fishing Gear Reviews",
    "categoryId": "category_5678",
    "categoryName": "Fishing Rods",
    "categoryPath": "Outdoor Gear > Fishing > Fishing Rods",
    "title": "Updated Premium Fishing Rod XL-5000 Pro Max",
    "slug": "premium-fishing-rod-xl5000-pro",
    "url": "https://fishinggeardirectory.com/listings/premium-fishing-rod-xl5000-pro",
    "description": "Updated high-quality carbon fiber fishing rod for professional anglers with improved grip",
    "longDescription": "<p>The XL-5000 Pro Max is our top-of-the-line fishing rod designed for serious anglers who demand the best. Crafted from premium carbon fiber materials with titanium guides, this rod offers unparalleled performance...</p>",
    "price": {
      "value": 349.99,
      "currency": "USD",
      "type": "retail",
      "range": {
        "min": 299.99,
        "max": 399.99
      }
    },
    "images": [
      {
        "id": "img_12345",
        "url": "https://example.com/images/fishing-rod-xl5000-main.jpg",
        "thumbnailUrl": "https://example.com/images/thumbnails/fishing-rod-xl5000-main.jpg",
        "alt": "XL-5000 Pro Max Fishing Rod",
        "isPrimary": true,
        "sortOrder": 1
      },
      {
        "id": "img_67890",
        "url": "https://example.com/images/fishing-rod-xl5000-detail.jpg",
        "thumbnailUrl": "https://example.com/images/thumbnails/fishing-rod-xl5000-detail.jpg",
        "alt": "XL-5000 Pro Max Handle Detail",
        "isPrimary": false,
        "sortOrder": 2
      }
    ],
    "videos": [
      {
        "id": "vid_12345",
        "url": "https://youtube.com/watch?v=abc123",
        "title": "XL-5000 Pro Max Features Overview",
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
      "material": "Carbon Fiber with Titanium Guides",
      "length": "12ft",
      "weight": "7.5oz",
      "warranty": "Lifetime Plus",
      "color": "Black/Silver"
    },
    "specifications": [
      {
        "name": "Power",
        "value": "Medium-Heavy"
      },
      {
        "name": "Action",
        "value": "Extra-Fast"
      },
      {
        "name": "Pieces",
        "value": "2"
      }
    ],
    "tags": ["professional", "carbon-fiber", "saltwater", "lightweight", "tournament-grade"],
    "seo": {
      "metaTitle": "Premium FisherPro XL-5000 Pro Max Fishing Rod | High-Performance Carbon Fiber",
      "metaDescription": "Experience unmatched performance with the FisherPro XL-5000 Pro Max carbon fiber fishing rod. Ideal for professional saltwater angling.",
      "keywords": ["fishing rod", "carbon fiber", "professional fishing gear", "FisherPro"]
    },
    "status": "published",
    "isFeatured": true,
    "featuredUntil": "2026-06-30T23:59:59Z",
    "ownerId": "user_1234567890",
    "ownerName": "FisherPro Official",
    "reviewStatus": "approved",
    "createdAt": "2025-03-15T10:30:22Z",
    "updatedAt": "2025-04-02T17:15:30Z",
    "updatedBy": {
      "id": "user_admin123",
      "username": "admin_user"
    },
    "publishDate": "2025-03-15T00:00:00Z",
    "expiryDate": "2026-03-15T00:00:00Z"
  },
  "revisionId": "rev_8765432109",
  "message": "Listing updated successfully",
  "changedFields": ["title", "description", "price.value", "attributes.material", "attributes.weight", "attributes.warranty", "specifications[1].value", "tags", "featuredUntil"]
}
```

#### Listing Not Found (404 Not Found)

```json
{
  "error": "Listing not found",
  "listingId": "listing_invalid123"
}
```

#### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title must be between 10 and 100 characters"
    },
    {
      "field": "price.value",
      "message": "Price must be a positive number"
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
  "error": "Insufficient permissions to update listings"
}
```

#### Conflict (409 Conflict)

```json
{
  "error": "Conflict with existing data",
  "details": {
    "conflictingField": "slug",
    "conflictingValue": "new-premium-fishing-rod",
    "existingListingId": "listing_1234567890"
  }
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to update listing"
}
```

## Testing Scenarios

### Success Scenarios

1. **Complete listing update**
   - Expected: 200 OK with updated listing details
   - Test: Send request with all fields changed
   - Validation: Verify all fields updated correctly

2. **Partial update (some fields)**
   - Expected: 200 OK with updated listing details
   - Test: Send request with only some fields changed
   - Validation: Verify only specified fields are updated

3. **Change listing status**
   - Expected: 200 OK with updated status
   - Test: Send request changing published to draft or suspended
   - Validation: Verify status change and appropriate side effects

4. **Update featured status**
   - Expected: 200 OK with updated featured flag
   - Test: Enable/disable featured status and change expiry date
   - Validation: Verify featured changes applied correctly

5. **Change category**
   - Expected: 200 OK with new category
   - Test: Update listing category
   - Validation: Verify category is updated and hierarchy path is correct

### Validation Scenarios

1. **Invalid field values**
   - Expected: 400 Bad Request
   - Test: Send request with invalid values (negative price, too long title)
   - Validation: Verify validation errors returned

2. **Required fields missing when changing status**
   - Expected: 400 Bad Request
   - Test: Change to published status without required fields
   - Validation: Verify validation errors for missing required fields

### Authorization Scenarios

1. **Missing permissions**
   - Expected: 403 Forbidden
   - Test: Send request as admin without listing:update permission
   - Validation: Verify appropriate error response

2. **Tenant isolation**
   - Expected: 404 Not Found or 403 Forbidden
   - Test: Admin from one tenant tries to update listing from another tenant
   - Validation: Verify appropriate access restrictions

### Edge Cases

1. **Update non-existent listing**
   - Expected: 404 Not Found
   - Test: Send update to invalid/deleted listing ID
   - Validation: Verify appropriate error response

2. **Slug conflict with another listing**
   - Expected: 409 Conflict or auto-resolved with unique slug
   - Test: Change slug to value already used by another listing
   - Validation: Verify conflict handling or slug uniqueness resolution

3. **Owner change implications**
   - Expected: 200 OK with ownership transfer
   - Test: Update listing owner to different user
   - Validation: Verify proper ownership transfer and notifications

### Media Management Scenarios

1. **Add new media**
   - Expected: 200 OK with updated media array
   - Test: Add new images or videos
   - Validation: Verify media properly added and processed

2. **Remove existing media**
   - Expected: 200 OK with updated media array
   - Test: Remove some existing media items
   - Validation: Verify media properly removed

3. **Reorder media**
   - Expected: 200 OK with updated sort order
   - Test: Change sort order of media items
   - Validation: Verify media displayed in new order

## Implementation Notes

- Implement comprehensive validation for all fields
- Support partial updates (only update fields that are present in the request)
- Consider change tracking to record which fields were modified
- Implement proper media management (add, remove, reorder)
- Consider revision history for audit and rollback purposes
- Ensure proper indexing updates for search functionality
- Validate category consistency if retaining category-specific attributes
- Consider notification to listing owner if admin makes changes
- Update caches and search indices after changes
- Apply proper tenant isolation for multi-tenant environments
- Support webhooks for external system notifications about updates
- Consider content moderation if description fields are updated