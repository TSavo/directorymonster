/**
 * Token Refresh API Route
 * 
 * This API route handles refreshing access tokens using refresh tokens.
 * It validates the refresh token and issues new access and refresh tokens.
 * 
 * Security features:
 * - Rate limiting to prevent abuse
 * - Refresh token rotation for enhanced security
 * - Token family tracking to detect token theft
 * - Comprehensive security logging
 * - Proper error handling with consistent error responses
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { rotateRefreshToken } from '@/lib/auth/refresh-token';
import { withRefreshRateLimit } from '@/lib/auth/rate-limiter';
import { logSecurityEvent, SecurityEventType } from '@/lib/auth/security-logger';
import { AuthError, TokenValidationError, toAuthError } from '@/lib/errors/auth-errors';

/**
 * Token refresh handler function
 * 
 * @param req - The Next.js API request
 * @param res - The Next.js API response
 */
async function refreshHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;

    // Validate request body
    if (!refreshToken) {
      throw new TokenValidationError('Refresh token is required');
    }

    // Rotate the refresh token
    const tokenResponse = await rotateRefreshToken(refreshToken);

    if (!tokenResponse) {
      // Log token validation failure
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
        details: { reason: 'Invalid refresh token' }
      });
      
      throw new TokenValidationError('Invalid refresh token');
    }

    // Log successful token refresh
    await logSecurityEvent({
      type: SecurityEventType.TOKEN_REFRESH_SUCCESS,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string
    });

    // Return new tokens
    return res.status(200).json(tokenResponse);
  } catch (error) {
    // Convert to auth error if needed
    const authError = toAuthError(error);
    
    // Return appropriate error response
    return res.status(authError.statusCode).json(authError.toJSON());
  }
}

// Apply rate limiting to the refresh handler
export default withRefreshRateLimit(refreshHandler);
