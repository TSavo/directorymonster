/**
 * JWT Token Expiration Async Tests
 *
 * Tests for verifying the expiration handling of JWT tokens with improved async error handling.
 */

import { verifyTokenSync } from '@/lib/auth/token-validation';
import * as jwtUtils from './jwt-test-utils';

// Mock environment variables
process.env.JWT_SECRET = jwtUtils.TEST_JWT_SECRET;
process.env.NODE_ENV = 'test';

describe('JWT Token Expiration Async', () => {
  describe('verifyAuthToken function with improved async error handling', () => {
    it('should handle tokens with very short expiration times with proper error handling', () => {
      // Arrange
      const token = jwtUtils.generateAlmostExpiredToken(1); // Expires in 1 second

      // Act
      const result = verifyTokenSync(token);

      // Assert
      expect(result).not.toBeNull();

      // Wait for the token to expire with proper error handling
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            // Act again after expiration
            const resultAfterExpiration = verifyTokenSync(token);

            // Assert
            expect(resultAfterExpiration).toBeNull();
            resolve(true);
          } catch (error) {
            reject(error);
          }
        }, 1100); // Wait slightly more than 1 second
      });
    });

    it('should handle unexpected errors during token verification in async context', () => {
      // Arrange
      const token = jwtUtils.generateAlmostExpiredToken(1); // Expires in 1 second

      // Act & Assert - Verify initial state
      expect(verifyTokenSync(token)).not.toBeNull();

      // Wait and test with proper error handling
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            // Simulate an error by passing an invalid token
            const resultWithInvalidToken = verifyTokenSync('invalid.token.format');

            // Assert
            expect(resultWithInvalidToken).toBeNull();
            resolve(true);
          } catch (error) {
            reject(error);
          }
        }, 1100);
      });
    });
  });
});
