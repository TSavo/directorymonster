# URL Resolution

DirectoryMonster uses a sophisticated URL resolution system to provide flexibility in how users access resources while maintaining a clean, RESTful API structure internally.

## Overview

The URL resolution system allows the same resource to be accessed through multiple URL patterns, which are all rewritten to a canonical API endpoint by the edge middleware.

This provides several benefits:
- Flexibility for end users
- SEO-friendly URLs
- Consistent internal API structure
- Support for multiple site identification methods

## URL Patterns

### Domain-Based Access

Users can access resources using a custom domain:

```http
https://example.com/categories/category-name/listings
https://example.com/listings
```

In this case, the site is identified by the domain (`example.com`).

### Subdomain-Based Access

Users can access resources using a subdomain:

```http
https://site-name.example.com/categories/category-name/listings
https://site-name.example.com/listings
```

In this case, the site is identified by the subdomain (`site-name`).

### Path-Based Access

Users can access resources using a path segment:

```http
/site/site-name/categories/category-name/listings
/site/site-name/listings
```

In this case, the site is identified by the path segment (`site-name`).

### Query Parameter-Based Access

Users can access resources using a query parameter:

```http
/categories/category-name/listings?site=site-name
/listings?site=site-name
```

In this case, the site is identified by the query parameter (`site=site-name`).

## Resolution Process

The URL resolution process follows these steps:

1. **Site Identification**:
   - Check if the request is for a custom domain
   - Check if the request is for a subdomain
   - Check if the request includes a site path segment
   - Check if the request includes a site query parameter

2. **URL Rewriting**:
   - Once the site is identified, rewrite the URL to the canonical API endpoint
   - For example, `/site/site-name/categories/category-name/listings` becomes `/api/sites/site-name/categories/category-name/listings`

3. **Request Handling**:
   - The rewritten request is handled by the appropriate API endpoint
   - The response is returned to the user

## Implementation

The URL resolution is implemented in the edge middleware:

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Get site from hostname, path, or query parameter
  const site = await getSiteFromRequest(request);

  if (site && (pathname.includes('/categories/') || pathname.includes('/listings'))) {
    // Rewrite to the canonical API endpoint
    const newPathname = constructApiPath(site, pathname);
    const rewriteUrl = new URL(newPathname, request.url);

    // Copy query parameters
    copyQueryParameters(url, rewriteUrl);

    // Rewrite the URL
    return NextResponse.rewrite(rewriteUrl);
  }

  // For other paths, continue
  return NextResponse.next();
}
```

## Site Resolution Utility

The `getSiteByHostname` utility in `src/lib/site-utils.ts` is used to resolve a site from a hostname:

```typescript
export async function getSiteByHostname(hostname: string): Promise<SiteConfig | null> {
  // Check for direct domain match
  const site = await kv.get<SiteConfig>(`site:domain:${hostname}`);
  if (site) return site;

  // Check for subdomain match
  const domainParts = hostname.split('.');
  if (domainParts.length > 1) {
    const subdomain = domainParts[0];
    const site = await kv.get<SiteConfig>(`site:slug:${subdomain}`);
    if (site) return site;
  }

  // Check for localhost development
  if (hostname.includes('localhost')) {
    // Return default site for development
    return await kv.get<SiteConfig>('site:default');
  }

  return null;
}
```

## Testing

The URL resolution system is tested extensively to ensure all patterns work correctly:

```typescript
describe('URL Resolution', () => {
  it('should resolve site from domain', async () => {
    const request = new NextRequest(
      new URL('http://example.com/categories/test-category/listings')
    );

    const response = await middleware(request);

    expect(response.headers.get('x-middleware-rewrite'))
      .toBe('http://example.com/api/sites/example/categories/test-category/listings');
  });

  // Tests for other patterns...
});
```

## Considerations

When working with the URL resolution system, keep these considerations in mind:

1. **Performance**: The resolution process adds some overhead, so caching is important
2. **SEO**: Use canonical URLs in your site to help search engines understand the preferred URL
3. **Redirects**: Consider redirecting users to a canonical URL format for consistency
4. **Testing**: Test all URL patterns to ensure they work correctly
