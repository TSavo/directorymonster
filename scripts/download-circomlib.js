#!/usr/bin/env node
/**
 * Download Circomlib
 * 
 * This script downloads the circomlib repository and extracts the Poseidon hash function
 * implementation for use in our ZKP authentication system.
 * 
 * Usage:
 *   node scripts/download-circomlib.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const tempDir = path.join(__dirname, '../temp');
const circuitLibDir = path.join(__dirname, '../circuits/circomlib');

// Create directories if they don't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

if (!fs.existsSync(circuitLibDir)) {
  fs.mkdirSync(circuitLibDir, { recursive: true });
}

console.log('Downloading circomlib...');

// Clone the circomlib repository
try {
  execSync('git clone https://github.com/iden3/circomlib.git temp/circomlib', { stdio: 'inherit' });
} catch (error) {
  // If the repository already exists, just pull the latest changes
  console.log('Repository already exists, pulling latest changes...');
  execSync('cd temp/circomlib && git pull', { stdio: 'inherit' });
}

console.log('Copying Poseidon implementation...');

// Copy the Poseidon implementation
const poseidonFiles = [
  'poseidon.circom',
  'poseidon_constants.circom',
  'bitify.circom',
  'comparators.circom',
  'gates.circom',
  'babyjub.circom',
  'escalarmulfix.circom',
  'escalarmulany.circom',
  'montgomery.circom',
  'mux1.circom',
  'mux2.circom',
  'mux3.circom',
  'mux4.circom',
  'binsum.circom'
];

// Copy each file
poseidonFiles.forEach(file => {
  const sourcePath = path.join(tempDir, 'circomlib', 'circuits', file);
  const destPath = path.join(circuitLibDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file}`);
  } else {
    console.log(`File not found: ${sourcePath}`);
  }
});

console.log('Creating index file...');

// Create an index file that includes all the necessary files
const indexContent = `/*
 * Circomlib Poseidon Hash Function
 * 
 * This file includes the Poseidon hash function implementation from circomlib.
 * https://github.com/iden3/circomlib
 */

include "./poseidon.circom";
include "./poseidon_constants.circom";
`;

fs.writeFileSync(path.join(circuitLibDir, 'index.circom'), indexContent);

console.log('Done!');
