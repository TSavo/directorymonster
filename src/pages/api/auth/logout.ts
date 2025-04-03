/**
 * Logout API Route
 * 
 * This API route handles user logout by revoking the user's tokens.
 * It revokes the refresh token and adds it to the blacklist.
 * 
 * Security features:
 * - Token revocation to prevent token reuse
 * - Comprehensive security logging
 * - Proper error handling with consistent error responses
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { revokeToken } from '@/lib/auth/token-validation';
import { logSecurityEvent, SecurityEventType } from '@/lib/auth/security-logger';
import { AuthError, TokenValidationError, toAuthError } from '@/lib/errors/auth-errors';
import { verifyToken } from '@/lib/auth/token-validation';

/**
 * Logout handler function
 * 
 * @param req - The Next.js API request
 * @param res - The Next.js API response
 */
async function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;

    // Validate request body
    if (!refreshToken) {
      throw new TokenValidationError('Refresh token is required');
    }

    try {
      // Verify the token to get its claims
      const decoded = await verifyToken(refreshToken);
      
      // Revoke the token
      const success = await revokeToken(
        decoded.jti as string,
        decoded.exp as number
      );

      if (success) {
        // Log successful logout
        await logSecurityEvent({
          type: SecurityEventType.LOGOUT,
          userId: decoded.userId as string,
          ip: req.socket.remoteAddress,
          userAgent: req.headers['user-agent'] as string
        });
      }
    } catch (error) {
      // If token verification fails, we still want to return success
      // This prevents information leakage about valid tokens
      console.warn('Failed to verify token during logout:', error);
    }

    // Always return success, even if token was invalid
    // This prevents information leakage about valid tokens
    return res.status(200).json({ success: true });
  } catch (error) {
    // Convert to auth error if needed
    const authError = toAuthError(error);
    
    // Return appropriate error response
    return res.status(authError.statusCode).json(authError.toJSON());
  }
}

export default logoutHandler;
