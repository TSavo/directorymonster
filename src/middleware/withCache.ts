import { NextRequest, NextResponse } from 'next/server';

/**
 * Cache configuration options
 */
interface CacheOptions {
  maxAge?: number;         // Browser cache in seconds
  sMaxAge?: number;        // CDN cache in seconds
  staleWhileRevalidate?: number;  // Stale-while-revalidate in seconds
  isPublic?: boolean;      // Whether cache is public or private
}

/**
 * Middleware to add caching headers to API responses
 *
 * @param handler The route handler to wrap
 * @param options Optional cache configuration options
 * @returns A wrapped handler that adds caching headers
 */
export function withCache(
  handler: (request: NextRequest, context: { params: Record<string, string | string[]> }) => Promise<NextResponse>,
  options?: CacheOptions
) {
  const {
    maxAge = 60,
    sMaxAge = 300,
    staleWhileRevalidate = 3600,
    isPublic = true
  } = options || {};

  return async (request: NextRequest, context: { params: Record<string, string | string[]> }) => {
    // Call the original handler
    const response = await handler(request, context);

    // Add caching headers
    if (response?.headers?.set) {
      // Skip caching for error responses
      if (response.status >= 400) {
        response.headers.set('Cache-Control', 'no-store');
        return response;
      }

      // Skip caching for non-GET requests
      if (request.method !== 'GET') {
        response.headers.set('Cache-Control', 'no-store');
        return response;
      }

      // Set cache control headers for endpoints
      const directive = isPublic ? 'public' : 'private';
      response.headers.set(
        'Cache-Control',
        `${directive}, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      );
    }

    return response;
  };
}
