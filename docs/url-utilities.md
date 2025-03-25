# URL Utilities

This document describes the URL construction utilities in DirectoryMonster.

## Overview

DirectoryMonster uses a consistent approach to URL construction across the application. The following utilities are available in `src/lib/site-utils.ts`:

### Base Functions

These functions generate complete URLs with domains:

- `generateSiteBaseUrl(site)`: Generates the base URL for a site (e.g., `https://example.com` or `https://slug.mydirectory.com`)
- `generateCategoryUrl(site, categorySlug)`: Generates the full URL for a category page (e.g., `https://example.com/category-slug`)
- `generateListingUrl(site, categorySlug, listingSlug)`: Generates the full URL for a listing page (e.g., `https://example.com/category-slug/listing-slug`)

### Relative Functions

These functions generate relative paths for use in Next.js `Link` components:

- `generateCategoryHref(categorySlug)`: Generates a relative path for a category (e.g., `/category-slug`)
- `generateListingHref(categorySlug, listingSlug)`: Generates a relative path for a listing (e.g., `/category-slug/listing-slug`)

## Component Wrappers

For convenience, the following components are available in `src/components/LinkUtilities.tsx`:

- `CategoryLink`: A wrapper around `Link` that automatically generates the correct href for a category
- `ListingLink`: A wrapper around `Link` that automatically generates the correct href for a listing, handling the categorySlug/categoryId fallback
- `ListingLinkWithCategory`: A wrapper around `Link` for when you have the category and listing slugs separately

## Usage Examples

### Base URL Functions

```typescript
import { SiteConfig } from '@/types';
import { generateSiteBaseUrl, generateCategoryUrl, generateListingUrl } from '@/lib/site-utils';

// Example site
const site: SiteConfig = {
  id: 'site1',
  name: 'Example Site',
  slug: 'example',
  domain: 'example.com', // Optional
  // ...other site properties
};

// Generate site base URL
const baseUrl = generateSiteBaseUrl(site);
// Returns: https://example.com or https://example.mydirectory.com

// Generate category URL
const categoryUrl = generateCategoryUrl(site, 'hiking-gear');
// Returns: https://example.com/hiking-gear

// Generate listing URL
const listingUrl = generateListingUrl(site, 'hiking-gear', 'best-backpack-2025');
// Returns: https://example.com/hiking-gear/best-backpack-2025
```

### Relative Path Functions

```typescript
import { generateCategoryHref, generateListingHref } from '@/lib/site-utils';

// Generate category href for Next.js Link
const categoryHref = generateCategoryHref('hiking-gear');
// Returns: /hiking-gear

// Generate listing href for Next.js Link
const listingHref = generateListingHref('hiking-gear', 'best-backpack-2025');
// Returns: /hiking-gear/best-backpack-2025
```

### Link Component Wrappers

```tsx
import { CategoryLink, ListingLink } from '@/components/LinkUtilities';
import { Listing, Category } from '@/types';

// With a category object
<CategoryLink 
  category={category} 
  className="text-blue-600 hover:text-blue-800"
>
  {category.name}
</CategoryLink>

// With a listing object
<ListingLink 
  listing={listing}
  className="text-blue-600 hover:text-blue-800"
>
  {listing.title}
</ListingLink>
```

## Best Practices

1. Always use these utility functions when constructing URLs to ensure consistency
2. When working with category pages, populate `listing.categorySlug` to ensure proper URL construction (typically in `[categorySlug]/page.tsx`)
3. Use the `ListingLink` and `CategoryLink` components whenever possible to reduce code duplication
4. When creating new URLs, add appropriate tests to ensure they are correctly generated