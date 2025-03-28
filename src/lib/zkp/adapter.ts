/**
 * ZKP Adapter Interface
 * 
 * This interface defines the contract for all ZKP implementations.
 * It follows the adapter pattern to allow easy swapping of ZKP implementations.
 */

export interface ZKPInput {
  username: string;
  password: string;
  salt: string;
}

export interface ZKPProof {
  proof: string;
  publicSignals: string[];
}

export interface ZKPAdapter {
  /**
   * Generate a Zero-Knowledge Proof
   * @param input The input data (username, password, salt)
   * @returns A promise that resolves to the proof and public signals
   */
  generateProof(input: ZKPInput): Promise<ZKPProof>;
  
  /**
   * Verify a Zero-Knowledge Proof
   * @param proof The proof to verify
   * @param publicSignals Public signals that were generated with the proof
   * @param publicKey The user's public key to verify against
   * @returns A promise that resolves to true if verified, false otherwise
   */
  verifyProof(params: {
    proof: string;
    publicSignals: string[];
    publicKey: string;
  }): Promise<boolean>;
  
  /**
   * Generate a salt value for a new user
   * @returns A unique salt value
   */
  generateSalt(): string;
  
  /**
   * Derive a public key from user credentials
   * This is stored server-side for verification
   * @param input User credentials
   * @returns Public key derived from credentials
   */
  derivePublicKey(input: ZKPInput): string;
}

/**
 * ZKP Provider Interface
 * This is the factory interface for creating ZKP adapters
 */
export interface ZKPProvider {
  /**
   * Get the ZKP adapter implementation
   */
  getAdapter(): ZKPAdapter;
}
