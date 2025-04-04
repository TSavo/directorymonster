// Simple Authentication Circuit
// This file provides a simple authentication circuit using the Poseidon hash envelope

// Include the Poseidon hash envelope
include "./poseidon_envelope.circom";

// Simple authentication template
template SimpleAuth() {
    // Private inputs (known only to the prover)
    signal input username;
    signal input password;
    
    // Public inputs (known to both prover and verifier)
    signal input publicSalt;
    
    // Public outputs (result of the computation)
    signal output publicKey;
    
    // Create an array of inputs for the hash function
    signal inputs[3];
    inputs[0] <== username;
    inputs[1] <== password;
    inputs[2] <== publicSalt;
    
    // Use the Poseidon hash envelope
    component hasher = PoseidonHash(3);
    
    // Connect the inputs
    for (var i = 0; i < 3; i++) {
        hasher.in[i] <== inputs[i];
    }
    
    // The public key is the hash output
    publicKey <== hasher.out;
}

// Main component
component main = SimpleAuth();
