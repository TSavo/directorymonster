/**
 * JWT Token Validation Module
 * 
 * This module provides comprehensive JWT token validation with enhanced security features:
 * - Rejects tokens without required claims (userId, exp, iat, jti)
 * - Validates token algorithm to prevent algorithm downgrade attacks
 * - Checks for suspiciously long token lifetimes
 * - Checks for tokens that are too old (potential replay attacks)
 * - Supports token revocation via a blacklist
 */

import { verify, sign, JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '@/lib/redis-client';

// Constants
const DEFAULT_JWT_SECRET = 'default-secret-for-development';
const DEFAULT_TOKEN_LIFETIME = 3600; // 1 hour in seconds
const MAX_TOKEN_LIFETIME = 86400; // 24 hours in seconds
const REVOKED_TOKEN_PREFIX = 'revoked:token:';

// Configuration interface
export interface TokenConfig {
  secret: string;
  algorithm: string;
  expiresIn: number;
}

/**
 * Get the JWT configuration from environment variables or use defaults
 * 
 * @returns The JWT configuration object
 */
export function getTokenConfig(): TokenConfig {
  return {
    secret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || String(DEFAULT_TOKEN_LIFETIME), 10)
  };
}

/**
 * Throw an error if JWT_SECRET is not set in production
 */
if (process.env.NODE_ENV === 'production' &&
    (process.env.JWT_SECRET === undefined || process.env.JWT_SECRET === DEFAULT_JWT_SECRET)) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
}

/**
 * Extended JWT payload with our required claims
 */
export interface EnhancedJwtPayload extends JwtPayload {
  userId: string;
  jti: string;
  exp: number;
  iat: number;
}

/**
 * Generate a JWT token with enhanced security features
 * 
 * @param payload - The payload to include in the token
 * @param options - Additional signing options
 * @returns The signed JWT token
 */
export function generateToken(
  payload: Omit<EnhancedJwtPayload, 'jti' | 'iat' | 'exp'>,
  options?: Partial<SignOptions>
): string {
  const config = getTokenConfig();
  
  // Ensure required claims
  const enhancedPayload = {
    ...payload,
    jti: uuidv4(), // Add a unique identifier for revocation support
  };
  
  // Sign the token with our configuration
  return sign(enhancedPayload, config.secret, {
    algorithm: config.algorithm as any,
    expiresIn: config.expiresIn,
    ...options
  });
}

/**
 * Verify a JWT token with enhanced security checks
 * 
 * @param token - The JWT token to verify
 * @param options - Additional verification options
 * @returns The decoded token payload if valid, otherwise null
 */
export async function verifyToken(
  token: string,
  options?: Partial<VerifyOptions>
): Promise<EnhancedJwtPayload | null> {
  const config = getTokenConfig();
  
  try {
    // Verify the token using the JWT secret with enhanced security options
    const decoded = verify(token, config.secret, {
      ignoreExpiration: false,
      algorithms: [config.algorithm as any],
      ...options
    }) as EnhancedJwtPayload;
    
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
    
    // Reject tokens without jti claim
    if (!decoded.jti) {
      console.error('Invalid token: missing jti claim');
      return null;
    }
    
    // Check for suspiciously long token lifetime
    const tokenLifetime = decoded.exp - decoded.iat;
    if (tokenLifetime > MAX_TOKEN_LIFETIME) {
      console.error(`Invalid token: suspiciously long lifetime (${tokenLifetime}s)`);
      return null;
    }
    
    // Check for tokens that are too old
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenAge = currentTime - decoded.iat;
    if (tokenAge > MAX_TOKEN_LIFETIME) {
      console.error(`Invalid token: token is too old (${tokenAge}s)`);
      return null;
    }
    
    // Check if the token has been revoked
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      console.error(`Invalid token: token has been revoked (jti: ${decoded.jti})`);
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Synchronous version of verifyToken for middleware compatibility
 * This doesn't check the revocation status, so it's less secure
 * 
 * @param token - The JWT token to verify
 * @param options - Additional verification options
 * @returns The decoded token payload if valid, otherwise null
 */
export function verifyTokenSync(
  token: string,
  options?: Partial<VerifyOptions>
): EnhancedJwtPayload | null {
  const config = getTokenConfig();
  
  try {
    // Verify the token using the JWT secret with enhanced security options
    const decoded = verify(token, config.secret, {
      ignoreExpiration: false,
      algorithms: [config.algorithm as any],
      ...options
    }) as EnhancedJwtPayload;
    
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
    
    // Reject tokens without jti claim
    if (!decoded.jti) {
      console.error('Invalid token: missing jti claim');
      return null;
    }
    
    // Check for suspiciously long token lifetime
    const tokenLifetime = decoded.exp - decoded.iat;
    if (tokenLifetime > MAX_TOKEN_LIFETIME) {
      console.error(`Invalid token: suspiciously long lifetime (${tokenLifetime}s)`);
      return null;
    }
    
    // Check for tokens that are too old
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenAge = currentTime - decoded.iat;
    if (tokenAge > MAX_TOKEN_LIFETIME) {
      console.error(`Invalid token: token is too old (${tokenAge}s)`);
      return null;
    }
    
    // Note: This function doesn't check if the token has been revoked
    // Use verifyToken for full security checks
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Check if a token has been revoked
 * 
 * @param jti - The JWT ID to check
 * @returns True if the token has been revoked, false otherwise
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    const result = await redisClient.get(`${REVOKED_TOKEN_PREFIX}${jti}`);
    return result !== null;
  } catch (error) {
    console.error('Error checking token revocation status:', error);
    // In case of error, assume the token is valid to prevent denial of service
    return false;
  }
}

/**
 * Revoke a token by adding it to the blacklist
 * 
 * @param jti - The JWT ID to revoke
 * @param exp - The expiration time of the token (in seconds since epoch)
 * @returns True if the token was successfully revoked, false otherwise
 */
export async function revokeToken(jti: string, exp: number): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Calculate TTL (time to live) for the revocation record
    // We only need to keep the record until the token expires
    const ttl = Math.max(0, exp - currentTime);
    
    // Store the revocation record with the calculated TTL
    await redisClient.setex(`${REVOKED_TOKEN_PREFIX}${jti}`, ttl, '1');
    return true;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
}

/**
 * Extract and verify a JWT token from an authorization header
 * 
 * @param authHeader - The authorization header string
 * @returns The decoded token payload if valid, otherwise null
 */
export async function verifyAuthHeader(authHeader: string | null): Promise<EnhancedJwtPayload | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  return verifyToken(token);
}

/**
 * Synchronous version of verifyAuthHeader for middleware compatibility
 * 
 * @param authHeader - The authorization header string
 * @returns The decoded token payload if valid, otherwise null
 */
export function verifyAuthHeaderSync(authHeader: string | null): EnhancedJwtPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  return verifyTokenSync(token);
}
