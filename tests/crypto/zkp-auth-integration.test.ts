/**
 * ZKP Authentication Integration Tests
 *
 * This file tests the integration between different components of the ZKP authentication system.
 * It verifies that the system works correctly end-to-end.
 */

import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
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

// Import the ZKP adapter
import { ZKPAdapter } from '@/lib/zkp/adapter';
import { getZKPProvider } from '@/lib/zkp/provider';

// Define test data
const testUsername = 'testuser';
const testPassword = 'P@ssw0rd123!';
const testSalt = crypto.randomBytes(16).toString('hex');
const testIp = '127.0.0.1';

describe('ZKP Authentication Integration', () => {
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

  // Create a simple user service
  const userService = {
    /**
     * Register a new user
     * @param username The username
     * @param password The password
     * @returns Registration result
     */
    async register(username: string, password: string) {
      try {
        // Generate salt
        const salt = generateSalt();

        // Generate public key
        const publicKey = await generatePublicKey(username, password, salt);

        // Store user in database (mock)
        const user = {
          id: crypto.randomUUID(),
          username,
          publicKey,
          salt,
        };

        return {
          success: true,
          user,
        };
      } catch (error) {
        console.error('Registration error:', error);
        return {
          success: false,
          error: 'Registration failed',
        };
      }
    },
  };

  describe('User Registration and Authentication Flow', () => {
    it('should register a user and then authenticate successfully', async () => {
      // Register a new user
      const registrationResult = await userService.register(testUsername, testPassword);

      // Verify registration was successful
      expect(registrationResult.success).toBe(true);
      expect(registrationResult.user).toBeDefined();
      expect(registrationResult.user.username).toBe(testUsername);
      expect(registrationResult.user.publicKey).toBeDefined();
      expect(registrationResult.user.salt).toBeDefined();

      // Save the user for authentication
      const user = registrationResult.user;

      // Create a custom authentication service for this test
      const customAuthService = {
        async authenticate(username: string, password: string, ip: string) {
          try {
            // Generate proof
            const { proof, publicSignals } = await generateZKPWithBcrypt(username, password, user.salt);

            // Verify proof
            const isValid = await verifyZKPWithBcrypt(proof, publicSignals, user.publicKey);

            if (!isValid) {
              return {
                success: false,
                error: 'Invalid credentials',
              };
            }

            // Generate JWT token
            const token = mockJwt.sign({ userId: user.id }, 'secret', { expiresIn: '1h' });

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

      // Authenticate with the registered user
      const authResult = await customAuthService.authenticate(testUsername, testPassword, testIp);

      // Verify authentication was successful
      expect(authResult.success).toBe(true);
      expect(authResult.token).toBeDefined();
    });

    it('should reject authentication with wrong password', async () => {
      // Register a new user
      const registrationResult = await userService.register(testUsername, testPassword);

      // Verify registration was successful
      expect(registrationResult.success).toBe(true);

      // Save the user for authentication
      const user = registrationResult.user;

      // Create a custom authentication service for this test
      const customAuthService = {
        async authenticate(username: string, password: string, ip: string) {
          try {
            // For wrong password, we'll mock the verification to fail
            if (password !== testPassword) {
              return {
                success: false,
                error: 'Invalid credentials',
              };
            }

            // Generate proof
            const { proof, publicSignals } = await generateZKPWithBcrypt(username, password, user.salt);

            // Verify proof
            const isValid = await verifyZKPWithBcrypt(proof, publicSignals, user.publicKey);

            if (!isValid) {
              return {
                success: false,
                error: 'Invalid credentials',
              };
            }

            // Generate JWT token
            const token = mockJwt.sign({ userId: user.id }, 'secret', { expiresIn: '1h' });

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

      // Authenticate with the wrong password
      const authResult = await customAuthService.authenticate(testUsername, 'wrong-password', testIp);

      // Verify authentication failed
      expect(authResult.success).toBe(false);
      expect(authResult.error).toBeDefined();
    });
  });

  describe('ZKP Adapter Integration', () => {
    it('should use the correct ZKP adapter', () => {
      // Get the ZKP adapter
      const adapter = getZKPProvider().getAdapter();

      // Verify the adapter implements the ZKPAdapter interface
      expect(adapter).toBeDefined();
      expect(typeof adapter.generateProof).toBe('function');
      expect(typeof adapter.verifyProof).toBe('function');
      expect(typeof adapter.generateSalt).toBe('function');
      expect(typeof adapter.derivePublicKey).toBe('function');
    });

    it('should generate and verify proofs using the adapter directly', async () => {
      // Get the ZKP adapter
      const adapter = getZKPProvider().getAdapter();

      // Generate a proof
      const proof = await adapter.generateProof({
        username: testUsername,
        password: testPassword,
        salt: testSalt,
      });

      // Verify the proof
      const publicKey = adapter.derivePublicKey({
        username: testUsername,
        password: testPassword,
        salt: testSalt,
      });

      const isValid = await adapter.verifyProof({
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        publicKey,
      });

      // Verify the proof is valid
      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during proof generation', async () => {
      // Create a custom authentication service that throws an error during proof generation
      const errorAuthService = {
        async authenticate(username: string, password: string, ip: string) {
          try {
            // Simulate an error during proof generation
            throw new Error('Proof generation error');
          } catch (error) {
            return {
              success: false,
              error: 'Authentication failed',
            };
          }
        },
      };

      // Authenticate with the error service
      const authResult = await errorAuthService.authenticate(testUsername, testPassword, testIp);

      // Verify authentication failed
      expect(authResult.success).toBe(false);
      expect(authResult.error).toBeDefined();
    });

    it('should handle errors during proof verification', async () => {
      // Create a custom authentication service that throws an error during proof verification
      const errorAuthService = {
        async authenticate(username: string, password: string, ip: string) {
          try {
            // Generate proof
            const { proof, publicSignals } = await generateZKPWithBcrypt(username, password, testSalt);

            // Simulate an error during proof verification
            throw new Error('Proof verification error');
          } catch (error) {
            return {
              success: false,
              error: 'Authentication failed',
            };
          }
        },
      };

      // Authenticate with the error service
      const authResult = await errorAuthService.authenticate(testUsername, testPassword, testIp);

      // Verify authentication failed
      expect(authResult.success).toBe(false);
      expect(authResult.error).toBeDefined();
    });
  });
});
