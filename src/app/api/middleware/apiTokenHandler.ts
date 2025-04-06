import { NextRequest, NextResponse } from 'next/server';
import { ApiTokenError } from '@/lib/errors/api-token-error';

/**
 * Middleware to handle API token errors
 * 
 * This middleware catches ApiTokenError exceptions and returns appropriate
 * HTTP 401 Unauthorized responses with meaningful error messages.
 * 
 * @param req - The incoming Next.js request
 * @param handler - The route handler function
 * @returns A NextResponse object
 */
export async function apiTokenHandler(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Call the handler and let it process the request
    return await handler(req);
  } catch (error) {
    // Check if the error is an ApiTokenError
    if (error instanceof ApiTokenError) {
      // Log the error for debugging
      console.error('API token error:', error.message);
      
      // Return a 401 Unauthorized response with the error message
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: error.message
        },
        { status: 401 }
      );
    }
    
    // Re-throw other errors to be handled by the global error handler
    throw error;
  }
}
