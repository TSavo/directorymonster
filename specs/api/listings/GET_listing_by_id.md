# GET /api/sites/[siteSlug]/listings/[listingId] API Testing Specification

## Overview

This endpoint retrieves detailed information about a specific listing identified by its ID within a particular site. It returns the complete listing object with additional category information and generated URLs.

## Requirements

### Functional Requirements

1. Retrieve a single listing by ID
2. Validate the listing belongs to the specified site
3. Include category information with the listing
4. Generate and include the listing's public URL
5. Properly handle non-existent listings

### Security Requirements

1. Implement tenant isolation
2. Validate site exists before attempting to fetch listing
3. Verify listing belongs to the specified site

## API Specification

### Request

- Method: GET
- Path: /api/sites/{siteSlug}/listings/{listingId}

### Response

#### Success (200 OK)

```json
{
  "id": "listing_1234567890",
  "siteId": "site_1234567890",
  "categoryId": "category_123456",
  "title": "Shimano Stradic FL Spinning Reel Review",
  "slug": "shimano-stradic-fl-spinning-reel-review",
  "metaDescription": "In-depth review of the Shimano Stradic FL spinning reel",
  "content": "The Shimano Stradic FL spinning reel offers exceptional performance...",
  "imageUrl": "https://example.com/images/shimano-stradic.jpg",
  "backlinkUrl": "https://fishingprostore.com/products/shimano-stradic",
  "backlinkAnchorText": "Shimano Stradic FL Spinning Reel",
  "backlinkPosition": "prominent",
  "backlinkType": "dofollow",
  "customFields": {
    "product_name": "Shimano Stradic FL Spinning Reel",
    "brand": "Shimano",
    "rating": 4.8
  },
  "createdAt": 1615482366000,
  "updatedAt": 1632145677000,
  "category": {
    "id": "category_123456",
    "name": "Fishing Reels",
    "slug": "fishing-reels"
  },
  "url": "https://example.com/fishing-reels/shimano-stradic-fl-spinning-reel-review"
}
```

#### Site Not Found (404 Not Found)

```json
{
  "error": "Site not found"
}
```

#### Listing Not Found (404 Not Found)

```json
{
  "error": "Listing not found"
}
```

#### Listing Not in Site (404 Not Found)

```json
{
  "error": "Listing not found in this site"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "error": "Failed to fetch listing"
}
```

## Testing Scenarios

### Success Scenarios

1. **Retrieve existing listing by ID**
   - Expected: 200 OK with listing object
   - Test: Create site, category, and listing; send GET request by ID
   - Validation: Verify all listing fields, category info, and URL are correct

2. **Listing with missing category**
   - Expected: 200 OK with null category
   - Test: Create listing with categoryId that doesn't exist
   - Validation: Verify response has null for category and url fields

3. **URL generation with domain**
   - Expected: URL generated with proper domain
   - Test: Create site with domain, add listing, retrieve listing
   - Validation: Verify URL uses site domain in proper format

4. **URL generation without domain (localhost)**
   - Expected: URL generated with localhost
   - Test: Create site without domain, add listing, retrieve listing
   - Validation: Verify URL uses localhost in proper format

### Error Scenarios

1. **Site not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent site slug
   - Validation: Confirm error message is "Site not found"

2. **Listing not found**
   - Expected: 404 Not Found
   - Test: Send request for non-existent listing ID
   - Validation: Confirm error message is "Listing not found"

3. **Listing exists but belongs to different site**
   - Expected: 404 Not Found
   - Test: Create listing in site1, attempt to access it through site2's endpoint
   - Validation: Confirm error message is "Listing not found in this site"

### Data Integrity Scenarios

1. **Handle Redis connection issues**
   - Expected: 500 Internal Server Error
   - Test: Simulate Redis connection failure
   - Validation: Confirm error message is "Failed to fetch listing"

2. **Handle corrupted listing or category data**
   - Expected: Graceful error handling
   - Test: Seed Redis with corrupt listing or category data
   - Validation: Verify appropriate error responses

## Implementation Notes

- Use Jest and Supertest for API endpoint testing
- Create mocks for Redis client to simulate different data scenarios
- Implement helper functions to create test fixtures for sites, categories, and listings
- Test URL generation with both domain and localhost scenarios
- Verify Redis key patterns match between test and implementation
- Create specific test cases for tenant isolation
- Test category lookup failures
