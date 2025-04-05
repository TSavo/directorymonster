// ZKP (Zero-Knowledge Proof) Library
import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

// Define interfaces for the ZKP system
export interface Proof {
  pi_a: string[] | number[];
  pi_b: (string[] | number[])[];
  pi_c: string[] | number[];
  protocol: string;
  curve: string;
  tampered?: boolean;
}

export interface ZKPResult {
  proof: Proof;
  publicSignals: string[];
}

/**
 * Generate a public key from credentials
 * @param username - The username
 * @param password - The password
 * @param salt - The salt
 * @returns The public key
 */
export async function generatePublicKey(username: string, password: string, salt: string): Promise<string> {
  // Combine the inputs (excluding salt as bcrypt will handle it)
  const combined = `${username}:${password}`;

  // Use bcrypt for secure hashing with salt
  const saltRounds = 12;
  return await bcrypt.hash(combined, saltRounds);
}

/**
 * Generate a ZKP proof for authentication
 * @param username - The username
 * @param password - The password
 * @param salt - The salt
 * @returns The proof and public signals
 */
export async function generateProof(username: string, password: string, salt: string): Promise<ZKPResult> {
  try {
    // Get the circuit paths
    const circuitWasmPath = path.join(process.cwd(), 'circuits/zkp_auth/simple_auth_output/simple_auth_js/simple_auth.wasm');
    const zkeyPath = path.join(process.cwd(), 'circuits/zkp_auth/simple_auth_output/simple_auth_final.zkey');

    // Ensure the circuit files exist
    if (!fs.existsSync(circuitWasmPath) || !fs.existsSync(zkeyPath)) {
      throw new Error('Circuit files not found. Please compile the circuits first.');
    }

    // Create the witness input
    const input = {
      username: stringToHex(username),
      password: stringToHex(password),
      salt: stringToHex(salt),
      timestamp: Date.now().toString()
    };

    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      circuitWasmPath,
      zkeyPath
    );

    return { proof, publicSignals } as ZKPResult;
  } catch (error) {
    console.error('Error generating proof:', error);
    throw error;
  }
}

/**
 * Verify a ZKP proof
 * @param proof - The proof
 * @param publicSignals - The public signals
 * @returns Whether the proof is valid
 */
export async function verifyProof(proof: Proof, publicSignals: string[]): Promise<boolean> {
  try {
    // Get the verification key
    const vKeyPath = path.join(process.cwd(), 'circuits/zkp_auth/simple_auth_output/verification_key.json');

    // Ensure the verification key exists
    if (!fs.existsSync(vKeyPath)) {
      throw new Error('Verification key not found. Please compile the circuits first.');
    }

    // Load the verification key
    const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));

    // Verify the proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    return isValid;
  } catch (error) {
    console.error('Error verifying proof:', error);
    return false;
  }
}

/**
 * Convert a string to hex
 * @param str - The string to convert
 * @returns The hex representation
 */
function stringToHex(str: string): string {
  return '0x' + Buffer.from(str, 'utf8').toString('hex');
}

/**
 * Generate a random salt for use in password hashing
 * @returns A random salt string
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}
