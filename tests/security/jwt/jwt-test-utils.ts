/**
 * JWT Test Utilities
 *
 * This file contains utility functions for generating JWT tokens for testing purposes.
 * These functions are used to create valid and invalid tokens for security testing.
 */

import jwt from 'jsonwebtoken';

// Test secret key - should match the one used in the application for tests
const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET || 'default-secret-for-development';

/**
 * Encode a string or buffer to Base64URL format
 *
 * @param input - The string or buffer to encode
 * @returns A Base64URL encoded string (URL-safe with no padding)
 */
export function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(typeof input === 'string' ? input : input.toString())
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a valid JWT token with the specified claims
 *
 * @param claims - The claims to include in the token
 * @param secret - The secret to use for signing (defaults to TEST_JWT_SECRET)
 * @returns A signed JWT token
 */
export function generateValidToken(
  claims: Record<string, any> = { userId: 'test-user-id' },
  secret: string = TEST_JWT_SECRET
): string {
  // Default claims that should be present in all tokens
  const defaultClaims = {
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    jti: 'test-jwt-id-' + Math.random().toString(36).substring(2, 15), // Add a JWT ID
  };

  // Merge default claims with provided claims
  const tokenClaims = { ...defaultClaims, ...claims };

  // Sign the token
  return jwt.sign(tokenClaims, secret);
}

/**
 * Generate an expired JWT token
 *
 * @param expirationOffset - Seconds in the past when the token expired (default: 60)
 * @param claims - Additional claims to include in the token
 * @param secret - The secret to use for signing
 * @returns An expired JWT token
 */
export function generateExpiredToken(
  expirationOffset: number = 60,
  claims: Record<string, any> = { userId: 'test-user-id' },
  secret: string = TEST_JWT_SECRET
): string {
  // Set expiration time in the past
  const expiredClaims = {
    ...claims,
    exp: Math.floor(Date.now() / 1000) - expirationOffset,
    iat: Math.floor(Date.now() / 1000) - expirationOffset - 3600, // Issued 1 hour before expiration
    jti: 'test-jwt-id-' + Math.random().toString(36).substring(2, 15), // Add a JWT ID
  };

  // Sign the token
  return jwt.sign(expiredClaims, secret);
}

/**
 * Generate a token that is about to expire
 *
 * @param secondsUntilExpiration - Seconds until the token expires (default: 10)
 * @param claims - Additional claims to include in the token
 * @param secret - The secret to use for signing
 * @returns A JWT token that will expire soon
 */
export function generateAlmostExpiredToken(
  secondsUntilExpiration: number = 10,
  claims: Record<string, any> = { userId: 'test-user-id' },
  secret: string = TEST_JWT_SECRET
): string {
  // Set expiration time to be very soon
  const expiringClaims = {
    ...claims,
    exp: Math.floor(Date.now() / 1000) + secondsUntilExpiration,
    iat: Math.floor(Date.now() / 1000) - 3600, // Issued 1 hour ago
    jti: 'test-jwt-id-' + Math.random().toString(36).substring(2, 15), // Add a JWT ID
  };

  // Sign the token
  return jwt.sign(expiringClaims, secret);
}

/**
 * Generate a token with missing required claims
 *
 * @param omitClaims - Array of claim names to omit
 * @param secret - The secret to use for signing
 * @returns A JWT token missing the specified claims
 */
