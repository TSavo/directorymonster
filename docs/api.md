# DirectoryMonster API Documentation

This document outlines the API endpoints available for programmatic interaction with the DirectoryMonster platform.

## Authentication

All API requests require an API key. API keys are scoped to specific sites and have specific permissions.

Include the API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Sites

#### GET /api/sites

List all sites you have access to.

**Response:**
```json
[
  {
    "id": "site_1234567890",
    "name": "Fishing Gear Reviews",
    "slug": "fishing-gear",
    "domain": "fishinggearreviews.com",
    "primaryKeyword": "fishing equipment reviews",
    "metaDescription": "Expert reviews of the best fishing gear",
    "headerText": "Expert Fishing Gear Reviews",
    "defaultLinkAttributes": "dofollow",
    "createdAt": 1615482366000,
    "updatedAt": 1632145677000
  }
]
```

#### POST /api/sites

Create a new site.

**Request Body:**
```json
{
  "name": "Fishing Gear Reviews",
  "slug": "fishing-gear",
  "domain": "fishinggearreviews.com",
  "primaryKeyword": "fishing equipment reviews",
  "metaDescription": "Expert reviews of the best fishing gear",
  "headerText": "Expert Fishing Gear Reviews",
  "defaultLinkAttributes": "dofollow"
}
```

**Response:**
```json
{
  "id": "site_1234567890",
  "name": "Fishing Gear Reviews",
  "slug": "fishing-gear",
  "domain": "fishinggearreviews.com",
  "primaryKeyword": "fishing equipment reviews",
  "metaDescription": "Expert reviews of the best fishing gear",
  "headerText": "Expert Fishing Gear Reviews",
  "defaultLinkAttributes": "dofollow",
  "createdAt": 1615482366000,
  "updatedAt": 1615482366000
}
```

### Listings

#### POST /api/sites/{siteSlug}/listings

Create a new listing with backlink.

**Request Body:**
```json
{
  "title": "Shimano Stradic FL Spinning Reel Review",
  "metaDescription": "In-depth review of the Shimano Stradic FL spinning reel",
  "content": "The Shimano Stradic FL spinning reel offers exceptional performance...",
  "categoryId": "category_123456",
  "imageUrl": "https://example.com/images/shimano-stradic.jpg",
  "backlinkUrl": "https://fishingprostore.com/products/shimano-stradic",
  "backlinkAnchorText": "Shimano Stradic FL Spinning Reel",
  "backlinkPosition": "prominent",
  "backlinkType": "dofollow",
  "customFields": {
    "product_name": "Shimano Stradic FL Spinning Reel",
    "brand": "Shimano",
    "rating": 4.8,
    "product_type": "spinning-reel"
  }
}
```

**Response:**
```json
{
  "id": "listing_7890123",
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
  "backlinkVerifiedAt": null,
  "customFields": {
    "product_name": "Shimano Stradic FL Spinning Reel",
    "brand": "Shimano",
    "rating": 4.8,
    "product_type": "spinning-reel"
  },
  "createdAt": 1615482366000,
  "updatedAt": 1615482366000
}
```

#### GET /api/sites/{siteSlug}/listings

List all listings for a site.

**Response:**
```json
[
  {
    "id": "listing_7890123",
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
    "backlinkVerifiedAt": null,
    "customFields": {
      "product_name": "Shimano Stradic FL Spinning Reel",
      "brand": "Shimano",
      "rating": 4.8,
      "product_type": "spinning-reel"
    },
    "createdAt": 1615482366000,
    "updatedAt": 1615482366000
  }
]
```