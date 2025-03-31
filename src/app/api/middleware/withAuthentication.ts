import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';

/**
 * Middleware to validate authentication token
 * 
 * @param req The Next.js request
 * @param handler The handler function to execute if validation passes
 * @returns Response from handler or error response
 */
export async function withAuthentication(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get authentication token
    const authHeader = req.headers.get('authorization');
    
    // Validate authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.replace('Bearer ', '');
    
    // JWT Secret from environment or use default for development
    const jwtSecret = process.env.JWT_SECRET || 'development-jwt-secret';
    
    try {
      // Verify token
      const decoded = verify(token, jwtSecret) as JwtPayload;
      
      if (!decoded || !decoded.userId) {
        return NextResponse.json(
          { error: 'Invalid token', message: 'Authentication token is invalid' },
          { status: 401 }
        );
      }
      
      // Extract user ID
      const userId = decoded.userId;
      
      // If authentication is valid, proceed to the handler with the user ID
      return await handler(req, userId);
    } catch (tokenError) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Authentication token is invalid or expired' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed', 
        message: 'An error occurred during authentication' 
      },
      { status: 500 }
    );
  }
}