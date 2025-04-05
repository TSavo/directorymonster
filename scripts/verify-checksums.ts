#!/usr/bin/env ts-node

import * as path from 'path';
import { verifyAllCryptoFiles, loadChecksums, CRYPTO_FILE_CHECKSUMS } from '../src/lib/file-integrity';

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

// Load the checksums from the file
const inputPath = path.join(projectRoot, 'crypto-checksums.json');
const checksums = loadChecksums(inputPath);

// Update the checksums in the module
Object.assign(CRYPTO_FILE_CHECKSUMS, checksums);

// Verify all cryptographic files
const allValid = verifyAllCryptoFiles();

if (allValid) {
  console.log('All cryptographic files passed integrity checks.');
  process.exit(0);
} else {
  console.error('Some cryptographic files failed integrity checks.');
  process.exit(1);
}
