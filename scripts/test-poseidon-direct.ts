// Test script to verify Poseidon hash function directly using snarkjs
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as snarkjs from 'snarkjs';

interface CircuitInput {
  username: bigint;
  password: bigint;
  publicSalt: bigint;
}

interface ProofResult {
  proof: {
    pi_a: string[] | number[];
    pi_b: (string[] | number[])[];
    pi_c: string[] | number[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

async function testPoseidonHash(): Promise<void> {
  console.log('Testing Poseidon hash function...');

  // Define test inputs
  const username1 = 'testuser';
  const password1 = 'password1';
  const password2 = 'password2';
  const publicSalt = 'testsalt123';

  console.log(`Username: ${username1}`);
  console.log(`Password 1: ${password1}`);
  console.log(`Password 2: ${password2}`);
  console.log(`Salt: ${publicSalt}`);

  // Convert inputs to the format expected by the circuit
  const input1: CircuitInput = {
    username: BigInt('0x' + crypto.createHash('sha256').update(username1).digest('hex')) % BigInt(2**64),
    password: BigInt('0x' + crypto.createHash('sha256').update(password1).digest('hex')) % BigInt(2**64),
    publicSalt: BigInt('0x' + crypto.createHash('sha256').update(publicSalt).digest('hex')) % BigInt(2**64)
  };

  const input2: CircuitInput = {
    username: BigInt('0x' + crypto.createHash('sha256').update(username1).digest('hex')) % BigInt(2**64),
    password: BigInt('0x' + crypto.createHash('sha256').update(password2).digest('hex')) % BigInt(2**64),
    publicSalt: BigInt('0x' + crypto.createHash('sha256').update(publicSalt).digest('hex')) % BigInt(2**64)
  };

  // Define paths to circuit files
  // Look for the WASM file in the current directory first
  let circuitWasmPath = path.join(process.cwd(), 'zkp_auth.wasm');
  if (!fs.existsSync(circuitWasmPath)) {
    // If not found, look in the zkp_auth_js directory
    circuitWasmPath = path.join(process.cwd(), 'circuits', 'zkp_auth', 'zkp_auth_js', 'zkp_auth.wasm');
  }
  const zkeyPath = path.join(process.cwd(), 'circuits', 'zkp_auth', 'zkp_auth_final.zkey');

  console.log(`Circuit WASM path: ${circuitWasmPath}`);
  console.log(`ZKey path: ${zkeyPath}`);

  // Check if files exist
  const wasmExists = fs.existsSync(circuitWasmPath);
  const zkeyExists = fs.existsSync(zkeyPath);

  console.log(`WASM file exists: ${wasmExists}`);
  console.log(`ZKey file exists: ${zkeyExists}`);

  if (!wasmExists || !zkeyExists) {
    console.error('Circuit files not found. Please run the zkp:setup script first.');
    return;
  }

  try {
    // Generate proof with password1
    console.log('\nGenerating proof with password1...');
    const { proof: proof1, publicSignals: publicSignals1 } = await snarkjs.groth16.fullProve(
      input1,
      circuitWasmPath,
      zkeyPath
    ) as ProofResult;

    // Generate proof with password2
    console.log('\nGenerating proof with password2...');
    const { proof: proof2, publicSignals: publicSignals2 } = await snarkjs.groth16.fullProve(
      input2,
      circuitWasmPath,
      zkeyPath
    ) as ProofResult;

    console.log('\nResults:');
    console.log(`Public key 1: ${publicSignals1[0]}`);
    console.log(`Public key 2: ${publicSignals2[0]}`);

    if (publicSignals1[0] !== publicSignals2[0]) {
      console.log('\n✅ SUCCESS: Different passwords produce different public keys');
      console.log('This confirms that the Poseidon hash function is working correctly.');
    } else {
      console.log('\n❌ FAILURE: Different passwords produce the same public key');
      console.log('This indicates a problem with the hash function implementation.');
    }
  } catch (error) {
    console.error('Error generating proofs:', error);
  }
}

testPoseidonHash().catch(console.error);
