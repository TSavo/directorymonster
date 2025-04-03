import { NextRequest, NextResponse } from 'next/server';
import { getSiteByHostname } from '@/lib/site-utils';

/**
 * Middleware to resolve site slug from various sources and rewrite the URL
 *
 * @param request The incoming request
 * @returns A response with the URL rewritten to include the site slug
 */
export async function resolveSiteMiddleware(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Skip if this is already an API route
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if this is a listings-related route
  if (!pathname.includes('/categories/') && !pathname.includes('/listings')) {
    return NextResponse.next();
  }

  let siteSlug: string | null = null;

  // Try to get site from hostname using existing utility
  const host = request.headers.get('host') || '';
  const site = await getSiteByHostname(host);

  if (site) {
    siteSlug = site.slug;
  } else {
    // Fallback to query parameter if site not found by hostname
    siteSlug = url.searchParams.get('site');

    // Remove the site parameter from the URL
    if (siteSlug) {
      url.searchParams.delete('site');
    } else {
      // Fallback to path parameter if site not found in query
      const pathParts = pathname.split('/');
      const siteIndex = pathParts.indexOf('site');
      if (siteIndex !== -1 && siteIndex < pathParts.length - 1) {
        siteSlug = pathParts[siteIndex + 1];

        // Remove the site part from the path
        pathParts.splice(siteIndex, 2);
        const newPathname = pathParts.join('/');
        url.pathname = newPathname || '/';
      }
    }
  }

  // If we found a site slug, rewrite the URL
  if (siteSlug) {
    // Construct the new API URL
    let newPathname = `/api/sites/${siteSlug}`;

    // Add the rest of the path
    if (pathname.includes('/categories/')) {
      // Extract the category slug
      const categoryMatch = pathname.match(/\/categories\/([^\/]+)/);
      if (categoryMatch && categoryMatch[1]) {
        const categorySlug = categoryMatch[1];
        newPathname += `/categories/${categorySlug}`;

        // Add listings if present
        if (pathname.includes('/listings')) {
          newPathname += '/listings';

          // Add listing slug if present
          const listingMatch = pathname.match(/\/listings\/([^\/]+)/);
          if (listingMatch && listingMatch[1]) {
            newPathname += `/${listingMatch[1]}`;
          }
        }
      }
    } else if (pathname.includes('/listings')) {
      // Handle direct listings routes
      newPathname += '/categories/all/listings';

      // Add listing slug if present
      const listingMatch = pathname.match(/\/listings\/([^\/]+)/);
      if (listingMatch && listingMatch[1]) {
        newPathname += `/${listingMatch[1]}`;
      }
    }

    // Set the new pathname
    url.pathname = newPathname;

    // Rewrite the URL
    return NextResponse.rewrite(url);
  }

  // If we couldn't resolve a site, just continue
  return NextResponse.next();
}
