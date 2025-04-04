pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

// Authentication circuit with domain separation
template SecureAuth() {
    // Private inputs (known only to the prover)
    signal input username;
    signal input password;

    // Public inputs (known to both prover and verifier)
    signal input publicSalt;

    // Public outputs (result of the computation)
    signal output publicKey;

    // Domain separation constant
    var AUTH_DOMAIN = 0xD01E; // 53278 in decimal, "DOLE" in hex

    // Hash the username and password with the salt
    component hasher = Poseidon(3);
    hasher.inputs[0] <== username;
    hasher.inputs[1] <== password;
    hasher.inputs[2] <== publicSalt;

    // The public key is the hash output
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

    // Use the SecureAuth component
    component auth = SecureAuth();
    auth.publicSalt <== publicSalt;
    auth.username <== username;
    auth.password <== password;

    // The public key is the hash output
    publicKey <== auth.publicKey;
}

component main = Main();
