import { generatePublicKey, generateSalt } from '@/lib/zkp';
import * as bcrypt from 'bcrypt';

describe('ZKP bcrypt implementation', () => {
  describe('generatePublicKey function', () => {
    it('should use bcrypt for hashing', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      const salt = generateSalt();
      
      // Act
      const publicKey = await generatePublicKey(username, password, salt);
      
      // Assert
      // bcrypt hashes start with $2b$
      expect(publicKey).toMatch(/^\$2b\$/);
    });
    
    it('should generate different public keys for different passwords', async () => {
      // Arrange
      const username = 'testuser';
      const password1 = 'password1';
      const password2 = 'password2';
      const salt = generateSalt();
      
      // Act
      const publicKey1 = await generatePublicKey(username, password1, salt);
      const publicKey2 = await generatePublicKey(username, password2, salt);
      
      // Assert
      expect(publicKey1).not.toBe(publicKey2);
    });
    
    it('should generate different public keys for different salts', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      
      // Act
      const publicKey1 = await generatePublicKey(username, password, salt1);
      const publicKey2 = await generatePublicKey(username, password, salt2);
      
      // Assert
      expect(publicKey1).not.toBe(publicKey2);
    });
    
    it('should be verifiable with bcrypt.compare', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'testpassword';
      const salt = generateSalt();
      const combined = `${username}:${password}`;
      
      // Act
      const publicKey = await generatePublicKey(username, password, salt);
      
      // Assert
      const isValid = await bcrypt.compare(combined, publicKey);
      expect(isValid).toBe(true);
    });
  });
});
