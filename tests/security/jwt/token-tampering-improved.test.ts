/**
 * JWT Token Tampering Tests with Improved Performance
 *
 * Tests for verifying the system's ability to detect tampered JWT tokens
 * with improved performance by avoiding the delete operator.
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

describe('JWT Token Tampering Detection with Improved Performance', () => {
  describe('verifyAuthToken function', () => {
    it('should reject a token with removed claims using undefined assignment', () => {
      // Arrange
      // Generate a valid token
      const validToken = jwtUtils.generateValidToken();

      // Decode it
      const decoded = jwt.decode(validToken) as Record<string, any>;

      // Remove a claim using undefined assignment instead of delete operator
      decoded.iat = undefined;

      // Re-encode the header and payload
      const parts = validToken.split('.');
      const header = parts[0];
      const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      // Create tampered token with original signature
      const tamperedToken = `${header}.${tamperedPayload}.${parts[2]}`;

      // Act
      const result = verifyTokenSync(tamperedToken);

      // Assert
      expect(result).toBeNull();
    });
  });
});
