/**
 * JWT Token Validation Tests
 *
 * Tests for verifying the basic functionality of JWT token validation.
 * Focuses on token format, required claims, and signature verification.
 */

import { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/middleware/withPermission';
import * as jwtUtils from './jwt-test-utils';

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

// Mock environment variables
process.env.JWT_SECRET = jwtUtils.TEST_JWT_SECRET;
process.env.NODE_ENV = 'test';

describe('JWT Token Validation', () => {

  describe('verifyAuthToken function', () => {

    it('should successfully validate a token with all required claims', () => {
      // Arrange
      const token = jwtUtils.generateValidToken({ userId: 'test-user-123' });

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('test-user-123');
    });

    it('should reject a token with missing userId claim', () => {
      // Arrange
      const token = jwtUtils.generateTokenWithMissingClaims(['userId']);

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject a token with invalid signature', () => {
      // Arrange
      const token = jwtUtils.generateTokenWithInvalidSignature();

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should accept tokens with additional non-required claims', () => {
      // Arrange
      const token = jwtUtils.generateValidToken({
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'admin',
        customClaim: 'custom-value'
      });

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('test-user-123');
      expect(result?.email).toBe('test@example.com');
      expect(result?.role).toBe('admin');
      expect(result?.customClaim).toBe('custom-value');
    });

    it('should reject malformed tokens', () => {
      // Arrange
      const malformedToken = 'not.a.valid.jwt.token';

      // Act
      const result = verifyAuthToken(malformedToken);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject tokens with missing segments', () => {
      // Arrange
      const token = jwtUtils.generateValidToken();
      const missingSegmentToken = token.split('.').slice(0, 2).join('.');

      // Act
      const result = verifyAuthToken(missingSegmentToken);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Authorization header extraction', () => {
    // These tests will be implemented in the tenant-token.test.ts file
    // as they relate to the middleware that extracts tokens from headers
  });
});
