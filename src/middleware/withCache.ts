import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to add caching headers to API responses
 *
 * @param handler The route handler to wrap
 * @returns A wrapped handler that adds caching headers
 */
export function withCache(handler: Function) {
  return async (request: NextRequest, context: any) => {
    // Call the original handler
    const response = await handler(request, context);

    // Add caching headers
    if (response && response.headers && typeof response.headers.set === 'function') {
      // Set cache control headers for public endpoints
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
    }

    return response;
  };
}
