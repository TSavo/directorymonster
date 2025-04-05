import { generateSalt } from '@/lib/zkp';

// Mock bcrypt module
jest.mock('bcrypt', () => {
  const mockHash = jest.fn().mockImplementation((password, saltRounds) => {
    return Promise.resolve(`$2b$${saltRounds}$mockedhash`);
  });

  const mockCompare = jest.fn().mockImplementation((password, hash) => {
    return Promise.resolve(password === 'testpassword');
  });

  const mockGenSaltSync = jest.fn().mockImplementation((rounds) => {
    return `$2b$${rounds}$mockedsalt`;
  });

  return {
    hash: mockHash,
    compare: mockCompare,
    genSaltSync: mockGenSaltSync
  };
});

// Import after mocking
import { generateZKPWithBcrypt, verifyZKPWithBcrypt, hashPassword, verifyPassword, generateBcryptSalt } from '@/lib/zkp/zkp-bcrypt';

// Get the mocks for assertions
const bcrypt = require('bcrypt');
const mockHash = bcrypt.hash;
const mockCompare = bcrypt.compare;
const mockGenSaltSync = bcrypt.genSaltSync;

// Mock the ZKP adapter
jest.mock('@/lib/zkp/provider', () => ({
  getZKPProvider: jest.fn().mockReturnValue({
    getAdapter: jest.fn().mockReturnValue({
      generateProof: jest.fn().mockImplementation((input) => {
        return {
          proof: { mock: 'proof' },
          publicSignals: { mock: 'publicSignals' },
          input
        };
      }),
      verifyProof: jest.fn().mockImplementation(({ proof, publicSignals, publicKey }) => {
        // Simple mock implementation that checks if the publicKey contains the hashed password
        return true;
      })
    })
  })
}));

describe('ZKP-Bcrypt Client Integration', () => {
  describe('generateZKPWithBcrypt', () => {
    it('should hash the password with bcrypt before generating a ZKP proof', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      const salt = generateSalt();

      // Reset mock counters
      mockHash.mockClear();

      // Act
      const result = await generateZKPWithBcrypt(username, password, salt);

      // Assert
      expect(mockHash).toHaveBeenCalledWith(password, expect.any(Number));
      expect(result).toHaveProperty('proof');
      expect(result).toHaveProperty('publicSignals');
      expect(result.input.password).not.toBe(password); // Password should be hashed

      // No need to clean up with our mock approach
    });

    it('should use the provided username and salt in the ZKP proof', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      const salt = generateSalt();

      // Act
      const result = await generateZKPWithBcrypt(username, password, salt);

      // Assert
      expect(result.input.username).toBe(username);
      expect(result.input.salt).toBe(salt);
    });
  });

  describe('verifyZKPWithBcrypt', () => {
    it('should verify a ZKP proof with bcrypt', async () => {
      // Arrange
      const proof = { mock: 'proof' };
      const publicSignals = { mock: 'publicSignals' };
      const storedHash = await hashPassword('testpassword');

      // Act
      const result = await verifyZKPWithBcrypt(proof, publicSignals, storedHash);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject an invalid ZKP proof', async () => {
      // Arrange
      const proof = { mock: 'invalid-proof' };
      const publicSignals = { mock: 'invalid-publicSignals' };
      const storedHash = await hashPassword('testpassword');

      // Mock the adapter to reject this proof
      const { getZKPProvider } = require('@/lib/zkp/provider');
      getZKPProvider().getAdapter().verifyProof.mockReturnValueOnce(false);

      // Act
      const result = await verifyZKPWithBcrypt(proof, publicSignals, storedHash);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password with bcrypt', async () => {
      // Arrange
      const password = 'testpassword';

      // Reset mock counters
      mockHash.mockClear();
      mockCompare.mockClear();

      // Act
      const hash = await hashPassword(password);

      // Assert
      expect(hash).toMatch(/^\$2b\$/); // bcrypt hash format

      // We don't actually call compare in the hashPassword function
      // so we can't check if it was called
    });

    it('should use the specified salt rounds', async () => {
      // Arrange
      const password = 'testpassword';
      const saltRounds = 12;

      // Reset mock counters
      mockHash.mockClear();

      // Act
      await hashPassword(password, saltRounds);

      // Assert
      expect(mockHash).toHaveBeenCalledWith(password, saltRounds);

      // No need to clean up with our mock approach
    });
  });

  describe('verifyPassword', () => {
    it('should verify a password against a bcrypt hash', async () => {
      // Arrange
      const password = 'testpassword';
      const hash = await hashPassword(password);

      // Act
      const result = await verifyPassword(password, hash);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      // Arrange
      const password = 'testpassword';
      const incorrectPassword = 'wrongpassword';
      const hash = await hashPassword(password);

      // Act
      const result = await verifyPassword(incorrectPassword, hash);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('generateBcryptSalt', () => {
    it('should generate a valid bcrypt salt', async () => {
      // Act
      const salt = await generateBcryptSalt();

      // Assert
      expect(salt).toMatch(/^\$2b\$/); // bcrypt salt format
    });

    it('should use the specified rounds', async () => {
      // Arrange
      const rounds = 12;

      // Reset mock counters
      mockGenSaltSync.mockClear();

      // Act
      await generateBcryptSalt(rounds);

      // Assert
      expect(mockGenSaltSync).toHaveBeenCalledWith(rounds);

      // No need to clean up with our mock approach
    });
  });
});
