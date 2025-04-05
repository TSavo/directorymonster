#!/usr/bin/env node
/**
 * Test ZKP Inputs
 * 
 * This script tests if different inputs produce different outputs in the ZKP circuit.
 * 
 * Usage:
 *   node scripts/test-zkp-inputs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Define paths
const circuitsDir = path.join(__dirname, '../circuits');
const zkpAuthDir = path.join(circuitsDir, 'zkp_auth');
const wasmPath = path.join(zkpAuthDir, 'zkp_auth_js/zkp_auth.wasm');
const zkeyPath = path.join(zkpAuthDir, 'zkp_auth_final.zkey');
const tempDir = path.join(__dirname, '../temp');

// Check if the ZKP authentication system is set up
if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
  console.error('ZKP authentication system not set up. Please run `npm run zkp:setup` first.');
  process.exit(1);
}

// Create temp directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Generate a unique ID for this test
const testId = crypto.randomBytes(8).toString('hex');

// Create inputs with different passwords
const inputs = [
  {
    publicSalt: 789,
    username: 123,
    password: 456
  },
  {
    publicSalt: 789,
    username: 123,
    password: 789
  },
  {
    publicSalt: 789,
    username: 456,
    password: 123
  },
  {
    publicSalt: 456,
    username: 123,
    password: 456
  }
];

// Process each input
const results = [];
for (let i = 0; i < inputs.length; i++) {
  const input = inputs[i];
  const inputPath = path.join(tempDir, `input-${testId}-${i}.json`);
  const witnessPath = path.join(tempDir, `witness-${testId}-${i}.wtns`);
  const proofPath = path.join(tempDir, `proof-${testId}-${i}.json`);
  const publicPath = path.join(tempDir, `public-${testId}-${i}.json`);
  
  // Write input to file
  fs.writeFileSync(inputPath, JSON.stringify(input));
  
  // Generate witness
  try {
    execSync(`npx snarkjs wtns calculate ${wasmPath} ${inputPath} ${witnessPath}`);
  } catch (error) {
    console.error(`Error generating witness for input ${i}:`, error.message);
    continue;
  }
  
  // Generate proof
  try {
    execSync(`npx snarkjs groth16 prove ${zkeyPath} ${witnessPath} ${proofPath} ${publicPath}`);
  } catch (error) {
    console.error(`Error generating proof for input ${i}:`, error.message);
    continue;
  }
  
  // Read public signals
  const publicSignals = JSON.parse(fs.readFileSync(publicPath));
  
  // Store results
  results.push({
    input,
    publicSignals
  });
}

// Compare results
console.log('Input and output comparison:');
console.log('===========================');
for (let i = 0; i < results.length; i++) {
  console.log(`Input ${i}:`);
  console.log(`  publicSalt: ${results[i].input.publicSalt}`);
  console.log(`  username: ${results[i].input.username}`);
  console.log(`  password: ${results[i].input.password}`);
  console.log(`  publicKey: ${results[i].publicSignals[0]}`);
  console.log(`  publicSalt (output): ${results[i].publicSignals[1]}`);
  console.log('---------------------------');
}

// Check if different passwords produce different public keys
const sameUsernameAndSalt = results.filter(r => 
  r.input.username === results[0].input.username && 
  r.input.publicSalt === results[0].input.publicSalt
);

if (sameUsernameAndSalt.length > 1) {
  console.log('\nChecking if different passwords produce different public keys:');
  console.log('=============================================================');
  
  let allDifferent = true;
  for (let i = 0; i < sameUsernameAndSalt.length; i++) {
    for (let j = i + 1; j < sameUsernameAndSalt.length; j++) {
      const result1 = sameUsernameAndSalt[i];
      const result2 = sameUsernameAndSalt[j];
      
      if (result1.input.password !== result2.input.password) {
        console.log(`Comparing password ${result1.input.password} vs ${result2.input.password}:`);
        console.log(`  Public key 1: ${result1.publicSignals[0]}`);
        console.log(`  Public key 2: ${result2.publicSignals[0]}`);
        
        if (result1.publicSignals[0] === result2.publicSignals[0]) {
          console.log('  ❌ SAME public keys for different passwords!');
          allDifferent = false;
        } else {
          console.log('  ✅ Different public keys for different passwords');
        }
        console.log('---------------------------');
      }
    }
  }
  
  if (allDifferent) {
    console.log('\n✅ All different passwords produce different public keys');
  } else {
    console.log('\n❌ Some different passwords produce the same public key');
  }
}

// Check if different usernames produce different public keys
const sameSaltAndPassword = results.filter(r => 
  r.input.password === results[0].input.password && 
  r.input.publicSalt === results[0].input.publicSalt
);

if (sameSaltAndPassword.length > 1) {
  console.log('\nChecking if different usernames produce different public keys:');
  console.log('=============================================================');
  
  let allDifferent = true;
  for (let i = 0; i < sameSaltAndPassword.length; i++) {
    for (let j = i + 1; j < sameSaltAndPassword.length; j++) {
      const result1 = sameSaltAndPassword[i];
      const result2 = sameSaltAndPassword[j];
      
      if (result1.input.username !== result2.input.username) {
        console.log(`Comparing username ${result1.input.username} vs ${result2.input.username}:`);
        console.log(`  Public key 1: ${result1.publicSignals[0]}`);
        console.log(`  Public key 2: ${result2.publicSignals[0]}`);
        
        if (result1.publicSignals[0] === result2.publicSignals[0]) {
          console.log('  ❌ SAME public keys for different usernames!');
          allDifferent = false;
        } else {
          console.log('  ✅ Different public keys for different usernames');
        }
        console.log('---------------------------');
      }
    }
  }
  
  if (allDifferent) {
    console.log('\n✅ All different usernames produce different public keys');
  } else {
    console.log('\n❌ Some different usernames produce the same public key');
  }
}

// Check if different salts produce different public keys
const sameUsernameAndPassword = results.filter(r => 
  r.input.username === results[0].input.username && 
  r.input.password === results[0].input.password
);

if (sameUsernameAndPassword.length > 1) {
  console.log('\nChecking if different salts produce different public keys:');
  console.log('=========================================================');
  
  let allDifferent = true;
  for (let i = 0; i < sameUsernameAndPassword.length; i++) {
    for (let j = i + 1; j < sameUsernameAndPassword.length; j++) {
      const result1 = sameUsernameAndPassword[i];
      const result2 = sameUsernameAndPassword[j];
      
      if (result1.input.publicSalt !== result2.input.publicSalt) {
        console.log(`Comparing salt ${result1.input.publicSalt} vs ${result2.input.publicSalt}:`);
        console.log(`  Public key 1: ${result1.publicSignals[0]}`);
        console.log(`  Public key 2: ${result2.publicSignals[0]}`);
        
        if (result1.publicSignals[0] === result2.publicSignals[0]) {
          console.log('  ❌ SAME public keys for different salts!');
          allDifferent = false;
        } else {
          console.log('  ✅ Different public keys for different salts');
        }
        console.log('---------------------------');
      }
    }
  }
  
  if (allDifferent) {
    console.log('\n✅ All different salts produce different public keys');
  } else {
    console.log('\n❌ Some different salts produce the same public key');
  }
}
