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
 * Generate a bcrypt hash for a password
 * @param password The password to hash
 * @param saltRounds The number of salt rounds to use (default: 10)
 * @returns A promise that resolves to the bcrypt hash
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  // Directly call bcrypt.hash to ensure it's properly tracked by spies in tests
  return bcrypt.hash(password, saltRounds);
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
 * Generate a ZKP proof using bcrypt for the password
 * @param username The username
 * @param password The password
 * @param salt The salt
 * @returns A promise that resolves to the ZKP proof
 */
export async function generateZKPWithBcrypt(
  username: string,
  password: string,
  salt: string
): Promise<ZKPProof> {
  // Hash the password with bcrypt - explicitly call bcrypt.hash to ensure spies work
  const hashedPassword = await bcrypt.hash(password, 10);

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
 * Verify a ZKP proof with bcrypt
 * @param proof The proof to verify
 * @param publicSignals The public signals
 * @param storedHash The stored bcrypt hash
 * @returns A promise that resolves to true if the proof is valid
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
 * @param rounds The number of rounds to use (default: 10)
 * @returns A bcrypt salt
 */
export function generateBcryptSalt(rounds: number = 10): string {
  // Directly call genSaltSync to ensure it's properly tracked by spies in tests
  return bcrypt.genSaltSync(rounds);
}
