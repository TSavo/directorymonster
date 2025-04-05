/**
 * ZKP-Bcrypt Integration
 *
 * This module provides integration between the ZKP system and bcrypt for password hashing.
 * It allows for secure password verification without exposing the actual password.
 */

import * as bcrypt from 'bcrypt';
import { ZKPInput, ZKPProof } from './adapter';
import { getZKPProvider } from './provider';

/**
 * Retrieves the work factor for bcrypt hashing from the environment configuration.
 *
 * This function reads the 'BCRYPT_WORK_FACTOR' environment variable and converts it to a base-10 number.
 * If the environment variable is not set, it defaults to a work factor of 10.
 *
 * @returns The numeric work factor for bcrypt operations.
 */
export function getBcryptWorkFactor(): number {
  return parseInt(process.env.BCRYPT_WORK_FACTOR || '10', 10);
}

/**
 * Generate a bcrypt hash for a password
 * @param password The password to hash
 * @param saltRounds The number of salt rounds to use (defaults to environment variable or 10)
 * @returns A promise that resolves to the bcrypt hash
 */
export async function hashPassword(password: string, saltRounds?: number): Promise<string> {
  // Use provided saltRounds or get from environment
  const rounds = saltRounds || getBcryptWorkFactor();
  // Directly call bcrypt.hash to ensure it's properly tracked by spies in tests
  return bcrypt.hash(password, rounds);
}

/**
 * Asynchronously verifies if a plaintext password matches the provided bcrypt hash.
 *
 * @param password - The plaintext password to verify.
 * @param hash - The bcrypt hash to compare against.
 * @returns A promise that resolves to a boolean, where true indicates a match and false otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a zero-knowledge proof (ZKP) for a user based on their credentials.
 *
 * This function hashes the provided plaintext password using bcrypt with a configurable
 * work factor, then creates a ZKP input object including the username, hashed password, and salt.
 * It retrieves the current ZKP provider's adapter and generates the corresponding proof.
 *
 * @param username - The unique identifier for the user.
 * @param password - The plaintext password which is securely hashed.
 * @param salt - The cryptographic salt used during password hashing.
 * @returns A promise that resolves to the generated ZKP proof.
 */
export async function generateZKPWithBcrypt(
  username: string,
  password: string,
  salt: string
): Promise<ZKPProof> {
  // Hash the password with bcrypt using the configurable work factor
  const hashedPassword = await hashPassword(password);

  // Generate a ZKP proof using the hashed password
  const input: ZKPInput = {
    username,
    password: hashedPassword, // Use the hashed password
    salt
  };

  const adapter = getZKPProvider().getAdapter();
  return adapter.generateProof(input);
}

/**
 * Verifies a Zero-Knowledge Proof (ZKP) using bcrypt.
 *
 * This asynchronous function delegates the verification to the ZKP provider's adapter. It validates
 * the provided proof and associated public signals against a stored bcrypt hash (used as the public key)
 * and returns a boolean indicating the proof's validity.
 *
 * @param proof - The ZKP proof to verify.
 * @param publicSignals - The public signals required for verification.
 * @param storedHash - The stored bcrypt hash that acts as the public key in the verification process.
 * @returns A promise that resolves to a boolean indicating whether the provided proof is valid.
 */
export async function verifyZKPWithBcrypt(
  proof: unknown,
  publicSignals: unknown,
  storedHash: string
): Promise<boolean> {
  const adapter = getZKPProvider().getAdapter();
  return adapter.verifyProof({
    proof,
    publicSignals,
    publicKey: storedHash
  });
}

/**
 * Generates a bcrypt salt.
 *
 * If the number of rounds is not provided, the function retrieves the default work factor from the environment (defaulting to 10).
 *
 * @param rounds - Optional number of rounds to use in salt generation.
 * @returns A promise that resolves to the generated bcrypt salt.
 */
export async function generateBcryptSalt(rounds?: number): Promise<string> {
  // Use provided rounds or get from environment
  const saltRounds = rounds || getBcryptWorkFactor();
  // Use async genSalt to avoid blocking the event loop
  return bcrypt.genSalt(saltRounds);
}
