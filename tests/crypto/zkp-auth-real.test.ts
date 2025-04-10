/**
 * ZKP Authentication Real Implementation Tests
 *
 * This file tests the ZKP authentication system using the real implementation.
 * It verifies that the system works correctly with actual circuit files.
 */

import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Import the ZKP functions
import {
  generateProof,
  verifyProof,
  generateSalt,
  generatePublicKey
} from '@/lib/zkp';

// Import bcrypt functions
import {
  hashPassword,
  verifyPassword,
  generateZKPWithBcrypt,
  verifyZKPWithBcrypt
} from '@/lib/zkp/zkp-bcrypt';

// Define test data
const testUsername = 'testuser';
const testPassword = 'P@ssw0rd123!';
const testSalt = crypto.randomBytes(16).toString('hex');

// Check if we're using mocks or real implementation
const useMocks = process.env.ZKP_USE_MOCKS === 'true';

// Skip tests if we're using mocks
const conditionalTest = useMocks ? describe.skip : describe;

conditionalTest('ZKP Authentication with Real Implementation', () => {
  // Check if circuit files exist before running tests
  beforeAll(() => {
    // Required circuit files
    const requiredFiles = [
      'circuits/zkp_auth/simple_auth_output/simple_auth_js/simple_auth.wasm',
      'circuits/zkp_auth/simple_auth_output/simple_auth_final.zkey',
      'circuits/zkp_auth/simple_auth_output/verification_key.json'
    ];

    // Check if all required files exist
    const missingFiles = requiredFiles.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return !fs.existsSync(filePath);
    });

    if (missingFiles.length > 0) {
      console.warn(`Skipping tests because circuit files are missing: ${missingFiles.join(', ')}`);
      return;
    }

    console.log('All circuit files found. Running tests with real implementation.');
  });

  describe('Basic ZKP Operations', () => {
    it('should generate a salt', () => {
      // Act
      const salt = generateSalt();

      // Assert
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
    });

    it('should hash a password with bcrypt', async () => {
      // Act
      const hashedPassword = await hashPassword(testPassword);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.startsWith('$2')).toBe(true);
    });

    it('should verify a password with bcrypt', async () => {
      // Arrange
      const hashedPassword = await hashPassword(testPassword);

      // Act
      const isValid = await verifyPassword(testPassword, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password with bcrypt', async () => {
      // Arrange
      const hashedPassword = await hashPassword(testPassword);

      // Act
      const isValid = await verifyPassword('wrong-password', hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('ZKP Proof Generation and Verification', () => {
    it('should generate a public key', async () => {
      // Act
      const publicKey = await generatePublicKey(testUsername, testPassword, testSalt);

      // Assert
      expect(publicKey).toBeDefined();
      expect(typeof publicKey).toBe('string');
      expect(publicKey.length).toBeGreaterThan(0);
    });

    it('should generate a ZKP proof with bcrypt', async () => {
      // Act
      const result = await generateZKPWithBcrypt(testUsername, testPassword, testSalt);

      // Assert
      expect(result).toBeDefined();
      expect(result.proof).toBeDefined();
      expect(result.publicSignals).toBeDefined();
      expect(Array.isArray(result.publicSignals)).toBe(true);
    });

    it('should verify a valid ZKP proof with bcrypt', async () => {
      // Arrange
      const publicKey = await generatePublicKey(testUsername, testPassword, testSalt);
      const { proof, publicSignals } = await generateZKPWithBcrypt(testUsername, testPassword, testSalt);

      // Act
      const isValid = await verifyZKPWithBcrypt(proof, publicSignals, publicKey);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject a ZKP proof with incorrect password', async () => {
      // Arrange
      const publicKey = await generatePublicKey(testUsername, testPassword, testSalt);
      const { proof, publicSignals } = await generateZKPWithBcrypt(testUsername, 'wrong-password', testSalt);

      // Act
      const isValid = await verifyZKPWithBcrypt(proof, publicSignals, publicKey);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('End-to-End Authentication Flow', () => {
    // Mock Redis client
    const mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    };

    // Mock JWT functions
    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
    };

    // Mock audit service
    const mockAuditService = {
      log: jest.fn(),
    };

    // Create a simple authentication service
    const authService = {
      /**
       * Authenticate a user with ZKP
       * @param username The username
       * @param password The password
       * @param ip The IP address
       * @returns Authentication result
       */
      async authenticate(username: string, password: string, ip: string) {
        try {
          // Get user from database (mock)
          const user = {
            id: 'test-user-id',
            username: testUsername,
            publicKey: await generatePublicKey(testUsername, testPassword, testSalt),
            salt: testSalt,
          };

          // Generate proof
          const { proof, publicSignals } = await generateZKPWithBcrypt(username, password, user.salt);

          // Verify proof
          const isValid = await verifyZKPWithBcrypt(proof, publicSignals, user.publicKey);

          if (!isValid) {
            // Log failed attempt
            mockAuditService.log({
              action: 'authentication',
              userId: user.id,
              ip,
              success: false,
              details: 'Invalid proof',
            });

            return {
              success: false,
              error: 'Invalid credentials',
            };
          }

          // Generate JWT token
          const token = mockJwt.sign({ userId: user.id }, 'secret', { expiresIn: '1h' });

          // Reset failed attempts
          mockRedisClient.del(`ip:attempts:${ip}`);
          mockRedisClient.del(`captcha:attempts:${ip}`);

          // Log successful authentication
          mockAuditService.log({
            action: 'authentication',
            userId: user.id,
            ip,
            success: true,
          });

          return {
            success: true,
            token,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return {
            success: false,
            error: 'Authentication failed',
          };
        }
      },
    };

    it('should authenticate successfully with valid credentials', async () => {
      // Act
      const result = await authService.authenticate(testUsername, testPassword, '127.0.0.1');

      // Assert
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('token');
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should reject authentication with invalid credentials', async () => {
      // Act
      const result = await authService.authenticate(testUsername, 'wrong-password', '127.0.0.1');

      // Assert
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });
});
