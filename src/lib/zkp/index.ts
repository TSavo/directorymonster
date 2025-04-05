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
 * Generates a zero-knowledge proof with integrated bcrypt password hashing.
 *
 * This function creates a secure proof for authentication by combining the user's credentials
 * with a unique salt. The password is securely hashed using bcrypt, ensuring that it is never
 * transmitted in plain text. The resulting proof encapsulates the hashed value, which can be
 * later verified without direct exposure of the actual password.
 *
 * @param username - The user's unique identifier.
 * @param password - The user's raw password.
 * @param salt - A unique salt to augment the password hashing process.
 * @returns A promise that resolves to a ZKPProof used for secure authentication.
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
 * Generates a unique salt value using the current Zero-Knowledge Proof (ZKP) provider.
 *
 * This salt is intended for use in cryptographic operations, including secure password hashing and public key generation
 * within the ZKP-based authentication system.
 *
 * @returns A unique salt value.
 */
export function generateSalt(): string {
  const adapter = getZKPProvider().getAdapter();
  return adapter.generateSalt();
}

/**
 * Derives a public key from user credentials.
 *
 * This function first hashes the provided password using bcrypt and then generates a Zero-Knowledge Proof (ZKP)
 * from the username, hashed password, and salt. The public key is extracted from the first element of the proof's
 * public signals and is used for server-side verification.
 *
 * @param username - The user's identifier.
 * @param password - The user's plaintext password.
 * @param salt - A salt value used to ensure the uniqueness of the hashed password.
 * @returns A promise that resolves to the derived public key.
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
 * Derives a public key from the provided user credentials.
 *
 * The derived public key is used for server-side verification.
 *
 * @deprecated Use generatePublicKey instead.
 * @param input - The user credentials for deriving the public key.
 * @returns The public key derived from the given credentials.
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
