import { NextRequest, NextResponse } from 'next/server';

// Specify runtime
export const runtime = 'nodejs';

// Extract site slug from the URL path for site-specific APIs
const getSiteSlugFromPath = (pathname: string): string | null => {
  // Check for site-specific API pattern: /api/sites/[siteSlug]/...
  const siteApiMatch = pathname.match(/^\/api\/sites\/([^\/]+)\//i);
  if (siteApiMatch) {
    return siteApiMatch[1];
  }

  // Check for site-specific page pattern: /sites/[siteSlug]/...
  const sitePageMatch = pathname.match(/^\/sites\/([^\/]+)\//i);
  if (sitePageMatch) {
    return sitePageMatch[1];
  }

  return null;
};

// Simple hostname mapping without database dependencies
const getBasicTenantInfo = (hostname: string) => {
  // Normalize hostname: lowercase and remove port/protocol
  const normalizedHostname = hostname
    .toLowerCase()
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/:\d+$/, '');       // Remove port

  // Special case for localhost
  if (normalizedHostname.includes('localhost') || normalizedHostname === '127.0.0.1') {
    return {
      id: 'default',
      slug: 'default',
      name: 'Default'
    };
  }

  // For subdomains, use the entire hostname as the slug
  // This ensures each subdomain is treated as a separate site
  if (normalizedHostname.split('.').length > 2) {
    const slug = normalizedHostname.replace(/\./g, '-');
    return {
      id: normalizedHostname,
      slug: slug,
      name: normalizedHostname
    };
  }

  // For custom domains, just use the domain name as identifier
  // The actual resolution will happen in the API or server component
  return {
    id: normalizedHostname,
    slug: normalizedHostname.replace(/\./g, '-'),
    name: normalizedHostname
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

  // Create a new URL for potential rewriting
  const url = new URL(request.url);

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

  // Check if this is already a site-specific API path
  const isSiteSpecificApiPath = pathname.match(/^\/api\/sites\/([^\/]+)\//i) !== null;

  // If this is an API path but not already site-specific, we may need to rewrite it
  if (isApiPath && !isSiteSpecificApiPath && !pathname.startsWith('/api/admin')) {
    // Get the site slug from the hostname or query parameter
    const debugSiteSlug = searchParams.get('siteSlug');
    const tenantInfo = getBasicTenantInfo(debugSiteSlug || hostname);
    const siteSlug = tenantInfo.slug;

    // Skip rewriting for certain API paths that are not site-specific
    const nonSiteSpecificPaths = [
      '/api/auth',
      '/api/config',
      '/api/tenants',
      '/api/health'
    ];

    if (!nonSiteSpecificPaths.some(prefix => pathname.startsWith(prefix))) {
      // Rewrite the URL to include the site slug
      // Example: /api/search?q=test -> /api/sites/[siteSlug]/search?q=test
      const apiPath = pathname.replace('/api/', '');
      url.pathname = `/api/sites/${siteSlug}/${apiPath}`;

      // Create a new response with the rewritten URL
      const response = NextResponse.rewrite(url);

      // Add the site slug to the request headers for context
      response.headers.set('x-site-slug', siteSlug);

      return response;
    }
  }
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

  // Get the site slug from the hostname or debug parameters
  const debugSiteSlug = searchParams.get('siteSlug');
  const tenantInfo = getBasicTenantInfo(debugSiteSlug || actualHostname);
  const siteSlug = tenantInfo.slug;

  // Add the site slug to the response headers for all requests
  responseHeaders.set('x-site-slug', siteSlug);

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