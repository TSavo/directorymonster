// Test script to directly verify that different passwords produce different hashes
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Function to generate a deterministic hash for testing
function generateHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Function to test if different passwords produce different hashes
function testDifferentPasswords() {
  console.log('Testing if different passwords produce different hashes...');
  
  // Define test inputs
  const username = 'testuser';
  const password1 = 'password1';
  const password2 = 'password2';
  const salt = 'testsalt123';
  
  console.log(`Username: ${username}`);
  console.log(`Password 1: ${password1}`);
  console.log(`Password 2: ${password2}`);
  console.log(`Salt: ${salt}`);
  
  // Generate hashes
  const hash1 = generateHash(`${username}:${password1}:${salt}`);
  const hash2 = generateHash(`${username}:${password2}:${salt}`);
  
  console.log('\nResults:');
  console.log(`Hash 1: ${hash1}`);
  console.log(`Hash 2: ${hash2}`);
  
  if (hash1 !== hash2) {
    console.log('\n✅ SUCCESS: Different passwords produce different hashes');
  } else {
    console.log('\n❌ FAILURE: Different passwords produce the same hash');
  }
}

// Function to test if the same password produces the same hash
function testSamePassword() {
  console.log('\nTesting if the same password produces the same hash...');
  
  // Define test inputs
  const username = 'testuser';
  const password = 'password1';
  const salt = 'testsalt123';
  
  // Generate hashes
  const hash1 = generateHash(`${username}:${password}:${salt}`);
  const hash2 = generateHash(`${username}:${password}:${salt}`);
  
  console.log('\nResults:');
  console.log(`Hash 1: ${hash1}`);
  console.log(`Hash 2: ${hash2}`);
  
  if (hash1 === hash2) {
    console.log('\n✅ SUCCESS: Same password produces the same hash');
  } else {
    console.log('\n❌ FAILURE: Same password produces different hashes');
  }
}

// Function to test if different salts produce different hashes
function testDifferentSalts() {
  console.log('\nTesting if different salts produce different hashes...');
  
  // Define test inputs
  const username = 'testuser';
  const password = 'password1';
  const salt1 = 'testsalt123';
  const salt2 = 'testsalt456';
  
  // Generate hashes
  const hash1 = generateHash(`${username}:${password}:${salt1}`);
  const hash2 = generateHash(`${username}:${password}:${salt2}`);
  
  console.log('\nResults:');
  console.log(`Hash 1 (salt=${salt1}): ${hash1}`);
  console.log(`Hash 2 (salt=${salt2}): ${hash2}`);
  
  if (hash1 !== hash2) {
    console.log('\n✅ SUCCESS: Different salts produce different hashes');
  } else {
    console.log('\n❌ FAILURE: Different salts produce the same hash');
  }
}

// Run the tests
testDifferentPasswords();
testSamePassword();
testDifferentSalts();
