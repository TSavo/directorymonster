import { NextRequest, NextResponse } from 'next/server';
import { withApiToken } from './withApiToken';
import { apiTokenHandler } from './apiTokenHandler';

/**
 * Middleware to securely validate API tokens with error handling
 * 
 * This middleware combines the withApiToken middleware for token validation
 * and the apiTokenHandler middleware for error handling.
 * 
 * @param req - The incoming Next.js request
 * @param handler - The route handler function
 * @returns A NextResponse object
 */
export async function withSecureApiToken(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return apiTokenHandler(req, async (reqWithErrorHandling) => {
    return withApiToken(reqWithErrorHandling, handler);
  });
}
