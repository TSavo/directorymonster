import { hashPassword, verifyPassword, generatePasswordResetToken, generateSessionToken } from '@/lib/crypto';

describe('crypto utility', () => {
  describe('hashPassword function', () => {
    it('returns a string with salt and hash', async () => {
      const password = 'test-password';
      const hashedPassword = await hashPassword(password);
      
      // Should be a string
      expect(typeof hashedPassword).toBe('string');
      
      // Should contain at least one colon (:) separator
      expect(hashedPassword.includes(':')).toBe(true);
      
      // Should have two parts (salt and hash)
      const parts = hashedPassword.split(':');
      expect(parts.length).toBe(2);
      
      // Each part should be a hex string
      const [salt, hash] = parts;
      expect(salt.length).toBe(32); // 16 bytes as hex
      expect(hash.length).toBe(128); // 64 bytes as hex
    });
    
    it('generates different hashes for the same password', async () => {
      const password = 'test-password';
      
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Should be different due to different salts
      expect(hash1).not.toBe(hash2);
    });
  });
  
  describe('verifyPassword function', () => {
    it('returns true for matching password', async () => {
      const password = 'test-password';
      const hashedPassword = await hashPassword(password);
      
      const result = await verifyPassword(hashedPassword, password);
      
      expect(result).toBe(true);
    });
    
    it('returns false for non-matching password', async () => {
      const password = 'test-password';
      const wrongPassword = 'wrong-password';
      const hashedPassword = await hashPassword(password);
      
      const result = await verifyPassword(hashedPassword, wrongPassword);
      
      expect(result).toBe(false);
    });
    
    it('handles empty passwords correctly', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);
      
      // Empty password should still verify correctly
      const result = await verifyPassword(hashedPassword, password);
      expect(result).toBe(true);
      
      // But not match other passwords
      const wrongResult = await verifyPassword(hashedPassword, 'some-password');
      expect(wrongResult).toBe(false);
    });
  });
  
  describe('generatePasswordResetToken function', () => {
    it('generates a 64-character hex string', async () => {
      const token = await generatePasswordResetToken();
      
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes as hex
      
      // Should be a valid hex string
      expect(/^[0-9a-f]+$/i.test(token)).toBe(true);
    });
    
    it('generates unique tokens', async () => {
      const token1 = await generatePasswordResetToken();
      const token2 = await generatePasswordResetToken();
      
      expect(token1).not.toBe(token2);
    });
  });
  
  describe('generateSessionToken function', () => {
    it('generates a 96-character hex string', async () => {
      const token = await generateSessionToken();
      
      expect(typeof token).toBe('string');
      expect(token.length).toBe(96); // 48 bytes as hex
      
      // Should be a valid hex string
      expect(/^[0-9a-f]+$/i.test(token)).toBe(true);
    });
    
    it('generates unique tokens', async () => {
      const token1 = await generateSessionToken();
      const token2 = await generateSessionToken();
      
      expect(token1).not.toBe(token2);
    });
  });
});
