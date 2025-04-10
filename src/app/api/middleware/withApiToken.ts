import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token-validator';
import { ApiTokenError } from '@/lib/errors/api-token-error';

/**
 * Middleware to validate API tokens
 * 
 * This middleware extracts the API token from the Authorization header or cookie,
 * validates it, and adds the user information to the request headers.
 * 
 * @param req - The incoming Next.js request
 * @param handler - The route handler function
 * @returns A NextResponse object
 * @throws ApiTokenError if the token is missing, invalid, or expired
 */
export async function withApiToken(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Extract token from Authorization header or cookie
  let token: string | null = null;
  
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  
  // If no token in Authorization header, check cookie
  if (!token) {
    const authCookie = req.cookies.get('authToken');
    if (authCookie) {
      token = authCookie.value;
    }
  }
  
  // If still no token, throw error
  if (!token) {
    throw new ApiTokenError('Missing API token');
  }
  
  // Validate the token
  const decoded = validateApiToken(token);
  
  // Add user information to request headers
  if (decoded.user) {
    req.headers.set('x-user-id', decoded.user.id);
    if (decoded.user.name) {
      req.headers.set('x-user-name', decoded.user.name);
    }
    if (decoded.user.email) {
      req.headers.set('x-user-email', decoded.user.email);
    }
    if (decoded.user.role) {
      req.headers.set('x-user-role', decoded.user.role);
    }
  }
  
  // Call the handler with the enhanced request
  return await handler(req);
}
