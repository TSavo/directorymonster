/**
 * JWT Token Tampering Tests
 *
 * Tests for verifying the system's ability to detect tampered JWT tokens.
 * Focuses on modifications to the payload, signature, and structure.
 */

import { verifyTokenSync } from '@/lib/auth/token-validation';

// Mock the config to provide a default secret for tests
jest.mock('@/lib/config', () => ({
  config: {
    security: {
      jwt: {
        secret: 'test-secret-for-testing',
        algorithm: 'HS256',
        accessTokenLifetime: 3600,
        refreshTokenLifetime: 86400
      }
    },
    redis: {
      keyPrefix: ''
    },
    isProduction: false
  }
}));
import * as jwtUtils from './jwt-test-utils';
import jwt from 'jsonwebtoken';

// Mock environment variables
process.env.JWT_SECRET = jwtUtils.TEST_JWT_SECRET;
process.env.NODE_ENV = 'test';

describe('JWT Token Tampering Detection', () => {

  describe('verifyTokenSync function', () => {

    it('should reject a token with modified payload but original signature', () => {
      // Arrange
      const token = jwtUtils.generateTamperedToken('userId', 'hacker-user-id', true);

      // Act
      const result = verifyTokenSync(token);

      // Assert
      // Our security enhancements successfully detect tampering with the payload
      // even if the original signature is preserved. This is good!
      expect(result).toBeNull();
    });

    it('should handle a token with modified expiration time and preserved signature', () => {
      // Arrange
      // Generate a token that has expired
      const expiredToken = jwtUtils.generateExpiredToken(3600); // Expired 1 hour ago

      // Tamper with the expiration time to make it valid again, but with preserved signature
      const tamperedToken = jwtUtils.generateTamperedToken('exp', Math.floor(Date.now() / 1000) + 3600, true);

      // Act
      const result = verifyTokenSync(tamperedToken);

      // Assert
      // Note: The enhanced implementation now detects tampering with the expiration time
      // even if the signature is preserved. This security issue has been fixed.
      // This test now verifies the fixed behavior.
      expect(result).toBeNull();
    });

    it('should reject a token with modified expiration time even with valid signature', () => {
      // Arrange
      // Generate a token with a valid signature but modified expiration time
      const tamperedToken = jwtUtils.generateTamperedToken('exp', Math.floor(Date.now() / 1000) + 3600, false);

      // Act
      const result = verifyTokenSync(tamperedToken);

      // Assert
      // The enhanced implementation rejects tokens with tampered expiration time
      // even if they have a valid signature
      expect(result).toBeNull();
    });

    it('should reject a token with removed claims', () => {
      // Arrange
      // Generate a valid token
      const validToken = jwtUtils.generateValidToken();

      // Decode it
      const decoded = jwt.decode(validToken) as Record<string, any>;

      // Remove a claim using undefined assignment for better performance
      decoded.iat = undefined;

      // Re-encode the header and payload
      const parts = validToken.split('.');
      const header = parts[0];
      // Use the base64UrlEncode utility function
      const tamperedPayload = jwtUtils.base64UrlEncode(JSON.stringify(decoded));

      // Create tampered token with original signature
      const tamperedToken = `${header}.${tamperedPayload}.${parts[2]}`;

      // Act
      const result = verifyTokenSync(tamperedToken);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject a token with modified header', () => {
      // Arrange
      // Generate a valid token
      const validToken = jwtUtils.generateValidToken();

      // Decode the header
      const parts = validToken.split('.');
      const headerJson = Buffer.from(parts[0], 'base64').toString();
      const header = JSON.parse(headerJson);

      // Modify the algorithm
      header.alg = 'none';

      // Re-encode the header
      // Use the base64UrlEncode utility function
      const tamperedHeader = jwtUtils.base64UrlEncode(JSON.stringify(header));

      // Create tampered token
      const tamperedToken = `${tamperedHeader}.${parts[1]}.${parts[2]}`;

      // Act
      const result = verifyTokenSync(tamperedToken);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle tokens signed with different algorithms', () => {
      // Arrange
      // Note: This test assumes the system uses HS256 by default

      // Create a token with a different algorithm if possible
      let tamperedToken;
      try {
        // Try to create a token with HS512 algorithm
        tamperedToken = jwt.sign(
          { userId: 'test-user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
          jwtUtils.TEST_JWT_SECRET,
          { algorithm: 'HS512' }
        );
      } catch (error) {
        // If HS512 is not supported, use the default algorithm
        tamperedToken = jwtUtils.generateValidToken();

        // Manually modify the header to claim it uses a different algorithm
        const parts = tamperedToken.split('.');
        const headerJson = Buffer.from(parts[0], 'base64').toString();
        const header = JSON.parse(headerJson);
        header.alg = 'HS512';

        // Re-encode the header
        // Use the base64UrlEncode utility function
        const tamperedHeader = jwtUtils.base64UrlEncode(JSON.stringify(header));

        tamperedToken = `${tamperedHeader}.${parts[1]}.${parts[2]}`;
      }

      // Act
      const result = verifyTokenSync(tamperedToken);

      // Assert - With our security enhancements, tokens signed with different algorithms
      // should be rejected because we explicitly specify which algorithms are acceptable
      // However, this depends on the exact implementation of the jsonwebtoken library
      // and how it handles algorithm verification
      // This test documents the current behavior
      expect(result).toBeNull();
    });
  });
});
