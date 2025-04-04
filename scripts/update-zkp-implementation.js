#!/usr/bin/env node
/**
 * Update ZKP Implementation
 *
 * This script updates the ZKP implementation in the existing codebase to use the
 * new ZKP authentication system.
 *
 * Usage:
 *   node scripts/update-zkp-implementation.js
 */

const fs = require('fs');
const path = require('path');

// Define paths
const zkpIndexPath = path.join(__dirname, '../src/lib/zkp/index.ts');
const zkpAuthDir = path.join(__dirname, '../circuits/zkp_auth');

// Check if the ZKP authentication system is set up
if (!fs.existsSync(zkpAuthDir) || !fs.existsSync(path.join(zkpAuthDir, 'zkp_auth_final.zkey'))) {
  console.error('ZKP authentication system not set up. Please run `npm run zkp:setup` first.');
  process.exit(1);
}

// Read the existing ZKP implementation
let zkpIndex = fs.readFileSync(zkpIndexPath, 'utf8');

// Update the paths to the circuit files
zkpIndex = zkpIndex.replace(
  /const circuitWasmPath = path\.join\([^)]+\);/,
  `const circuitWasmPath = path.join(__dirname, '../../../circuits/zkp_auth/zkp_auth_js/zkp_auth.wasm');`
);

zkpIndex = zkpIndex.replace(
  /const zkeyPath = path\.join\([^)]+\);/,
  `const zkeyPath = path.join(__dirname, '../../../circuits/zkp_auth/zkp_auth_final.zkey');`
);

zkpIndex = zkpIndex.replace(
  /const vKeyPath = path\.join\([^)]+\);/,
  `const vKeyPath = path.join(__dirname, '../../../circuits/zkp_auth/verification_key.json');`
);

// Update the input format for the circuit
zkpIndex = zkpIndex.replace(
  /const input = \{[^}]+\};/s,
  `const input = {
      username: BigInt('0x' + crypto.createHash('sha256').update(username).digest('hex')) % BigInt(2**64),
      password: BigInt('0x' + crypto.createHash('sha256').update(password).digest('hex')) % BigInt(2**64),
      publicSalt: BigInt('0x' + crypto.createHash('sha256').update(salt).digest('hex')) % BigInt(2**64)
    };`
);

// Write the updated ZKP implementation
fs.writeFileSync(zkpIndexPath, zkpIndex);

console.log(`✅ ZKP implementation updated: ${zkpIndexPath}`);

// Add the script to package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts['zkp:update']) {
  packageJson.scripts['zkp:update'] = 'node scripts/update-zkp-implementation.js';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`✅ Added 'zkp:update' script to package.json`);
}

console.log(`\n🎉 ZKP implementation updated successfully!`);
console.log(`\nTo use the new ZKP authentication system, run:`);
console.log(`\n  npm run zkp:setup`);
console.log(`  npm run zkp:update`);
console.log(`\nThis will set up the ZKP authentication system and update the implementation in the codebase.`);
