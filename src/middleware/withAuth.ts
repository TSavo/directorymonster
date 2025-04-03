import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth-service';

/**
 * Interface for authentication options
 */
interface AuthOptions {
  requiredPermission?: string;
}

/**
 * Interface for authenticated request
 */
interface AuthenticatedRequest extends NextRequest {
  auth?: {
    userId: string;
    tenantId: string;
    permissions: string[];
  };
}

/**
 * Middleware to handle JWT authentication
 * 
 * @param handler The handler function to wrap
 * @param options Authentication options
 * @returns The wrapped handler function
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, params: any) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (req: NextRequest, params: any): Promise<NextResponse> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      // Validate token
      const validationResult = await AuthService.validateToken(token);
      
      // Check if token is valid
      if (!validationResult.isValid) {
        return NextResponse.json(
          { error: validationResult.error || 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Check if required permission is specified and user has it
      if (options.requiredPermission) {
        const hasPermission = await AuthService.hasPermission(token, options.requiredPermission);
        
        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Permission denied' },
            { status: 403 }
          );
        }
      }
      
      // Add authentication info to request
      const authenticatedReq: AuthenticatedRequest = req;
      authenticatedReq.auth = {
        userId: validationResult.userId!,
        tenantId: validationResult.tenantId!,
        permissions: validationResult.permissions || []
      };
      
      // Call the handler with the authenticated request
      return handler(authenticatedReq, params);
    } catch (error) {
      console.error('Error in auth middleware:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}
