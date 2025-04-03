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
import { config } from '@/lib/config';
import {
  AuthError,
  TokenValidationError,
  TokenExpiredError,
  TokenRevokedError,
  toAuthError
} from '@/lib/errors/auth-errors';
import { logSecurityEvent, SecurityEventType } from './security-logger';

// Constants
const REVOKED_TOKEN_PREFIX = `${config.redis.keyPrefix}revoked:token:`;
const MAX_TOKEN_LIFETIME = config.security.jwt.refreshTokenLifetime; // Maximum token lifetime

// Configuration interface
export interface TokenConfig {
  // Secret key for symmetric algorithms (HS256, HS384, HS512)
  secret?: string;
  // Private key for asymmetric algorithms (RS256, RS384, RS512, ES256, ES384, ES512)
  privateKey?: string;
  // Public key for asymmetric algorithms
  publicKey?: string;
  // Algorithm to use for signing and verification
  algorithm: string;
  // Token expiration time in seconds
  expiresIn: number;
}

/**
 * Get the JWT configuration from the configuration service
 *
 * @returns The JWT configuration object
 */
export function getTokenConfig(): TokenConfig {
  const { algorithm, accessTokenLifetime } = config.security.jwt;

  // For asymmetric algorithms (RS*, ES*), we need private and public keys
  if (algorithm.startsWith('RS') || algorithm.startsWith('ES')) {
    const { privateKey, publicKey } = config.security.jwt;

    // Validate keys in production
    if (config.isProduction && (!privateKey || !publicKey)) {
      throw new Error(`FATAL: JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set for ${algorithm} algorithm in production.`);
    }

    return {
      privateKey,
      publicKey,
      algorithm,
      expiresIn: accessTokenLifetime
    };
  }

  // For symmetric algorithms (HS*)
  const { secret } = config.security.jwt;

  // Validate secret in production
  if (config.isProduction && !secret) {
    throw new Error(`FATAL: JWT_SECRET must be set for ${algorithm} algorithm in production.`);
  }

  return {
    secret,
    algorithm,
    expiresIn: accessTokenLifetime
  };
}

// Configuration validation is now handled in the getTokenConfig function

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

  // Get the appropriate key for signing based on the algorithm
  const signingKey = getSigningKey(config);

  // Sign the token with our configuration
  return sign(enhancedPayload, signingKey, {
    algorithm: config.algorithm as any,
    expiresIn: config.expiresIn,
    ...options
  });
}

/**
 * Get the appropriate key for signing tokens based on the algorithm
 *
 * @param config - The token configuration
 * @returns The key to use for signing
 */
function getSigningKey(config: TokenConfig): string {
  // For asymmetric algorithms, use the private key
  if (config.algorithm.startsWith('RS') || config.algorithm.startsWith('ES')) {
    if (!config.privateKey) {
      throw new Error(`Private key is required for ${config.algorithm} algorithm`);
    }
    return config.privateKey;
  }

  // For symmetric algorithms, use the secret
  if (!config.secret) {
    throw new Error(`Secret is required for ${config.algorithm} algorithm`);
  }
  return config.secret;
}

/**
 * Get the appropriate key for verifying tokens based on the algorithm
 *
 * @param config - The token configuration
 * @returns The key to use for verification
 */
function getVerificationKey(config: TokenConfig): string {
  // For asymmetric algorithms, use the public key
  if (config.algorithm.startsWith('RS') || config.algorithm.startsWith('ES')) {
    if (!config.publicKey) {
      throw new Error(`Public key is required for ${config.algorithm} algorithm`);
    }
    return config.publicKey;
  }

  // For symmetric algorithms, use the secret
  if (!config.secret) {
    throw new Error(`Secret is required for ${config.algorithm} algorithm`);
  }
  return config.secret;
}

