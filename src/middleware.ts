import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/tenant';

// Specify runtime
export const runtime = 'nodejs';

/**
 * Multi-tenant middleware for hostname detection and request handling
 * Handles:
 * - Tenant identification based on hostname
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
    // Get the tenant for the hostname
    const tenant = await TenantService.getTenantByHostname(actualHostname);
    
    // If a tenant is found, add tenant info to headers
    if (tenant) {
      responseHeaders.set('x-tenant-id', tenant.id);
      responseHeaders.set('x-tenant-slug', tenant.slug);
      responseHeaders.set('x-tenant-name', tenant.name);
      
      // For API paths, add tenant info to the request
      if (isApiPath) {
        const response = NextResponse.next();
        response.headers.set('x-tenant-id', tenant.id);
        response.headers.set('x-tenant-slug', tenant.slug);
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
      
      // For other paths, continue with tenant info
      const response = NextResponse.next();
      // Merge all response headers
      for (const [key, value] of responseHeaders.entries()) {
        response.headers.set(key, value);
      }
      return response;
    } else {
      // Handle localhost development and no tenant found
      if (actualHostname.includes('localhost') || actualHostname === '127.0.0.1') {
        // For development, check if we need to create a default tenant
        if (process.env.NODE_ENV !== 'production' && !(await TenantService.tenantsExist())) {
          // Create default tenant for development
          try {
            await TenantService.createDefaultTenant();
            console.log('Created default tenant for development');
          } catch (error) {
            console.error('Error creating default tenant:', error);
          }
          
          // Forward the request
          const response = NextResponse.next();
          responseHeaders.set('x-tenant-created', 'true');
          // Merge all response headers
          for (const [key, value] of responseHeaders.entries()) {
            response.headers.set(key, value);
          }
          return response;
        }
        
        // For localhost without tenant in dev, redirect to setup
        if (process.env.NODE_ENV !== 'production') {
          // Redirect to first-time setup if no tenant exists
          if (pathname !== '/admin/setup') {
            return NextResponse.redirect(new URL('/admin/setup', request.url));
          }
          return NextResponse.next();
        }
      }
      
      // No tenant found, return 404 for non-admin paths
      if (!isAdminPath && !isApiPath && !isStaticPath) {
        return NextResponse.next({
          status: 404,
          statusText: 'Not Found',
          headers: responseHeaders,
        });
      }
      
      // Let admin and API paths proceed
      const response = NextResponse.next();
      // Merge all response headers
      for (const [key, value] of responseHeaders.entries()) {
        response.headers.set(key, value);
      }
      return response;
    }
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