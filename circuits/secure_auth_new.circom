pragma circom 2.0.0;

// Secure Authentication Circuit using Poseidon Hash
// This circuit implements a secure authentication mechanism using the Poseidon hash function

// Include the Poseidon hash function from circomlib
include "./circomlib/index.circom";

template SecureAuth() {
    // Private inputs (known only to the prover)
    signal private input username;
    signal private input password;
    
    // Public inputs (known to both prover and verifier)
    signal input publicSalt;
    
    // Public outputs (result of the computation)
    signal output publicKey;
    
    // Verify that the provided salt matches the public salt
    // This ensures the prover is using the correct salt
    publicSalt === salt;
    
    // Hash the credentials using Poseidon
    // Poseidon is a ZKP-friendly hash function
    component hasher = Poseidon(3);
    hasher.inputs[0] <== username;
    hasher.inputs[1] <== password;
    hasher.inputs[2] <== salt;
    
    // The public key is the hash of the credentials
    publicKey <== hasher.out;
}

// Main component with public inputs/outputs specified
template Main() {
    // Public inputs
    signal input publicSalt;
    
    // Private inputs
    signal private input username;
    signal private input password;
    
    // Public outputs
    signal output publicKey;

    component auth = SecureAuth();
    auth.publicSalt <== publicSalt;
    auth.username <== username;
    auth.password <== password;
    auth.salt <== publicSalt;

    publicKey <== auth.publicKey;
}

component main = Main();
