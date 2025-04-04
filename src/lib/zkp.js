// ZKP (Zero-Knowledge Proof) Library
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate a public key from credentials
 * @param {string} username - The username
 * @param {string} password - The password
 * @param {string} salt - The salt
 * @returns {Promise<string>} - The public key
 */
async function generatePublicKey(username, password, salt) {
  // Combine the inputs
  const combined = `${username}:${password}:${salt}`;

  // Create a SHA-256 hash
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Generate a ZKP proof for authentication
 * @param {string} username - The username
 * @param {string} password - The password
 * @param {string} salt - The salt
 * @returns {Promise<{proof: object, publicSignals: string[]}>} - The proof and public signals
 */
async function generateProof(username, password, salt) {
  try {
    // Get the circuit paths
    const circuitWasmPath = path.join(process.cwd(), 'circuits/zkp_auth/simple_auth_output/simple_auth_js/simple_auth.wasm');
    const zkeyPath = path.join(process.cwd(), 'circuits/zkp_auth/simple_auth_output/simple_auth_final.zkey');

    // Ensure the circuit files exist
    if (!fs.existsSync(circuitWasmPath) || !fs.existsSync(zkeyPath)) {
      throw new Error('Circuit files not found. Please compile the circuits first.');
    }

    // Generate the public key
    const publicKey = await generatePublicKey(username, password, salt);

    // Create the witness input
    const input = {
      username: stringToHex(username),
      password: stringToHex(password),
      salt: stringToHex(salt),
      timestamp: Date.now().toString()
    };

    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      circuitWasmPath,
      zkeyPath
    );

    return { proof, publicSignals };
  } catch (error) {
    console.error('Error generating proof:', error);
    throw error;
  }
}

/**
 * Verify a ZKP proof
 * @param {object} proof - The proof
 * @param {string[]} publicSignals - The public signals
 * @returns {Promise<boolean>} - Whether the proof is valid
 */
async function verifyProof(proof, publicSignals) {
  try {
    // Get the verification key
    const vKeyPath = path.join(process.cwd(), 'circuits/zkp_auth/simple_auth_output/verification_key.json');

    // Ensure the verification key exists
    if (!fs.existsSync(vKeyPath)) {
      throw new Error('Verification key not found. Please compile the circuits first.');
    }

    // Load the verification key
    const vKey = JSON.parse(fs.readFileSync(vKeyPath));

    // Verify the proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    return isValid;
  } catch (error) {
    console.error('Error verifying proof:', error);
    return false;
  }
}

/**
 * Convert a string to hex
 * @param {string} str - The string to convert
 * @returns {string} - The hex representation
 */
function stringToHex(str) {
  return '0x' + Buffer.from(str, 'utf8').toString('hex');
}

module.exports = {
  generateProof,
  verifyProof,
  generatePublicKey
};