/**
 * Verify a JWT token with enhanced security checks
 *
 * @param token - The JWT token to verify
 * @param options - Additional verification options
 * @returns The decoded token payload if valid
 * @throws {TokenValidationError} If the token is invalid
 * @throws {TokenExpiredError} If the token has expired
 * @throws {TokenRevokedError} If the token has been revoked
 */
export async function verifyToken(
  token: string,
  options?: Partial<VerifyOptions>
): Promise<EnhancedJwtPayload> {
  const tokenConfig = getTokenConfig();

  try {
    // Get the appropriate key for verification based on the algorithm
    const verificationKey = getVerificationKey(tokenConfig);

    // Verify the token with enhanced security options
    const decoded = verify(token, verificationKey, {
      ignoreExpiration: false,
      algorithms: [tokenConfig.algorithm as any],
      ...options
    }) as EnhancedJwtPayload;

    // Validate required claims
    if (!decoded.userId) {
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        details: { reason: 'Missing userId claim' }
      });
      throw new TokenValidationError('Invalid token: missing userId claim');
    }

    // Reject tokens without expiration claim
    if (!decoded.exp) {
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        userId: decoded.userId as string,
        details: { reason: 'Missing expiration claim' }
      });
      throw new TokenValidationError('Invalid token: missing expiration claim');
    }

    // Reject tokens without issued-at claim
    if (!decoded.iat) {
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        userId: decoded.userId as string,
        details: { reason: 'Missing issued-at claim' }
      });
      throw new TokenValidationError('Invalid token: missing issued-at claim');
    }

    // Reject tokens without jti claim
    if (!decoded.jti) {
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        userId: decoded.userId as string,
        details: { reason: 'Missing jti claim' }
      });
      throw new TokenValidationError('Invalid token: missing jti claim');
    }

    // Check for suspiciously long token lifetime
    const tokenLifetime = decoded.exp - decoded.iat;
    if (tokenLifetime > MAX_TOKEN_LIFETIME) {
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        userId: decoded.userId as string,
        details: { reason: 'Suspiciously long lifetime', tokenLifetime }
      });
      throw new TokenValidationError(
        `Invalid token: suspiciously long lifetime (${tokenLifetime}s)`,
        { tokenLifetime }
      );
    }

    // Check for tokens that are too old
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenAge = currentTime - decoded.iat;
    if (tokenAge > MAX_TOKEN_LIFETIME) {
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        userId: decoded.userId as string,
        details: { reason: 'Token too old', tokenAge }
      });
      throw new TokenValidationError(
        `Invalid token: token is too old (${tokenAge}s)`,
        { tokenAge }
      );
    }

    // Check if the token has been revoked
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        userId: decoded.userId as string,
        details: { reason: 'Token revoked', jti: decoded.jti }
      });
      throw new TokenRevokedError(
        `Token has been revoked`,
        decoded.jti as string
      );
    }

    // Log successful token validation
    await logSecurityEvent({
      type: SecurityEventType.TOKEN_VALIDATION_SUCCESS,
      userId: decoded.userId as string
    });

    return decoded;
  } catch (error) {
    // Convert error to appropriate auth error type
    const authError = toAuthError(error);

    // Log the error
    await logSecurityEvent({
      type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
      details: {
        error: authError.message,
        errorType: authError.type
      }
    });

    // Re-throw the error
    throw authError;
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
    // Get the appropriate key for verification based on the algorithm
    const verificationKey = getVerificationKey(config);

    // Verify the token with enhanced security options
    const decoded = verify(token, verificationKey, {
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

    // Log successful token validation (synchronously)
    console.info('Token validation successful', {
      userId: decoded.userId,
      type: SecurityEventType.TOKEN_VALIDATION_SUCCESS
    });

    return decoded;
  } catch (error) {
    // Convert error to appropriate auth error type
    const authError = toAuthError(error);

    // Log the error (synchronously)
    console.error('Token verification failed:', {
      error: authError.message,
      type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
      errorType: authError.type
    });

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
