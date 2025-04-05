/**
 * Zero-Knowledge Proof Library with Bcrypt Integration
 *
 * This library provides a secure authentication system that combines
 * Zero-Knowledge Proofs (ZKP) with bcrypt password hashing.
 *
 * The implementation uses SnarkJS for ZKP and bcrypt for password hashing,
 * providing multiple layers of security:
 * 1. Passwords are hashed with bcrypt before being used in ZKP
 * 2. ZKP ensures passwords are never transmitted to the server
 * 3. Even if the ZKP system is compromised, passwords remain protected by bcrypt
 *
 * References:
 * - SnarkJS: https://github.com/iden3/snarkjs
 * - Circom: https://github.com/iden3/circom
 * - Bcrypt: https://github.com/kelektiv/node.bcrypt.js
 */

import { ZKPInput, ZKPProof } from './adapter';
import { getZKPProvider } from './provider';
import * as bcrypt from 'bcrypt';
import { generateZKPWithBcrypt, verifyZKPWithBcrypt, hashPassword } from './zkp-bcrypt';

/**
 * Generate a Zero-Knowledge Proof with bcrypt integration
 * @param username The username
 * @param password The password
 * @param salt The salt
 * @returns A promise that resolves to the proof and public signals
 */
export async function generateProof(
  username: string,
  password: string,
  salt: string
): Promise<ZKPProof> {
  // Use the bcrypt-enhanced ZKP implementation
  return generateZKPWithBcrypt(username, password, salt);
}

/**
 * Verify a Zero-Knowledge Proof with bcrypt integration
 * @param proof The proof to verify
 * @param publicSignals Public signals that were generated with the proof
 * @param publicKey The public key to verify against (bcrypt hash)
 * @returns A promise that resolves to true if verified, false otherwise
 */
export async function verifyProof(
  proof: unknown,
  publicSignals: unknown,
  publicKey: string
): Promise<boolean> {
  // Use the bcrypt-enhanced ZKP verification
  return verifyZKPWithBcrypt(proof, publicSignals, publicKey);
}

/**
 * Generate a salt value for a new user
 * @returns A unique salt value
 */
export function generateSalt(): string {
  const adapter = getZKPProvider().getAdapter();
  return adapter.generateSalt();
}

/**
 * Generate a public key from user credentials using bcrypt
 * This is stored server-side for verification
 * @param username The username
 * @param password The password
 * @param salt The salt
 * @returns Public key derived from credentials (bcrypt hash)
 */
export async function generatePublicKey(
  username: string,
  password: string,
  salt: string
): Promise<string> {
  // First hash the password with bcrypt
  const hashedPassword = await hashPassword(password);

  // Generate a ZKP proof using the hashed password
  const { publicSignals } = await generateZKPWithBcrypt(username, hashedPassword, salt);

  // The first public signal is the public key
  return publicSignals[0];
}

/**
 * Derive a public key from user credentials
 * This is stored server-side for verification
 * @param input User credentials
 * @returns Public key derived from credentials
 * @deprecated Use generatePublicKey instead
 */
export function derivePublicKey(input: ZKPInput): string {
  console.warn('derivePublicKey is deprecated, use generatePublicKey instead');
  const adapter = getZKPProvider().getAdapter();
  return adapter.derivePublicKey(input);
}

// Re-export types for convenience
export type { ZKPInput, ZKPProof };

// Re-export bcrypt functions for convenience
export { hashPassword, verifyPassword, generateBcryptSalt } from './zkp-bcrypt';
