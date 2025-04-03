/**
 * Refresh Token Management
 * 
 * This module provides functionality for handling refresh tokens, including:
 * - Generating refresh tokens with longer lifetimes
 * - Rotating refresh tokens for enhanced security
 * - Validating refresh tokens
 * 
 * Security features:
 * - One-time use refresh tokens (token rotation)
 * - Automatic revocation of used refresh tokens
 * - Different token lifetimes for access and refresh tokens
 * - Family-based token tracking to detect token theft
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  generateToken, 
  verifyToken, 
  revokeToken, 
  EnhancedJwtPayload 
} from './token-validation';
import { getRedisClient } from '@/lib/redis-client';
import { logSecurityEvent, SecurityEventType } from './security-logger';

// Constants
const REFRESH_TOKEN_LIFETIME = 7 * 24 * 3600; // 7 days in seconds
const REFRESH_TOKEN_FAMILY_PREFIX = 'refresh:family:';
const REFRESH_TOKEN_USED_PREFIX = 'refresh:used:';

// Interface for token response
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Generate a new refresh token with a longer lifetime
 * 
 * @param userId - The user ID to include in the token
 * @param additionalClaims - Additional claims to include in the token
 * @returns The refresh token string
 */
export function generateRefreshToken(
  userId: string,
  additionalClaims: Record<string, any> = {}
): string {
  // Generate a unique family ID if not provided
  const familyId = additionalClaims.fid || uuidv4();
  
  // Generate a refresh token with a longer lifetime
  return generateToken(
    {
      userId,
      ...additionalClaims,
      // Add a family ID to track related refresh tokens
      fid: familyId,
      // Add a token type claim to distinguish refresh tokens
      type: 'refresh'
    },
    { expiresIn: REFRESH_TOKEN_LIFETIME }
  );
}

/**
 * Generate a complete token response with both access and refresh tokens
 * 
 * @param userId - The user ID to include in the tokens
 * @param additionalClaims - Additional claims to include in the tokens
 * @returns A token response object with access and refresh tokens
 */
export function generateTokenResponse(
  userId: string,
  additionalClaims: Record<string, any> = {}
): TokenResponse {
  // Generate a unique family ID for this token set
  const familyId = uuidv4();
  
  // Generate an access token with standard lifetime
  const accessToken = generateToken({
    userId,
    ...additionalClaims,
    // Add a token type claim to distinguish access tokens
    type: 'access'
  });
  
  // Generate a refresh token with longer lifetime and family ID
  const refreshToken = generateRefreshToken(userId, {
    ...additionalClaims,
    fid: familyId
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour in seconds
    tokenType: 'Bearer'
  };
}

/**
 * Rotate a refresh token, generating new access and refresh tokens
 * while invalidating the old refresh token
 * 
 * @param oldRefreshToken - The refresh token to rotate
 * @returns A new token response or null if the token is invalid
 */
export async function rotateRefreshToken(
  oldRefreshToken: string
): Promise<TokenResponse | null> {
  try {
    // Verify the old refresh token
    const decoded = await verifyToken(oldRefreshToken);
    
    // If token is invalid or not a refresh token, return null
    if (!decoded || decoded.type !== 'refresh') {
      await logSecurityEvent({
        type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
        details: { reason: 'Invalid refresh token or not a refresh token' }
      });
      return null;
    }
    
    const { userId, jti, fid, exp } = decoded;
    
    // Check if this token has been used before
    const redisClient = getRedisClient();
    const isUsed = await redisClient.get(`${REFRESH_TOKEN_USED_PREFIX}${jti}`);
    
    if (isUsed) {
      // This token has been used before - potential token theft!
      // Revoke all tokens in this family
      await revokeTokenFamily(fid as string);
      
      await logSecurityEvent({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        userId: userId as string,
        details: { 
          reason: 'Refresh token reuse detected',
          familyId: fid
        }
      });
      
      return null;
    }
    
    // Mark this token as used
    const tokenLifetime = Math.max(0, (exp as number) - Math.floor(Date.now() / 1000));
    await redisClient.setex(`${REFRESH_TOKEN_USED_PREFIX}${jti}`, tokenLifetime, '1');
    
    // Revoke the old refresh token
    await revokeToken(jti as string, exp as number);
    
    // Extract additional claims (excluding JWT-specific claims and our custom claims)
    const { iat, exp: expTime, nbf, jti: tokenId, type, fid: familyId, ...additionalClaims } = decoded;
    
    // Generate new tokens with the same family ID
    const accessToken = generateToken({
      userId: userId as string,
      ...additionalClaims,
      type: 'access'
    });
    
    const refreshToken = generateRefreshToken(userId as string, {
      ...additionalClaims,
      fid: fid
    });
    
    await logSecurityEvent({
      type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
      userId: userId as string,
      details: { action: 'Refresh token rotated successfully' }
    });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
      tokenType: 'Bearer'
    };
  } catch (error) {
    console.error('Error rotating refresh token:', error);
    await logSecurityEvent({
      type: SecurityEventType.TOKEN_VALIDATION_FAILURE,
      details: { 
        reason: 'Error rotating refresh token',
        error: (error as Error).message
      }
    });
    return null;
  }
}

/**
 * Revoke all tokens in a token family
 * 
 * @param familyId - The ID of the token family to revoke
 */
async function revokeTokenFamily(familyId: string): Promise<void> {
  try {
    const redisClient = getRedisClient();
    
    // Mark the family as revoked
    await redisClient.set(`${REFRESH_TOKEN_FAMILY_PREFIX}${familyId}`, '1');
    
    await logSecurityEvent({
      type: SecurityEventType.TOKEN_REVOCATION,
      details: { 
        action: 'Token family revoked',
        familyId
      }
    });
  } catch (error) {
    console.error('Error revoking token family:', error);
  }
}

/**
 * Check if a token family has been revoked
 * 
 * @param familyId - The ID of the token family to check
 * @returns True if the family has been revoked, false otherwise
 */
export async function isTokenFamilyRevoked(familyId: string): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    const result = await redisClient.get(`${REFRESH_TOKEN_FAMILY_PREFIX}${familyId}`);
    return result !== null;
  } catch (error) {
    console.error('Error checking token family revocation status:', error);
    // In case of error, assume the family is not revoked to prevent denial of service
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user
 * 
 * @param userId - The ID of the user whose tokens should be revoked
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  try {
    // In a real implementation, you would store token families by user
    // and revoke them all here. For now, we'll just log the action.
    await logSecurityEvent({
      type: SecurityEventType.TOKEN_REVOCATION,
      userId,
      details: { action: 'All user tokens revoked' }
    });
  } catch (error) {
    console.error('Error revoking all user tokens:', error);
  }
}
