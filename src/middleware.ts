import { NextRequest, NextResponse } from 'next/server';
import { getSiteByHostname } from '@/lib/site-utils';

// Specify runtime
export const runtime = 'nodejs';

// Simple hostname mapping without database dependencies
const getBasicTenantInfo = (hostname: string) => {
  // Special case for localhost
  if (hostname.includes('localhost') || hostname === '127.0.0.1') {
    return {
      id: 'default',
      slug: 'default',
      name: 'Default'
    };
  }

  // For subdomains like hiking-gear.mydirectory.com
  const parts = hostname.split('.');
  if (parts.length > 2 && !hostname.endsWith('.localhost')) {
    const subdomain = parts[0];
    return {
      id: subdomain,
      slug: subdomain,
      name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1).replace(/-/g, ' ')
    };
  }

  // For custom domains, just use the domain name as identifier
  // The actual resolution will happen in the API or server component
  return {
    id: hostname,
    slug: hostname.replace(/\./g, '-'),
    name: hostname
  };
};

/**
 * Multi-tenant middleware for hostname detection and request handling
 * Handles:
 * - Basic tenant identification based on hostname patterns
 * - Custom domain routing
 * - Debug hostname support for testing
 * - Admin paths, API paths, and static paths
 */
export async function middleware(request: NextRequest) {
  const { pathname, hostname, searchParams } = request.nextUrl;

  // Skip for static assets, images, and favicon
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/images/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Determine path types
  const isAdminPath = pathname.startsWith('/admin');
  const isApiPath = pathname.startsWith('/api');
  const isStaticPath = pathname.includes('.');

  // Get the debug hostname from the query parameter (for testing)
  const debugHostname = searchParams.get('hostname');

  // Create a modified request URL for processing
  const requestUrl = new URL(request.url);
  const actualHostname = debugHostname || hostname;

  // Additional response headers
  const responseHeaders = new Headers();

  // If we're using a debug hostname, add it to headers for components to access
  if (debugHostname) {
    responseHeaders.set('x-debug-hostname', debugHostname);
  }

  // Always include the actual hostname for context
  responseHeaders.set('x-hostname', actualHostname);

  try {
    // Get basic tenant info (NO DATABASE ACCESS)
    const tenantInfo = getBasicTenantInfo(actualHostname);

    // Add tenant info to headers
    responseHeaders.set('x-tenant-id', tenantInfo.id);
    responseHeaders.set('x-tenant-slug', tenantInfo.slug);
    responseHeaders.set('x-tenant-name', tenantInfo.name);

    // For API paths, add tenant info to the request
    if (isApiPath) {
      const response = NextResponse.next();
      // Merge all response headers
      for (const [key, value] of responseHeaders.entries()) {
        response.headers.set(key, value);
      }
      return response;
    }

    // For admin paths, just add tenant info
    if (isAdminPath) {
      const response = NextResponse.next();
      // Merge all response headers
      for (const [key, value] of responseHeaders.entries()) {
        response.headers.set(key, value);
      }
      return response;
    }

    // Handle localhost development specially
    if (actualHostname.includes('localhost') || actualHostname === '127.0.0.1') {
      // Special case for setup path
      if (pathname === '/admin/setup') {
        const response = NextResponse.next();
        // Merge all response headers
        for (const [key, value] of responseHeaders.entries()) {
          response.headers.set(key, value);
        }
        return response;
      }

      // Let server component determine if first-time setup is needed
      const response = NextResponse.next();
      // Merge all response headers
      for (const [key, value] of responseHeaders.entries()) {
        response.headers.set(key, value);
      }
      return response;
    }

    // For listings-related paths, rewrite to the API
    if (pathname.includes('/categories/') || pathname.includes('/listings')) {
      // Get site from hostname
      const site = await getSiteByHostname(actualHostname);

      if (site) {
        // Construct the new API URL
        let newPathname = `/api/sites/${site.slug}`;

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
          // For direct listings routes, we need to get the category from the listing
          // Since we can't do that in middleware (no Redis access), we'll pass it to the API
          // and let the API handle it
          newPathname += '/listings';

          // Add listing slug if present
          const listingMatch = pathname.match(/\/listings\/([^\/]+)/);
          if (listingMatch && listingMatch[1]) {
            newPathname += `/${listingMatch[1]}`;
          }
        }

        // Create the rewrite URL
        const rewriteUrl = new URL(newPathname, request.url);

        // Copy query parameters (except site)
        for (const [key, value] of searchParams.entries()) {
          if (key !== 'site' && key !== 'hostname') {
            rewriteUrl.searchParams.set(key, value);
          }
        }

        // Rewrite the URL
        const response = NextResponse.rewrite(rewriteUrl);

        // Merge all response headers
        for (const [key, value] of responseHeaders.entries()) {
          response.headers.set(key, value);
        }

        return response;
      }
    }

    // For all other paths, just forward with tenant info headers
    const response = NextResponse.next();
    // Merge all response headers
    for (const [key, value] of responseHeaders.entries()) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error('Middleware error:', error);

    // For API paths, return a JSON error
    if (isApiPath) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'An error occurred processing the request' },
        { status: 500, headers: responseHeaders }
      );
    }

    // For other paths, continue but add error header
    const response = NextResponse.next();
    responseHeaders.set('x-tenant-error', 'true');
    // Merge all response headers
    for (const [key, value] of responseHeaders.entries()) {
      response.headers.set(key, value);
    }
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, _next paths, and files with extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};