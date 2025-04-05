import { MockZKPAdapter } from '@/lib/zkp/mock-adapter';
import * as bcrypt from 'bcrypt';

describe('MockZKPAdapter bcrypt implementation', () => {
  let zkpAdapter: MockZKPAdapter;

  beforeEach(() => {
    zkpAdapter = new MockZKPAdapter();
  });

  describe('derivePublicKey function', () => {
    it('should use bcrypt for hashing', async () => {
      // Arrange
      const input = {
        username: 'testuser',
        password: 'testpassword',
        salt: zkpAdapter.generateSalt()
      };
      
      // Act
      const publicKey = zkpAdapter.derivePublicKey(input);
      
      // Assert
      // bcrypt hashes start with $2b$
      expect(publicKey).toMatch(/^\$2b\$/);
    });
    
    it('should generate different public keys for different passwords', () => {
      // Arrange
      const username = 'testuser';
      const salt = zkpAdapter.generateSalt();
      
      // Act
      const publicKey1 = zkpAdapter.derivePublicKey({
        username,
        password: 'password1',
        salt
      });
      
      const publicKey2 = zkpAdapter.derivePublicKey({
        username,
        password: 'password2',
        salt
      });
      
      // Assert
      expect(publicKey1).not.toBe(publicKey2);
    });
    
    it('should generate different public keys for different salts', () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      
      // Act
      const publicKey1 = zkpAdapter.derivePublicKey({
        username,
        password,
        salt: zkpAdapter.generateSalt()
      });
      
      const publicKey2 = zkpAdapter.derivePublicKey({
        username,
        password,
        salt: zkpAdapter.generateSalt()
      });
      
      // Assert
      expect(publicKey1).not.toBe(publicKey2);
    });
    
    it('should be verifiable with bcrypt.compare', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      const salt = zkpAdapter.generateSalt();
      const combined = `${username}:${password}`;
      
      // Act
      const publicKey = zkpAdapter.derivePublicKey({
        username,
        password,
        salt
      });
      
      // Assert
      const isValid = await bcrypt.compare(combined, publicKey);
      expect(isValid).toBe(true);
    });
  });
});