export function generateTokenWithMissingClaims(
  omitClaims: string[] = ['userId'],
  secret: string = TEST_JWT_SECRET
): string {
  // Start with a complete set of claims
  const fullClaims: Record<string, any> = {
    userId: 'test-user-id',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    tenantId: 'test-tenant-id',
  };

  // Remove the specified claims
  const filteredClaims = { ...fullClaims };
  for (const claim of omitClaims) {
    delete filteredClaims[claim];
  }

  // For tokens without expiration or iat, we need to use a different approach
  // because jsonwebtoken automatically adds these claims
  if (omitClaims.includes('exp') || omitClaims.includes('iat')) {
    // Sign the token first
    const token = jwt.sign(filteredClaims, secret);

    // Decode it
    const decoded = jwt.decode(token) as Record<string, any>;

    // Remove the claims that should be omitted
    for (const claim of omitClaims) {
      delete decoded[claim];
    }

    // Re-encode with the claims removed
    const parts = token.split('.');
    const header = parts[0];
    const tamperedPayload = base64UrlEncode(JSON.stringify(decoded));

    // Return the token with the original signature
    return `${header}.${tamperedPayload}.${parts[2]}`;
  }

  // Sign the token normally for other cases
  return jwt.sign(filteredClaims, secret);
}

/**
 * Generate a token with an invalid signature
 *
 * @param claims - The claims to include in the token
 * @returns A JWT token with an invalid signature
 */
export function generateTokenWithInvalidSignature(
  claims: Record<string, any> = { userId: 'test-user-id' }
): string {
  // Sign the token with a different secret
  const token = generateValidToken(claims, 'wrong-secret');

  return token;
}

/**
 * Generate a tampered token by modifying a claim after signing
 *
 * @param claimToTamper - The name of the claim to tamper with
 * @param newValue - The new value for the tampered claim
 * @param preserveSignature - Whether to preserve the original signature (default: false)
 * @returns A tampered JWT token
 */
export function generateTamperedToken(
  claimToTamper: string = 'userId',
  newValue: any = 'tampered-user-id',
  preserveSignature: boolean = false
): string {
  // Generate a valid token with a very old issued-at time
  // This will help us detect tampering with the expiration time
  const iat = Math.floor(Date.now() / 1000) - (2 * 86400); // 2 days ago
  const exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago (expired)

  const token = generateValidToken({
    iat,
    exp
  });

  // Decode the token (without verification)
  const decoded = jwt.decode(token) as Record<string, any>;

  // Modify the claim
  decoded[claimToTamper] = newValue;

  if (preserveSignature) {
    // Re-encode the header and payload but keep the original signature
    // This simulates a token where the payload has been modified but the signature is still valid
    // This is a security risk that our enhanced validation should catch
    const parts = token.split('.');
    const header = parts[0];
    // Use the base64UrlEncode utility function
    const tamperedPayload = base64UrlEncode(JSON.stringify(decoded));

    // Return the tampered token with the original signature
    return `${header}.${tamperedPayload}.${parts[2]}`;
  } else {
    // Re-sign the token with the proper secret to create a valid signature
    // This simulates a properly signed token with modified claims
    return jwt.sign(decoded, TEST_JWT_SECRET, { algorithm: 'HS256' });
  }
}

/**
 * Generate a token for a specific tenant
 *
 * @param tenantId - The tenant ID to include in the token
 * @param userId - The user ID to include in the token
 * @param secret - The secret to use for signing
 * @returns A JWT token for the specified tenant
 */
export function generateTenantToken(
  tenantId: string = 'test-tenant-id',
  userId: string = 'test-user-id',
  secret: string = TEST_JWT_SECRET
): string {
  return generateValidToken({ userId, tenantId }, secret);
}

/**
 * Create an authorization header with a Bearer token
 *
 * @param token - The token to include in the header
 * @returns A string in the format "Bearer {token}"
 */
export function createAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Create a malformed authorization header
 *
 * @param malformationType - The type of malformation to create
 * @returns A malformed authorization header
 */
export function createMalformedAuthHeader(malformationType: 'missing-bearer' | 'extra-spaces' | 'empty' | 'no-token'): string {
  const token = generateValidToken();

  switch (malformationType) {
    case 'missing-bearer':
      return token;
    case 'extra-spaces':
      return `Bearer  ${token}  `;
    case 'empty':
      return '';
    case 'no-token':
      return 'Bearer ';
    default:
      throw new Error(`Unknown malformation type: ${malformationType}`);
  }
}

// Export the test secret for use in tests
export { TEST_JWT_SECRET };
