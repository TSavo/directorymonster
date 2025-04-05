import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Generate a SHA-256 checksum for a file
 * @param filePath - The path to the file
 * @returns The SHA-256 checksum as a hex string
 */
export function generateChecksum(filePath: string): string {
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Read the file
  const fileBuffer = fs.readFileSync(filePath);
  
  // Create a SHA-256 hash
  const hash = crypto.createHash('sha256');
  
  // Update the hash with the file content
  hash.update(fileBuffer);
  
  // Return the hash as a hex string
  return hash.digest('hex');
}

/**
 * Verify the integrity of a file by comparing its checksum to an expected value
 * @param filePath - The path to the file
 * @param expectedChecksum - The expected SHA-256 checksum
 * @returns True if the file integrity is verified, false otherwise
 */
export function verifyFileIntegrity(filePath: string, expectedChecksum: string): boolean {
  try {
    // Generate the checksum for the file
    const actualChecksum = generateChecksum(filePath);
    
    // Compare the checksums
    return actualChecksum === expectedChecksum;
  } catch (error) {
    // Re-throw the error
    throw error;
  }
}

/**
 * Cryptographic files that need integrity verification
 */
export const CRYPTO_FILES = [
  'circuits/zkp_auth/zkp_auth.circom',
  'circuits/zkp_auth/zkp_auth.r1cs',
  'circuits/zkp_auth/zkp_auth.sym',
  'circuits/zkp_auth/zkp_auth.wasm',
  'circuits/zkp_auth/verification_key.json',
  'circuits/zkp_auth/proving_key.json',
  'circuits/poseidon_constants.circom',
  'circuits/circomlib/montgomery.circom',
  'circuits/circomlib/poseidon.circom'
];

/**
 * Expected checksums for cryptographic files
 */
export const CRYPTO_FILE_CHECKSUMS: Record<string, string> = {
  // These checksums will be generated during the build process
  // and stored in a separate file
};

/**
 * Verify the integrity of all cryptographic files
 * @returns True if all files pass integrity checks, false otherwise
 */
export function verifyAllCryptoFiles(): boolean {
  let allValid = true;
  
  for (const filePath of CRYPTO_FILES) {
    const expectedChecksum = CRYPTO_FILE_CHECKSUMS[filePath];
    
    // Skip files that don't have checksums yet
    if (!expectedChecksum) {
      console.warn(`No checksum found for ${filePath}`);
      continue;
    }
    
    try {
      const isValid = verifyFileIntegrity(filePath, expectedChecksum);
      
      if (!isValid) {
        console.error(`Integrity check failed for ${filePath}`);
        allValid = false;
      }
    } catch (error) {
      console.error(`Error verifying ${filePath}: ${error}`);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Generate checksums for all cryptographic files
 * @returns An object mapping file paths to checksums
 */
export function generateAllChecksums(): Record<string, string> {
  const checksums: Record<string, string> = {};
  
  for (const filePath of CRYPTO_FILES) {
    try {
      checksums[filePath] = generateChecksum(filePath);
    } catch (error) {
      console.error(`Error generating checksum for ${filePath}: ${error}`);
    }
  }
  
  return checksums;
}

/**
 * Save checksums to a file
 * @param outputPath - The path to save the checksums to
 * @param checksums - The checksums to save
 */
export function saveChecksums(outputPath: string, checksums: Record<string, string>): void {
  const content = JSON.stringify(checksums, null, 2);
  fs.writeFileSync(outputPath, content);
}

/**
 * Load checksums from a file
 * @param inputPath - The path to load the checksums from
 * @returns The loaded checksums
 */
export function loadChecksums(inputPath: string): Record<string, string> {
  if (!fs.existsSync(inputPath)) {
    return {};
  }
  
  const content = fs.readFileSync(inputPath, 'utf8');
  return JSON.parse(content);
}
