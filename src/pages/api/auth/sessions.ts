/**
 * User Sessions API Route
 * 
 * This API route handles user session management, including:
 * - Listing active sessions for the current user
 * - Revoking specific sessions
 * - Revoking all sessions except the current one
 * 
 * Security features:
 * - Authentication required
 * - Session validation
 * - Comprehensive security logging
 * - Proper error handling with consistent error responses
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth/token-validation';
import {
  getUserSessions,
  revokeSession,
  revokeAllUserSessions
} from '@/lib/auth/session-management';
import { logSecurityEvent, SecurityEventType } from '@/lib/auth/security-logger';
import {
  AuthError,
  AuthenticationRequiredError,
  toAuthError
} from '@/lib/errors/auth-errors';

/**
 * Extract the JWT token from the authorization header
 * 
 * @param req - The Next.js API request
 * @returns The JWT token or null if not found
 */
function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.replace('Bearer ', '');
}

/**
 * Sessions handler function
 * 
 * @param req - The Next.js API request
 * @param res - The Next.js API response
 */
async function sessionsHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract and verify the token
    const token = extractToken(req);
    
    if (!token) {
      throw new AuthenticationRequiredError();
    }
    
    // Verify the token
    const decoded = await verifyToken(token);
    const userId = decoded.userId as string;
    const jti = decoded.jti as string;
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // List active sessions
        const sessions = await getUserSessions(userId, jti);
        
        return res.status(200).json({ sessions });
        
      case 'DELETE':
        // Revoke a specific session or all sessions
        const { sessionId, revokeAll } = req.body;
        
        if (revokeAll) {
          // Revoke all sessions except the current one
          const count = await revokeAllUserSessions(userId, true, jti);
          
          return res.status(200).json({
            success: true,
            message: `Revoked ${count} session(s)`,
            count
          });
        } else if (sessionId) {
          // Revoke a specific session
          if (sessionId === jti) {
            return res.status(400).json({
              error: 'Cannot revoke current session',
              message: 'Use /api/auth/logout to revoke the current session'
            });
          }
          
          const success = await revokeSession(userId, sessionId);
          
          if (success) {
            return res.status(200).json({
              success: true,
              message: 'Session revoked successfully'
            });
          } else {
            return res.status(404).json({
              error: 'Session not found',
              message: 'The specified session does not exist or has already been revoked'
            });
          }
        } else {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Either sessionId or revokeAll must be specified'
          });
        }
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    // Convert to auth error if needed
    const authError = toAuthError(error);
    
    // Return appropriate error response
    return res.status(authError.statusCode).json(authError.toJSON());
  }
}

export default sessionsHandler;
