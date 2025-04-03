/**
 * Enhanced JWT Token Validation
 *
 * This module provides improved JWT token validation with additional security checks:
 * 1. Rejects tokens without expiration claims
 * 2. Validates token algorithm to prevent algorithm downgrade attacks
 * 3. Implements additional checks to detect token tampering
 */

import { verify, JwtPayload } from 'jsonwebtoken';

// Secret key for JWT verification - read from environment variable at runtime
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'development-secret';
}

// Maximum allowed token lifetime in seconds (default: 24 hours)
const MAX_TOKEN_LIFETIME = parseInt(process.env.MAX_TOKEN_LIFETIME || '86400', 10);

/**
 * Verifies a JWT token with enhanced security checks
 *
 * @param token - The JWT token to verify
 * @returns The decoded token payload if valid, otherwise null
 */
export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    // Verify the token using the JWT secret with enhanced security options
    const decoded = verify(token, getJwtSecret(), {
      // Explicitly tell the library to check expiration
      ignoreExpiration: false,
      // Only accept tokens signed with the algorithm we expect
      algorithms: ['HS256']
    }) as JwtPayload;

    // Validate required claims
    if (!decoded.userId) {
      console.error('Invalid token: missing userId claim');
      return null;
    }

    // Reject tokens without expiration claim
    if (!decoded.exp) {
      console.error('Invalid token: missing expiration claim');
      return null;
    }

    // Reject tokens without issued-at claim
    if (!decoded.iat) {
      console.error('Invalid token: missing issued-at claim');
      return null;
    }

    // Check for suspiciously long token lifetime
    // This helps detect tampering with expiration time
    const tokenLifetime = decoded.exp - decoded.iat;
    if (tokenLifetime > MAX_TOKEN_LIFETIME) {
      console.error(`Invalid token: suspiciously long lifetime (${tokenLifetime}s)`);
      return null;
    }

    // Additional check for token tampering: verify the token's age
    // If the token was issued too long ago, it might be tampered
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenAge = currentTime - decoded.iat;

    // If the token is older than MAX_TOKEN_LIFETIME, reject it
    // This helps detect tokens with tampered expiration times
    if (tokenAge > MAX_TOKEN_LIFETIME) {
      console.error(`Invalid token: token is too old (${tokenAge}s)`);
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extracts and verifies a JWT token from an authorization header
 *
 * @param authHeader - The authorization header string
 * @returns The decoded token payload if valid, otherwise null
 */
export function verifyAuthHeader(authHeader: string | null): JwtPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  return verifyAuthToken(token);
}
