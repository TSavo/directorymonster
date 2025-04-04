// Test script to verify that different passwords produce different public keys
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Define paths
const outputDir = path.join(process.cwd(), 'circuits', 'zkp_auth', 'simple_auth_output');
const wasmFile = path.join(outputDir, 'simple_auth_js', 'simple_auth.wasm');
const inputFile1 = path.join(outputDir, 'input1.json');
const inputFile2 = path.join(outputDir, 'input2.json');
const witnessFile1 = path.join(outputDir, 'witness1.wtns');
const witnessFile2 = path.join(outputDir, 'witness2.wtns');
const witnessJsonFile1 = path.join(outputDir, 'witness1.json');
const witnessJsonFile2 = path.join(outputDir, 'witness2.json');

interface CircuitInput {
  username: string;
  password: string;
  publicSalt: string;
}

// Create test input files with different passwords
const input1: CircuitInput = {
  username: "5017715859210987140",
  password: "1744375401105705294",
  publicSalt: "12192593807163053881"
};

const input2: CircuitInput = {
  username: "5017715859210987140",
  password: "9876543210987654321",  // Different password
  publicSalt: "12192593807163053881"
};

// Write input files
fs.writeFileSync(inputFile1, JSON.stringify(input1, null, 2));
fs.writeFileSync(inputFile2, JSON.stringify(input2, null, 2));

console.log('Testing that different passwords produce different public keys...');
console.log(`Input 1: ${JSON.stringify(input1)}`);
console.log(`Input 2: ${JSON.stringify(input2)}`);

// Generate witnesses
console.log('\nGenerating witness for input 1...');
execSync(`npx snarkjs wtns calculate ${wasmFile} ${inputFile1} ${witnessFile1}`, { stdio: 'inherit' });

console.log('\nGenerating witness for input 2...');
execSync(`npx snarkjs wtns calculate ${wasmFile} ${inputFile2} ${witnessFile2}`, { stdio: 'inherit' });

// Export witnesses to JSON
console.log('\nExporting witnesses to JSON...');
execSync(`npx snarkjs wtns export json ${witnessFile1} ${witnessJsonFile1}`, { stdio: 'inherit' });
execSync(`npx snarkjs wtns export json ${witnessFile2} ${witnessJsonFile2}`, { stdio: 'inherit' });

// Read witnesses
const witness1 = JSON.parse(fs.readFileSync(witnessJsonFile1, 'utf8'));
const witness2 = JSON.parse(fs.readFileSync(witnessJsonFile2, 'utf8'));

// Extract public keys (first element in the witness array)
const publicKey1 = witness1[1];
const publicKey2 = witness2[1];

console.log('\nResults:');
console.log(`Public key 1: ${publicKey1}`);
console.log(`Public key 2: ${publicKey2}`);

if (publicKey1 !== publicKey2) {
  console.log('\n✅ SUCCESS: Different passwords produce different public keys');
  console.log('This confirms that the Poseidon hash function is working correctly.');
  // Exit with success code
  process.exit(0);
} else {
  console.log('\n❌ FAILURE: Different passwords produce the same public key');
  console.log('This indicates a problem with the hash function implementation.');
  // Exit with error code
  process.exit(1);
}
