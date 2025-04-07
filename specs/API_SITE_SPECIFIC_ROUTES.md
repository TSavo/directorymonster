# API Site-Specific Routes Specification

## Overview

This specification outlines the necessary changes to ensure all API routes in the DirectoryMonster platform follow the architectural principle that content (listings, categories, etc.) must always be site-specific. The changes focus on removing inconsistent terminology and enforcing site context in all relevant API endpoints.

## Background

Our architectural review identified several issues with the current API implementation:

1. The existence of a `/api/products` route that uses inconsistent terminology (we use "listings" not "products")
2. The search API that doesn't follow the site-specific URL pattern (`/api/sites/[siteSlug]/search`)

These issues need to be addressed to maintain a consistent architecture and prevent potential security vulnerabilities.

## Detailed Changes

### 1. Remove `/api/products` Route

**Issue**: The `/api/products` route uses inconsistent terminology and doesn't properly enforce site-specific content access.

**Files to Remove**:
- `src/app/api/products/route.ts`

**Tests to Create**:
Create a test file to verify that the route has been removed and that the proper site-specific endpoint is used instead.

```typescript
// File: tests/unit/api/products/removed.test.ts

/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

describe('Products API Removal', () => {
  it('should not have a products API route file', () => {
    const routePath = path.join(process.cwd(), 'src/app/api/products/route.ts');
    expect(fs.existsSync(routePath)).toBe(false);
  });

  it('should use the site-specific listings API instead', async () => {
    // Import the site-specific listings route
    const { GET, POST } = require('@/app/api/sites/[siteSlug]/listings/route');

    // Verify the handlers exist
    expect(typeof GET).toBe('function');
    expect(typeof POST).toBe('function');
  });
});
```

### 2. Move Search API to Site-Specific Route

**Issue**: The search API at `/api/search/route.ts` doesn't follow the site-specific URL pattern used throughout the application.

**Files to Modify**:
- Create: `src/app/api/sites/[siteSlug]/search/route.ts`
- Remove: `src/app/api/search/route.ts`

**Changes**:
1. Create a new site-specific search route
2. Move the implementation from the old route to the new one
3. Update the implementation to use the site slug from the route parameters
4. Remove the old search route

**Current Implementation (src/app/api/search/route.ts)**:
```typescript
export const GET = withRedis(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const siteId = searchParams.get('siteId');

  // Get filter parameters
  const categoryId = searchParams.get('categoryId');
  const featuredOnly = searchParams.get('featured') === 'true';
  const status = searchParams.get('status');

  // Get pagination parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '20', 10);

  // Get sorting parameter
  const sortBy = searchParams.get('sortBy') || 'relevance';

  // Validate required parameters
  if (!siteId) {
    return NextResponse.json(
      { error: 'Missing site ID' },
      { status: 400 }
    );
  }
```

**New Implementation (src/app/api/sites/[siteSlug]/search/route.ts)**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchIndexer } from '@/lib/search';
import { withRedis } from '@/middleware/withRedis';
import { SearchResponse } from '@/lib/search/types';
import { Listing } from '@/types';
import { withSite } from '@/app/api/middleware/withSite';

export const GET = withRedis(
  withSite(async (request: NextRequest, { site }) => {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    // Get filter parameters
    const categoryId = searchParams.get('categoryId');
    const featuredOnly = searchParams.get('featured') === 'true';
    const status = searchParams.get('status');

    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '20', 10);

    // Get sorting parameter
    const sortBy = searchParams.get('sortBy') || 'relevance';

    // Site is already validated by the withSite middleware
    const siteId = site.id;
```

**Tests to Update**:
Create a new test file for the site-specific search route and update the existing search API tests:

```typescript
// File: tests/api/sites/search.test.ts

/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/sites/[siteSlug]/search/route';

// Mock the searchIndexer
jest.mock('../../../src/lib/search', () => ({
  searchIndexer: {
    searchListings: jest.fn(),
    countSearchResults: jest.fn(),
  },
}));

// Mock the withSite middleware
jest.mock('@/app/api/middleware/withSite', () => ({
  withSite: (handler) => (req) => handler(req, {
    site: {
      id: 'site1',
      slug: 'test-site',
      name: 'Test Site'
    }
  }),
}));

// Mock withRedis middleware
jest.mock('../../../src/middleware/withRedis', () => ({
  withRedis: (handler) => handler,
}));

describe('Site-Specific Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses site context from withSite middleware', async () => {
    const { searchIndexer } = require('../../../src/lib/search');

    searchIndexer.searchListings.mockResolvedValue([]);
    searchIndexer.countSearchResults.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=test');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verify that searchListings was called with the site ID from the middleware
    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1', // This comes from the mocked middleware
      'test',
      expect.any(Object)
    );
  });

  // Additional tests for search functionality
});
```

## Implementation Plan

1. **Remove Products API**:
   - Delete the `src/app/api/products/route.ts` file
   - Create the test file to verify removal

2. **Move Search API to Site-Specific Route**:
   - Create a new file at `src/app/api/sites/[siteSlug]/search/route.ts`
   - Move the implementation from `src/app/api/search/route.ts` to the new file
   - Update the implementation to use the site slug from the route parameters
   - Remove the old `src/app/api/search/route.ts` file
   - Create new tests for the site-specific search route

3. **Testing**:
   - Run the new and updated tests to verify the changes
   - Run the full test suite to ensure no regressions

## Acceptance Criteria

1. The `/api/products` route should be completely removed
2. The search API should be moved to a site-specific route at `/api/sites/[siteSlug]/search`
3. All tests should pass
4. No functionality should be lost - existing features should continue to work with the site-specific routes

## Security Considerations

These changes improve security by:
1. Removing a route that could potentially expose listings across sites
2. Enforcing site context in the search API through middleware
3. Maintaining consistent architectural principles across the codebase

## Backwards Compatibility

As specified, there is no concern for backwards compatibility. These changes are breaking changes that align the API with the architectural principles of the platform.
