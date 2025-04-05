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
 * Generates a Zero-Knowledge Proof (ZKP) using bcrypt for secure password hashing.
 *
 * This function processes the provided username, plaintext password, and salt to produce a
 * ZKP. By integrating bcrypt for password hashing, it ensures that sensitive authentication
 * details are protected. The resulting proof includes both the cryptographic proof and the
 * associated public signals needed for verification.
 *
 * @param username - The username associated with the proof.
 * @param password - The plaintext password for authentication.
 * @param salt - The salt used in hashing the password.
 * @returns A promise that resolves to a ZKP proof object containing the proof and its public signals.
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
 * Verifies the validity of a Zero-Knowledge Proof using bcrypt integration.
 *
 * This function checks the provided proof against the associated public signals and a bcrypt-hashed public key.
 *
 * @param proof - The Zero-Knowledge Proof to be verified.
 * @param publicSignals - The public signals generated alongside the proof.
 * @param publicKey - The bcrypt-hashed public key used for verification.
 * @returns A promise that resolves to true if the proof is valid, or false otherwise.
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
 * Generates a unique salt value.
 *
 * This function retrieves the adapter from the current ZKP provider and invokes its salt generation method.
 * The resulting salt is typically used in cryptographic operations within the Zero-Knowledge Proof authentication flow.
 *
 * @returns A string representing a unique salt.
 */
export function generateSalt(): string {
  const adapter = getZKPProvider().getAdapter();
  return adapter.generateSalt();
}

/**
 * Generates a public key from user credentials using bcrypt-based Zero-Knowledge Proofs.
 *
 * This asynchronous function first hashes the provided password with bcrypt. It then generates a zero-knowledge proof using the
 * username, the hashed password, and the provided salt, with the public key derived as the first entry from the returned public signals.
 * The resulting public key is intended for secure, server-side verification.
 *
 * @param username - The user's unique identifier.
 * @param password - The user's password.
 * @param salt - A unique salt value used to ensure proof distinctiveness.
 * @returns A promise resolving to the public key derived from the generated zero-knowledge proof.
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
 * Derives a public key from the given user credentials for server-side verification.
 *
 * This deprecated function is maintained for backward compatibility. It retrieves a ZKP adapter from the provider
 * to generate the public key based on the provided credentials.
 *
 * @param input - The user credentials required to derive the ZKP public key.
 * @returns The public key generated from the provided credentials.
 *
 * @deprecated Use generatePublicKey instead.
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
