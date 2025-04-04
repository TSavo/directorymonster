// Secure ZKP Authentication System
// This file contains a secure implementation of a zero-knowledge proof authentication system
// using the Poseidon hash function from circomlib.

// Include the Poseidon hash function without pragma
include "./poseidon_no_pragma.circom";

// Authentication circuit with domain separation
template SecureAuth() {
    // Private inputs (known only to the prover)
    signal input username;
    signal input password;

    // Public inputs (known to both prover and verifier)
    signal input publicSalt;

    // Public outputs (result of the computation)
    signal output publicKey;

    // Domain separation constants
    // These constants ensure that hashes for different purposes cannot be reused
    var AUTH_DOMAIN = 0xD01E; // 53278 in decimal, "DOLE" in hex

    // Create an array of inputs for the hash function with domain separation
    // We use 4 inputs: domain, username, password, and salt
    component hasher = Poseidon(4);
    hasher.inputs[0] <== AUTH_DOMAIN; // Domain separation constant
    hasher.inputs[1] <== username;
    hasher.inputs[2] <== password;
    hasher.inputs[3] <== publicSalt;

    // The public key is the full hash output with domain separation
    publicKey <== hasher.out;
}

// Password reset circuit with domain separation
template SecurePasswordReset() {
    // Private inputs (known only to the prover)
    signal input oldPassword;
    signal input newPassword;

    // Public inputs (known to both prover and verifier)
    signal input username;
    signal input publicSalt;
    signal input oldPublicKey;

    // Public outputs (result of the computation)
    signal output newPublicKey;

    // Domain separation constants
    // These constants ensure that hashes for different purposes cannot be reused
    var AUTH_DOMAIN = 0xD01E; // 53278 in decimal, "DOLE" in hex
    var RESET_DOMAIN = 0xD02E; // 53294 in decimal, "DO.E" in hex

    // Verify the old password using the same domain as authentication
    component oldHasher = Poseidon(4);
    oldHasher.inputs[0] <== AUTH_DOMAIN; // Same domain as authentication
    oldHasher.inputs[1] <== username;
    oldHasher.inputs[2] <== oldPassword;
    oldHasher.inputs[3] <== publicSalt;

    // Check that the old hash matches the provided public key
    oldPublicKey === oldHasher.out;

    // Generate the new public key with a different domain for password reset
    component newHasher = Poseidon(4);
    newHasher.inputs[0] <== RESET_DOMAIN; // Different domain for password reset
    newHasher.inputs[1] <== username;
    newHasher.inputs[2] <== newPassword;
    newHasher.inputs[3] <== publicSalt;

    // The new public key is the hash of the new credentials with domain separation
    newPublicKey <== newHasher.out;
}

// Main component with public inputs/outputs specified for authentication
// This component uses domain separation for secure hashing
template Main() {
    // Public inputs
    signal input publicSalt;

    // Private inputs
    signal private input username;
    signal private input password;

    // Public outputs
    signal output publicKey;

    // Use the SecureAuth component with domain separation
    component auth = SecureAuth();
    auth.publicSalt <== publicSalt;
    auth.username <== username;
    auth.password <== password;

    // The public key is the full hash output with domain separation
    publicKey <== auth.publicKey;
}

component main = Main();
