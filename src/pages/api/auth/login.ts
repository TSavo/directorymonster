/**
 * Login API Route
 * 
 * This API route handles user authentication and issues JWT tokens.
 * It validates user credentials and returns access and refresh tokens.
 * 
 * Security features:
 * - Rate limiting to prevent brute force attacks
 * - Secure token generation with proper claims
 * - Comprehensive security logging
 * - Proper error handling with consistent error responses
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { generateTokenResponse } from '@/lib/auth/refresh-token';
import { withLoginRateLimit } from '@/lib/auth/rate-limiter';
import { logLoginSuccess, logLoginFailure } from '@/lib/auth/security-logger';
import { InvalidCredentialsError, AuthError, toAuthError } from '@/lib/errors/auth-errors';

// Mock user database for demonstration
// In a real application, this would be replaced with a database query
const USERS = [
  {
    id: 'user-1',
    username: 'admin',
    password: 'admin123', // In a real app, this would be hashed
    role: 'admin',
    tenantId: 'tenant-1'
  },
  {
    id: 'user-2',
    username: 'user',
    password: 'user123', // In a real app, this would be hashed
    role: 'user',
    tenantId: 'tenant-1'
  }
];

/**
 * Authenticate a user with username and password
 * 
 * @param username - The username to authenticate
 * @param password - The password to authenticate
 * @returns The authenticated user or null if authentication fails
 */
async function authenticateUser(username: string, password: string) {
  // In a real application, this would query a database and verify password hash
  const user = USERS.find(u => u.username === username && u.password === password);
  return user || null;
}

/**
 * Login handler function
 * 
 * @param req - The Next.js API request
 * @param res - The Next.js API response
 */
async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
      throw new InvalidCredentialsError('Username and password are required');
    }

    // Authenticate user
    const user = await authenticateUser(username, password);

    if (!user) {
      // Log failed login attempt
      await logLoginFailure(
        undefined,
        'Invalid credentials',
        req.socket.remoteAddress,
        req.headers['user-agent']
      );
      
      throw new InvalidCredentialsError();
    }

    // Generate tokens
    const tokenResponse = generateTokenResponse(user.id, {
      role: user.role,
      tenantId: user.tenantId
    });

    // Log successful login
    await logLoginSuccess(
      user.id,
      req.socket.remoteAddress,
      req.headers['user-agent']
    );

    // Return tokens
    return res.status(200).json(tokenResponse);
  } catch (error) {
    // Convert to auth error if needed
    const authError = toAuthError(error);
    
    // Return appropriate error response
    return res.status(authError.statusCode).json(authError.toJSON());
  }
}

// Apply rate limiting to the login handler
export default withLoginRateLimit(loginHandler);
