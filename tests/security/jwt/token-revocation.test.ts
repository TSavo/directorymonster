/**
 * JWT Token Revocation Tests
 *
 * Tests for verifying the token revocation functionality.
 */

import {
  generateToken,
  verifyToken,
  revokeToken,
  isTokenRevoked,
  EnhancedJwtPayload
} from '@/lib/auth/token-validation';

// Mock the config module
jest.mock('@/lib/config', () => ({
  config: {
    security: {
      jwt: {
        secret: 'test-secret-for-validation',
        algorithm: 'HS256',
        accessTokenLifetime: 3600,
        refreshTokenLifetime: 604800
      }
    },
    redis: {
      keyPrefix: ''
    },
    isProduction: false,
    isDevelopment: true,
    isTest: false,
    env: 'test'
  }
}));
import { getRedisClient } from '@/lib/redis-client';

// Mock Redis client
jest.mock('@/lib/redis-client', () => {
  const mockRedisClient = {
    get: jest.fn(),
    setex: jest.fn(),
    exists: jest.fn()
  };

  return {
    getRedisClient: jest.fn(() => mockRedisClient)
  };
});

describe('JWT Token Revocation', () => {
  let mockRedisClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockRedisClient = getRedisClient();
  });

  describe('isTokenRevoked function', () => {
    it('should return true if token is in the revocation list', async () => {
      // Arrange
      const jti = 'test-jti-123';
      mockRedisClient.get.mockResolvedValue('1');

      // Act
      const result = await isTokenRevoked(jti);

      // Assert
      expect(result).toBe(true);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`revoked:token:${jti}`);
    });

    it('should return false if token is not in the revocation list', async () => {
      // Arrange
      const jti = 'test-jti-456';
      mockRedisClient.get.mockResolvedValue(null);

      // Act
      const result = await isTokenRevoked(jti);

      // Assert
      expect(result).toBe(false);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`revoked:token:${jti}`);
    });

    it('should return false if Redis throws an error', async () => {
      // Arrange
      const jti = 'test-jti-789';
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection error'));

      // Act
      const result = await isTokenRevoked(jti);

      // Assert
      expect(result).toBe(false);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`revoked:token:${jti}`);
    });
  });

  describe('revokeToken function', () => {
    it('should add token to revocation list with correct TTL', async () => {
      // Arrange
      const jti = 'test-jti-123';
      const currentTime = Math.floor(Date.now() / 1000);
      const exp = currentTime + 3600; // 1 hour in the future
      mockRedisClient.setex.mockResolvedValue('OK');

      // Act
      const result = await revokeToken(jti, exp);

      // Assert
      expect(result).toBe(true);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `revoked:token:${jti}`,
        expect.any(Number),
        '1'
      );

      // Verify TTL is approximately correct (allow 5 seconds of test execution time)
      const ttlArg = mockRedisClient.setex.mock.calls[0][1];
      expect(ttlArg).toBeGreaterThanOrEqual(3595);
      expect(ttlArg).toBeLessThanOrEqual(3600);
    });

    it('should handle tokens that are already expired', async () => {
      // Arrange
      const jti = 'test-jti-456';
      const currentTime = Math.floor(Date.now() / 1000);
      const exp = currentTime - 3600; // 1 hour in the past
      mockRedisClient.setex.mockResolvedValue('OK');

      // Act
      const result = await revokeToken(jti, exp);

      // Assert
      expect(result).toBe(true);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `revoked:token:${jti}`,
        0, // TTL should be 0 for expired tokens
        '1'
      );
    });

    it('should return false if Redis throws an error', async () => {
      // Arrange
      const jti = 'test-jti-789';
      const currentTime = Math.floor(Date.now() / 1000);
      const exp = currentTime + 3600;
      mockRedisClient.setex.mockRejectedValue(new Error('Redis connection error'));

      // Act
      const result = await revokeToken(jti, exp);

      // Assert
      expect(result).toBe(false);
      expect(mockRedisClient.setex).toHaveBeenCalled();
    });
  });

  describe('verifyToken function', () => {
    it('should reject revoked tokens', async () => {
      // Arrange
      // Generate a valid token
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);

      // Extract the jti from the token
      const decoded = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      ) as EnhancedJwtPayload;

      // Mock the token as revoked
      mockRedisClient.get.mockResolvedValue('1');

      // Act
      const result = await verifyToken(token);

      // Assert
      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith(`revoked:token:${decoded.jti}`);
    });

    it('should accept valid tokens that are not revoked', async () => {
      // Arrange
      const payload = { userId: 'test-user-456' };
      const token = generateToken(payload);

      // Mock the token as not revoked
      mockRedisClient.get.mockResolvedValue(null);

      // Act
      const result = await verifyToken(token);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(payload.userId);
      expect(mockRedisClient.get).toHaveBeenCalled();
    });
  });
});
