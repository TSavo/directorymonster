import { NextRequest, NextResponse } from 'next/server';
import { withSecureApiToken } from '@/app/api/middleware/withSecureApiToken';

/**
 * Example of a secure API endpoint that requires a valid API token
 * 
 * This endpoint demonstrates how to use the withSecureApiToken middleware
 * to protect an API endpoint and handle API token errors.
 * 
 * @param req - The incoming Next.js request
 * @returns A JSON response with the user information
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withSecureApiToken(req, async (reqWithToken) => {
    // Extract user information from request headers
    const userId = reqWithToken.headers.get('x-user-id');
    const userName = reqWithToken.headers.get('x-user-name');
    const userEmail = reqWithToken.headers.get('x-user-email');
    const userRole = reqWithToken.headers.get('x-user-role');
    
    // Return the user information
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: userName,
        email: userEmail,
        role: userRole
      }
    });
  });
}
