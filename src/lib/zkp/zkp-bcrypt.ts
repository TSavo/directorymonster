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
 * Get the bcrypt work factor from environment variables or use default
 * @returns The bcrypt work factor to use
 */
export function getBcryptWorkFactor(): number {
  return parseInt(process.env.BCRYPT_WORK_FACTOR || '10', 10);
}

/**
 * Generates a bcrypt hash for the provided password.
 *
 * If the number of salt rounds is not specified, the default work factor from the environment (or 10) is used.
 *
 * @param password - The password to hash.
 * @param saltRounds - Optional. The number of salt rounds to use for hashing.
 * @returns A promise that resolves to the generated bcrypt hash.
 */
export async function hashPassword(password: string, saltRounds?: number): Promise<string> {
  // Use provided saltRounds or get from environment
  const rounds = saltRounds || getBcryptWorkFactor();
  // Directly call bcrypt.hash to ensure it's properly tracked by spies in tests
  return bcrypt.hash(password, rounds);
}

/**
 * Verify a password against a bcrypt hash
 * @param password The password to verify
 * @param hash The bcrypt hash to verify against
 * @returns A promise that resolves to true if the password matches the hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a Zero-Knowledge Proof (ZKP) by first hashing a plaintext password with bcrypt and then combining it with a username and salt.
 *
 * This function asynchronously hashes the provided password using a configurable bcrypt work factor, constructs a ZKP input object with the username, hashed password, and salt, and then uses the ZKP provider's adapter to generate the proof.
 *
 * @param username - The username associated with the proof.
 * @param password - The plaintext password to be hashed.
 * @param salt - The salt used in creating the proof.
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
 * Verifies a Zero-Knowledge Proof (ZKP) using a stored bcrypt hash.
 *
 * The function retrieves a ZKP adapter from the provider and uses it to verify that the provided proof and its associated public signals match the stored bcrypt hash, which is used as the public key for verification.
 *
 * @param proof - The ZKP proof to be verified.
 * @param publicSignals - The public signals corresponding to the proof.
 * @param storedHash - The stored bcrypt hash used as the public key during verification.
 * @returns A promise that resolves to true if the proof is valid, or false otherwise.
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
 * Generate a salt for use with bcrypt
 * @param rounds The number of rounds to use (defaults to environment variable or 10)
 * @returns A promise that resolves to a bcrypt salt
 */
export async function generateBcryptSalt(rounds?: number): Promise<string> {
  // Use provided rounds or get from environment
  const saltRounds = rounds || getBcryptWorkFactor();
  // Use async genSalt to avoid blocking the event loop
  return bcrypt.genSalt(saltRounds);
}
