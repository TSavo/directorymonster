import { NextRequest, NextResponse } from 'next/server';

// Specify runtime
export const runtime = 'nodejs';

// Enhanced middleware that supports debug hostname via query parameter
export function middleware(request: NextRequest) {
  const { pathname, hostname, searchParams } = request.nextUrl;
  
  // Determine path types
  const isAdminPath = pathname.startsWith('/admin');
  const isApiPath = pathname.startsWith('/api');
  
  // Get the actual hostname or use debug parameter for testing
  const debugHostname = searchParams.get('hostname');
  
  // If we're using the hostname parameter, rewrite the request with the hostname
  if (debugHostname) {
    // For query parameter testing, rewrite the request URL with the desired hostname
    // console.log removed to avoid potential Edge runtime issues
    
    const response = NextResponse.next();
    // Add headers that page components can access to determine the site
    response.headers.set('x-debug-hostname', debugHostname);
    return response;
  }
  
  // Handle different scenarios
  if (isAdminPath) {
    // TODO: Add admin authentication
    return NextResponse.next();
  }
  
  if (isApiPath) {
    // TODO: Add API key validation
    return NextResponse.next();
  }
  
  // For localhost, always allow access
  if (hostname.includes('localhost')) {
    return NextResponse.next();
  }
  
  // For production hostnames, we'll handle site lookup in the page components
  // This is a simplified approach to avoid Redis in the Edge function
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, api routes starting with _ (Internal API),
     * and paths with file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};