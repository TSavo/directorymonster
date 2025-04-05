import * as fs from 'fs';
import * as path from 'path';
import { verifyFileIntegrity, generateChecksum, CRYPTO_FILES, CRYPTO_FILE_CHECKSUMS, verifyAllCryptoFiles } from '@/lib/file-integrity';

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn()
}));

describe('File Integrity Checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateChecksum function', () => {
    it('should generate a SHA-256 checksum for a file', () => {
      // Mock file content
      const fileContent = 'test file content';
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(fileContent));
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Generate checksum
      const checksum = generateChecksum('test.file');

      // Expected SHA-256 hash of 'test file content'
      const expectedChecksum = '60f5237ed4049f0382661ef009d2bc42e48c3ceb3edb6600f7024e7ab3b838f3';

      // Verify checksum
      expect(checksum).toBe(expectedChecksum);
      expect(fs.readFileSync).toHaveBeenCalledWith('test.file');
    });

    it('should throw an error if the file does not exist', () => {
      // Mock file not existing
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Verify error is thrown
      expect(() => generateChecksum('nonexistent.file')).toThrow('File not found');
    });
  });

  describe('verifyFileIntegrity function', () => {
    it('should return true if the file checksum matches the expected checksum', () => {
      // Mock file content
      const fileContent = 'test file content';
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(fileContent));
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Expected SHA-256 hash of 'test file content'
      const expectedChecksum = '60f5237ed4049f0382661ef009d2bc42e48c3ceb3edb6600f7024e7ab3b838f3';

      // Verify integrity
      const isValid = verifyFileIntegrity('test.file', expectedChecksum);

      // Verify result
      expect(isValid).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('test.file');
    });

    it('should return false if the file checksum does not match the expected checksum', () => {
      // Mock file content
      const fileContent = 'test file content';
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(fileContent));
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Incorrect checksum
      const expectedChecksum = 'incorrect-checksum';

      // Verify integrity
      const isValid = verifyFileIntegrity('test.file', expectedChecksum);

      // Verify result
      expect(isValid).toBe(false);
      expect(fs.readFileSync).toHaveBeenCalledWith('test.file');
    });

    it('should throw an error if the file does not exist', () => {
      // Mock file not existing
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Verify error is thrown
      expect(() => verifyFileIntegrity('nonexistent.file', 'checksum')).toThrow('File not found');
    });
  });

  describe('Cryptographic file integrity', () => {
    it('should have a list of cryptographic files to check', () => {
      // Verify that the list of files is not empty
      expect(CRYPTO_FILES.length).toBeGreaterThan(0);

      // Verify that the list includes important files
      expect(CRYPTO_FILES).toContain('circuits/zkp_auth/zkp_auth.circom');
      expect(CRYPTO_FILES).toContain('circuits/poseidon_constants.circom');
      expect(CRYPTO_FILES).toContain('circuits/circomlib/montgomery.circom');
    });

    it('should verify the integrity of all cryptographic files', () => {
      // Mock all files to exist and have valid checksums
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock file content to match checksums
      const mockFileContent = 'test file content';
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(mockFileContent));

      // Mock checksums
      const mockChecksum = '60f5237ed4049f0382661ef009d2bc42e48c3ceb3edb6600f7024e7ab3b838f3';

      // Add mock checksums to the CRYPTO_FILE_CHECKSUMS object
      for (const file of CRYPTO_FILES) {
        CRYPTO_FILE_CHECKSUMS[file] = mockChecksum;
      }

      // Verify all files
      const result = verifyAllCryptoFiles();

      // Expect all files to pass
      expect(result).toBe(true);

      // Verify that readFileSync was called for each file
      expect(fs.readFileSync).toHaveBeenCalledTimes(CRYPTO_FILES.length);
    });

    it('should detect tampered files', () => {
      // Mock all files to exist
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock file content to NOT match checksums
      const mockFileContent = 'tampered file content';
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(mockFileContent));

      // Mock checksums
      const mockChecksum = '4a92c2c19e4b5a9c1b9dbeee4cee1ce4d8fb7c1f82d8e608b003c61f550e05f8';

      // Add mock checksums to the CRYPTO_FILE_CHECKSUMS object
      for (const file of CRYPTO_FILES) {
        CRYPTO_FILE_CHECKSUMS[file] = mockChecksum;
      }

      // Mock console.error and console.warn to prevent output during tests
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Verify all files
      const result = verifyAllCryptoFiles();

      // Expect verification to fail
      expect(result).toBe(false);

      // Verify that console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
});
