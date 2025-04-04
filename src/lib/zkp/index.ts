/**
 * Zero-Knowledge Proof Library
 *
 * This library provides an adapter-based approach to zero-knowledge proofs,
 * allowing for easy swapping of ZKP implementations.
 *
 * The current implementation uses SnarkJS, which is a JavaScript implementation
 * of zk-SNARKs. In a production environment, you would use actual circuits
 * compiled with circom and the snarkjs library to generate and verify proofs.
 *
 * References:
 * - SnarkJS: https://github.com/iden3/snarkjs
 * - Circom: https://github.com/iden3/circom
 */

import { ZKPInput, ZKPProof } from './adapter';
import { getZKPProvider } from './provider';

/**
 * Generate a Zero-Knowledge Proof
 * @param input The input data (username, password, salt)
 * @returns A promise that resolves to the proof and public signals
 */
export async function generateProof(input: ZKPInput): Promise<ZKPProof> {
  const adapter = getZKPProvider().getAdapter();
  return adapter.generateProof(input);
}

/**
 * Verify a Zero-Knowledge Proof
 * @param proof The proof to verify
 * @param publicSignals Public signals that were generated with the proof
 * @param publicKey The user's public key to verify against
 * @returns A promise that resolves to true if verified, false otherwise
 */
export async function verifyProof(params: {
  proof: unknown;
  publicSignals: unknown;
  publicKey: string;
}): Promise<boolean> {
  const adapter = getZKPProvider().getAdapter();
  return adapter.verifyProof(params);
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
 * Derive a public key from user credentials
 * This is stored server-side for verification
 * @param input User credentials
 * @returns Public key derived from credentials
 */
export function derivePublicKey(input: ZKPInput): string {
  const adapter = getZKPProvider().getAdapter();
  return adapter.derivePublicKey(input);
}

// Re-export types for convenience
export type { ZKPInput, ZKPProof };
