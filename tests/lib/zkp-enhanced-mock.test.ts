/**
 * Enhanced ZKP Mock Tests
 *
 * This file tests the ZKP functionality using the enhanced mock implementation.
 */

import { generateProof, verifyProof, generateSalt } from '@/lib/zkp';
import * as snarkjs from 'snarkjs';

// Get access to the mock tracking functionality
const snarkjsMock = snarkjs as any;

describe('ZKP with Enhanced Mock', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    snarkjsMock._reset();
  });

  describe('generateProof function', () => {
    it('should call snarkjs.groth16.fullProve with correct parameters', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      const salt = generateSalt();

      // Act
      await generateProof(username, password, salt);

      // Assert
      const calls = snarkjsMock._getMockCalls();
      expect(calls.groth16.fullProve.length).toBe(1);

      // Check that the input contains the expected fields
      const callArgs = calls.groth16.fullProve[0];
      expect(callArgs.input).toBeDefined();
      expect(callArgs.wasmPath).toBeDefined();
      expect(callArgs.zkeyPath).toBeDefined();

      // Check that the input contains the username and salt
      expect(callArgs.input.username).toBeDefined();
      expect(callArgs.input.salt).toBeDefined();
    });

    it('should handle errors from snarkjs.groth16.fullProve', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      const salt = generateSalt();

      // First, reset the mock to clear any previous calls
      snarkjsMock._reset();

      // Then simulate an error for the next call
      const testError = new Error('Test error');
      snarkjsMock.groth16.fullProve.mockRejectedValueOnce(testError);

      // Act & Assert
      try {
        await generateProof(username, password, salt);
        // If we get here, the test should fail
        fail('Expected generateProof to throw an error');
      } catch (error) {
        // Verify that the error was thrown
        expect(error.message).toContain('Test error');
      }

      // Verify that fullProve was called
      expect(snarkjsMock.groth16.fullProve).toHaveBeenCalled();
    });
  });

  describe('verifyProof function', () => {
    it('should call snarkjs.groth16.verify with correct parameters', async () => {
      // Arrange
      const proof = {
        pi_a: ['1', '2', '3'],
        pi_b: [['1', '2'], ['3', '4']],
        pi_c: ['5', '6', '7'],
        protocol: 'groth16'
      };
      const publicSignals = ['1', '2', '3'];
      const publicKey = 'test-public-key';

      // Act
      await verifyProof(proof, publicSignals, publicKey);

      // Assert
      const calls = snarkjsMock._getMockCalls();
      expect(calls.groth16.verify.length).toBe(1);

      // Check that the parameters are correct
      const callArgs = calls.groth16.verify[0];
      expect(callArgs.vKey).toBeDefined();
      expect(callArgs.publicSignals).toEqual(publicSignals);
      expect(callArgs.proof).toEqual(proof);
    });

    it('should handle errors from snarkjs.groth16.verify', async () => {
      // Arrange
      const proof = {
        pi_a: ['1', '2', '3'],
        pi_b: [['1', '2'], ['3', '4']],
        pi_c: ['5', '6', '7'],
        protocol: 'groth16'
      };
      const publicSignals = ['1', '2', '3'];
      const publicKey = 'test-public-key';

      // First, reset the mock to clear any previous calls
      snarkjsMock._reset();

      // Then simulate an error for the next call
      const testError = new Error('Test error');
      snarkjsMock.groth16.verify.mockRejectedValueOnce(testError);

      // Act
      const result = await verifyProof(proof, publicSignals, publicKey);

      // Assert - the function should catch the error and return false
      expect(result).toBe(false);

      // Verify that verify was called
      expect(snarkjsMock.groth16.verify).toHaveBeenCalled();
    });

    it('should return false for tampered proofs', async () => {
      // Arrange
      const proof = {
        pi_a: ['1', '2', '3'],
        pi_b: [['1', '2'], ['3', '4']],
        pi_c: ['5', '6', '7'],
        protocol: 'groth16',
        tampered: true
      };
      const publicSignals = ['1', '2', '3'];
      const publicKey = 'test-public-key';

      // Act
      const result = await verifyProof(proof, publicSignals, publicKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for tampered public signals', async () => {
      // Arrange
      const proof = {
        pi_a: ['1', '2', '3'],
        pi_b: [['1', '2'], ['3', '4']],
        pi_c: ['5', '6', '7'],
        protocol: 'groth16'
      };
      const publicSignals = ['tampered', '2', '3'];
      const publicKey = 'test-public-key';

      // Act
      const result = await verifyProof(proof, publicSignals, publicKey);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('generateSalt function', () => {
    it('should generate a random salt', () => {
      // Act
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      // Assert
      expect(salt1).toBeDefined();
      expect(salt2).toBeDefined();
      expect(salt1).not.toBe(salt2);
    });
  });
});
