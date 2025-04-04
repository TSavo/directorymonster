// Poseidon Hash Envelope
// This file provides a simple envelope around the circomlib Poseidon hash function

// Include our no-pragma Poseidon hash function
include "./poseidon_no_pragma.circom";

// Simple envelope for the Poseidon hash function
// This template takes an array of inputs and returns the Poseidon hash
template PoseidonHash(nInputs) {
    // Input signals
    signal input in[nInputs];

    // Output signal
    signal output out;

    // Use our no-pragma Poseidon hash function
    component poseidon = Poseidon(nInputs);

    // Connect the inputs
    for (var i = 0; i < nInputs; i++) {
        poseidon.inputs[i] <== in[i];
    }

    // Connect the output
    out <== poseidon.out;
}
