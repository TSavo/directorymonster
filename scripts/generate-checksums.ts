#!/usr/bin/env ts-node

import * as path from 'path';
import { generateAllChecksums, saveChecksums } from '../src/lib/file-integrity';

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

// Generate checksums for all cryptographic files
const checksums = generateAllChecksums();

// Save the checksums to a file
const outputPath = path.join(projectRoot, 'crypto-checksums.json');
saveChecksums(outputPath, checksums);

console.log(`Checksums generated and saved to ${outputPath}`);
console.log('Add this file to version control to enable integrity checks.');
