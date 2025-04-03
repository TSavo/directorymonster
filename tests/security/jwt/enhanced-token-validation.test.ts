/**
 * Enhanced JWT Token Validation Tests
 *
 * Tests for verifying the enhanced JWT token validation functionality.
 * Focuses on additional security checks for token tampering detection.
 */

import { verifyAuthToken } from '@/middleware/enhanced-token-validation';
import * as jwtUtils from './jwt-test-utils';
import jwt from 'jsonwebtoken';

// Mock environment variables
process.env.JWT_SECRET = jwtUtils.TEST_JWT_SECRET;
process.env.NODE_ENV = 'test';
process.env.MAX_TOKEN_LIFETIME = '86400'; // 24 hours

describe('Enhanced JWT Token Validation', () => {
  describe('verifyAuthToken function', () => {
    it('should accept a valid token with all required claims', () => {
      // Arrange
      const token = jwtUtils.generateValidToken({ userId: 'test-user-123' });

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('test-user-123');
    });

    it('should reject a token without userId claim', () => {
      // Arrange
      const token = jwtUtils.generateTokenWithMissingClaims(['userId']);

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject a token without expiration claim', () => {
      // Arrange
      const token = jwtUtils.generateTokenWithMissingClaims(['exp']);

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject a token without issued-at claim', () => {
      // Arrange
      const token = jwtUtils.generateTokenWithMissingClaims(['iat']);

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject a token with suspiciously long lifetime', () => {
      // Arrange
      // Create a token with a lifetime of 100 days (well beyond the 24-hour limit)
      const iat = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const exp = iat + (100 * 24 * 3600); // 100 days from iat
      const token = jwtUtils.generateValidToken({
        userId: 'test-user-123',
        iat,
        exp
      });

      // Act
      const result = verifyAuthToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject a token with tampered expiration time', () => {
      // Arrange
      // Create a token with an old issued-at time but a future expiration
      // This simulates a token where the expiration has been tampered with
      const iat = Math.floor(Date.now() / 1000) - (2 * 86400); // 2 days ago
      const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future

      // Create a token with these suspicious timestamps
      const token = jwtUtils.generateValidToken({
        userId: 'test-user-id',
        iat,
        exp
      });

      // Act
      const result = verifyAuthToken(token);

      // Assert
      // The enhanced validation should detect the suspicious token age
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

    it('should reject a token signed with a different algorithm', () => {
      // Arrange
      // Create a token with a different algorithm if possible
      let tamperedToken;
      try {
        // Try to create a token with HS512 algorithm
        tamperedToken = jwt.sign(
          { userId: 'test-user-123', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
          jwtUtils.TEST_JWT_SECRET,
          { algorithm: 'HS512' }
        );
      } catch (error) {
        // If HS512 is not supported, manually modify the header
        tamperedToken = jwtUtils.generateValidToken();
        const parts = tamperedToken.split('.');
        const headerJson = Buffer.from(parts[0], 'base64').toString();
        const header = JSON.parse(headerJson);
        header.alg = 'HS512';
        const tamperedHeader = jwtUtils.base64UrlEncode(JSON.stringify(header));
        tamperedToken = `${tamperedHeader}.${parts[1]}.${parts[2]}`;
      }

      // Act
      const result = verifyAuthToken(tamperedToken);

      // Assert
      expect(result).toBeNull();
    });
  });
});
