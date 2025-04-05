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
 * Retrieves the bcrypt work factor from the environment.
 *
 * This function reads the BCRYPT_WORK_FACTOR environment variable and converts it to an integer.
 * If the environment variable is not set or is empty, it defaults to 10.
 *
 * @returns The number of salt rounds to use for bcrypt hashing.
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
 * Verifies that a plaintext password matches a bcrypt hash.
 *
 * This function compares the provided plaintext password with the specified bcrypt hash and returns a boolean indicating whether they match.
 *
 * @param password - The plaintext password to verify.
 * @param hash - The bcrypt hash to compare against.
 * @returns A promise that resolves to true if the password matches the hash, or false otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a zero-knowledge proof (ZKP) for a user by securely hashing the password and incorporating it with a salt into the proof input.
 *
 * This function accepts a username, a plaintext password, and a salt to construct the input for generating a ZKP. It hashes the password using bcrypt (with a configurable work factor) and then uses the resulting hash, along with the username and salt, to generate the proof via the ZKP provider's adapter.
 *
 * @param username - The username for which the proof is generated.
 * @param password - The plaintext password to be securely hashed.
 * @param salt - A unique salt that is included in the proof input to enhance security.
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
 * Verifies a zero-knowledge proof using a stored bcrypt hash.
 *
 * This function retrieves a ZKP adapter from the provider and uses it to validate the provided proof along with its associated public signals. The stored bcrypt hash is utilized as the public key during the verification process.
 *
 * @param proof - The zero-knowledge proof to verify.
 * @param publicSignals - The public signals corresponding to the proof.
 * @param storedHash - The bcrypt hash used as the public key for verification.
 * @returns A promise that resolves to true if the proof is valid, otherwise false.
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
 * Generates a bcrypt salt using the specified salt rounds.
 * If rounds is not provided, the default work factor from the environment (or 10 if not set) is used.
 *
 * @param rounds Optional number of rounds for salt generation.
 * @returns A promise that resolves to the generated bcrypt salt.
 */
export async function generateBcryptSalt(rounds?: number): Promise<string> {
  // Use provided rounds or get from environment
  const saltRounds = rounds || getBcryptWorkFactor();
  // Use async genSalt to avoid blocking the event loop
  return bcrypt.genSalt(saltRounds);
}
