// Mock ZKP Adapter for testing
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ZKPAdapter, ZKPInput, ZKPProof } from './adapter';

export class MockZKPAdapter implements ZKPAdapter {
  /**
   * Generate a salt for the ZKP
   * @returns The generated salt
   */
  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Derive a public key from the credentials
   * @param input - The input containing username, password, and salt
   * @returns The derived public key
   */
  derivePublicKey(input: ZKPInput): string {
    const { username, password, salt } = input;

    // Combine the inputs
    const combined = `${username}:${password}`;

    // Use bcrypt for secure hashing
    // Option 1: Use the provided salt if available
    if (salt) {
      // If salt is a valid bcrypt salt format, use it directly
      if (salt.startsWith('$2b$') || salt.startsWith('$2a$')) {
        return bcrypt.hashSync(combined, salt);
      }

      // If salt is not in bcrypt format, generate a salt with specified rounds
      const saltRounds = 12;
      const bcryptSalt = bcrypt.genSaltSync(saltRounds);
      return bcrypt.hashSync(combined, bcryptSalt);
    }

    // Option 2: Generate a new salt with specified rounds
    const saltRounds = 12;
    const bcryptSalt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(combined, bcryptSalt);
  }

  /**
   * Generate a ZKP proof
   * @param input - The input containing username, password, and salt
   * @returns The proof and public signals
   */
  async generateProof(input: ZKPInput): Promise<ZKPProof> {
    const { username, password } = input;

    // Derive the public key
    const publicKey = this.derivePublicKey(input);

    // Create a timestamp for replay protection
    const timestamp = Date.now().toString();

    // Create a mock proof
    const proof = {
      pi_a: [
        crypto.createHash('sha256').update(`${username}:a`).digest('hex'),
        '2',
        '3',
      ],
      pi_b: [
        [
          '4',
          '5',
        ],
        [
          '6',
          '7',
        ],
        [
          '8',
          '9',
        ],
      ],
      pi_c: [
        crypto.createHash('sha256').update(`${password.length}:c`).digest('hex'),
        '11',
        '12',
      ],
      protocol: 'groth16',
      curve: 'bn128',
    };

    // Create the public signals
    const publicSignals = [
      publicKey,
      timestamp,
    ];

    return { proof, publicSignals };
  }

  /**
   * Verify a ZKP proof
   * @param params - The parameters containing proof, publicSignals, and publicKey
   * @returns Whether the proof is valid
   */
  async verifyProof(params: {
    proof: unknown;
    publicSignals: unknown;
    publicKey: string;
  }): Promise<boolean> {
    const { publicSignals, publicKey } = params;

    // In a real implementation, this would verify the proof cryptographically
    // For our mock, we just check that the public key matches
    return Array.isArray(publicSignals) && publicSignals[0] === publicKey;
  }
}
