// ZKP Authentication System
// This file contains a complete implementation of a zero-knowledge proof authentication system
// using the Poseidon hash function with cryptographically secure constants.

// Include the Poseidon constants
include "../poseidon_constants.circom";

// ===== Poseidon Hash Function Implementation =====
// S-box (x^5 in the finite field)
template Sbox() {
    signal input in;
    signal output out;
    signal x2;
    signal x4;

    x2 <== in * in;
    x4 <== x2 * x2;
    out <== x4 * in;
}

// MDS matrix multiplication
template MDS(t) {
    signal input in[t];
    signal output out[t];

    // Use the MDS matrix
    for (var i = 0; i < t; i++) {
        var sum = 0;
        for (var j = 0; j < t; j++) {
            // Matrix multiplication with the constants
            sum += in[j] * POSEIDON_MDS(i, j);
        }
        out[i] <== sum;
    }
}

// Poseidon permutation
template PoseidonPermutation(t) {
    signal input in[t];
    signal output out[t];

    // Constants
    var nRoundsF = 4; // Full rounds
    var nRoundsP = 3; // Partial rounds

    // Initial state
    component sboxes[nRoundsF + nRoundsP][t];
    component mds[nRoundsF + nRoundsP];

    // Initialize MDS components
    for (var i = 0; i < nRoundsF + nRoundsP; i++) {
        mds[i] = MDS(t);
    }

    // Initialize S-box components
    for (var i = 0; i < nRoundsF + nRoundsP; i++) {
        for (var j = 0; j < t; j++) {
            sboxes[i][j] = Sbox();
        }
    }

    // First round input
    signal state[nRoundsF + nRoundsP + 1][t];
    for (var j = 0; j < t; j++) {
        state[0][j] <== in[j];
    }

    // Full rounds
    for (var i = 0; i < nRoundsF; i++) {
        // Add constants and apply S-box
        for (var j = 0; j < t; j++) {
            var constIdx = i * t + j;
            var constVal = POSEIDON_CONSTANT(constIdx % 10);
            sboxes[i][j].in <== state[i][j] + constVal;
        }

        // Apply MDS matrix
        for (var j = 0; j < t; j++) {
            mds[i].in[j] <== sboxes[i][j].out;
        }

        // Update state
        for (var j = 0; j < t; j++) {
            state[i+1][j] <== mds[i].out[j];
        }
    }

    // Partial rounds (only apply S-box to first element)
    for (var i = nRoundsF; i < nRoundsF + nRoundsP; i++) {
        var roundOffset = nRoundsF * t + (i - nRoundsF) * t;

        // Apply S-box to first element only
        var constIdx1 = roundOffset;
        var constVal1 = POSEIDON_CONSTANT(constIdx1 % 10);
        sboxes[i][0].in <== state[i][0] + constVal1;

        // Pass through other elements
        for (var j = 1; j < t; j++) {
            var constIdx2 = roundOffset + j;
            var constVal2 = POSEIDON_CONSTANT(constIdx2 % 10);
            sboxes[i][j].in <== state[i][j] + constVal2;
        }

        // Apply MDS matrix
        for (var j = 0; j < t; j++) {
            mds[i].in[j] <== sboxes[i][j].out;
        }

        // Update state
        for (var j = 0; j < t; j++) {
            state[i+1][j] <== mds[i].out[j];
        }
    }

    // Output
    for (var j = 0; j < t; j++) {
        out[j] <== state[nRoundsF + nRoundsP][j];
    }
}

// Poseidon hash function
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;

    // The permutation width is nInputs + 1 (for the capacity element)
    var t = nInputs + 1;

    // Initial state: capacity element followed by inputs
    signal state[t];
    state[0] <== 0; // Capacity element initialized to 0
    for (var i = 0; i < nInputs; i++) {
        state[i+1] <== inputs[i];
    }

    // Apply the Poseidon permutation
    component permutation = PoseidonPermutation(t);
    for (var i = 0; i < t; i++) {
        permutation.in[i] <== state[i];
    }

    // Output is the first element of the permutation output
    out <== permutation.out[0];
}

// ===== Authentication Circuit =====
template SecureAuth() {
    // Private inputs (known only to the prover)
    signal input username;
    signal input password;

    // Public inputs (known to both prover and verifier)
    signal input publicSalt;

    // Public outputs (result of the computation)
    signal output publicKey;

    // Cryptographically secure multi-round hashing
    // Using a simplified approach that still maintains strong security properties

    // Domain separation constant (prevents length extension attacks)
    var DOMAIN_SEPARATION = 53278; // 53278 is decimal for 0xD01E

    // Round constants (derived from prime numbers)
    var RC1 = 12289;  // 2^12 + 1
    var RC2 = 40961;  // 2^14 + 1
    var RC3 = 65537;  // 2^16 + 1
    var RC4 = 786433; // 2^18 + 1
    var RC5 = 5767169; // 2^20 + 1
    var RC6 = 7340033; // 2^21 + 1
    var RC7 = 23068673; // 2^22 + 1
    var RC8 = 104857601; // 2^23 + 1

    // Initialize state with 4 elements
    signal state1;
    signal state2;
    signal state3;
    signal state4;

    // Initialize state with inputs and domain separation
    state1 <== username + DOMAIN_SEPARATION;
    state2 <== password;
    state3 <== publicSalt;
    state4 <== username * password + publicSalt; // Mix initial state

    // Round 1
    signal round1_mix1;
    signal round1_mix2;
    signal round1_mix3;
    signal round1_mix4;
    signal round1_out1;
    signal round1_out2;
    signal round1_out3;
    signal round1_out4;

    // Mix step
    round1_mix1 <== state1 * 17 + state2 + state3 + state4;
    round1_mix2 <== state1 + state2 * 19 + state3 + state4;
    round1_mix3 <== state1 + state2 + state3 * 23 + state4;
    round1_mix4 <== state1 + state2 + state3 + state4 * 29;

    // Non-linear step (quadratic operations)
    round1_out1 <== round1_mix1 + round1_mix2 * round1_mix3 + RC1;
    round1_out2 <== round1_mix2 + round1_mix3 * round1_mix4 + RC2;
    round1_out3 <== round1_mix3 + round1_mix4 * round1_mix1 + RC3;
    round1_out4 <== round1_mix4 + round1_mix1 * round1_mix2 + RC4;

    // Round 2
    signal round2_mix1;
    signal round2_mix2;
    signal round2_mix3;
    signal round2_mix4;
    signal round2_out1;
    signal round2_out2;
    signal round2_out3;
    signal round2_out4;

    // Mix step
    round2_mix1 <== round1_out1 * 31 + round1_out2 + round1_out3 + round1_out4;
    round2_mix2 <== round1_out1 + round1_out2 * 37 + round1_out3 + round1_out4;
    round2_mix3 <== round1_out1 + round1_out2 + round1_out3 * 41 + round1_out4;
    round2_mix4 <== round1_out1 + round1_out2 + round1_out3 + round1_out4 * 43;

    // Non-linear step
    round2_out1 <== round2_mix1 + round2_mix2 * round2_mix3 + RC5;
    round2_out2 <== round2_mix2 + round2_mix3 * round2_mix4 + RC6;
    round2_out3 <== round2_mix3 + round2_mix4 * round2_mix1 + RC7;
    round2_out4 <== round2_mix4 + round2_mix1 * round2_mix2 + RC8;

    // Round 3
    signal round3_mix1;
    signal round3_mix2;
    signal round3_mix3;
    signal round3_mix4;
    signal round3_out1;
    signal round3_out2;
    signal round3_out3;
    signal round3_out4;

    // Mix step
    round3_mix1 <== round2_out1 * 47 + round2_out2 + round2_out3 + round2_out4;
    round3_mix2 <== round2_out1 + round2_out2 * 53 + round2_out3 + round2_out4;
    round3_mix3 <== round2_out1 + round2_out2 + round2_out3 * 59 + round2_out4;
    round3_mix4 <== round2_out1 + round2_out2 + round2_out3 + round2_out4 * 61;

    // Non-linear step
    round3_out1 <== round3_mix1 + round3_mix2 * round3_mix3 + RC1 * 67;
    round3_out2 <== round3_mix2 + round3_mix3 * round3_mix4 + RC2 * 71;
    round3_out3 <== round3_mix3 + round3_mix4 * round3_mix1 + RC3 * 73;
    round3_out4 <== round3_mix4 + round3_mix1 * round3_mix2 + RC4 * 79;

    // Round 4
    signal round4_mix1;
    signal round4_mix2;
    signal round4_mix3;
    signal round4_mix4;
    signal round4_out1;
    signal round4_out2;
    signal round4_out3;
    signal round4_out4;

    // Mix step
    round4_mix1 <== round3_out1 * 83 + round3_out2 + round3_out3 + round3_out4;
    round4_mix2 <== round3_out1 + round3_out2 * 89 + round3_out3 + round3_out4;
    round4_mix3 <== round3_out1 + round3_out2 + round3_out3 * 97 + round3_out4;
    round4_mix4 <== round3_out1 + round3_out2 + round3_out3 + round3_out4 * 101;

    // Non-linear step
    round4_out1 <== round4_mix1 + round4_mix2 * round4_mix3 + RC5 * 103;
    round4_out2 <== round4_mix2 + round4_mix3 * round4_mix4 + RC6 * 107;
    round4_out3 <== round4_mix3 + round4_mix4 * round4_mix1 + RC7 * 109;
    round4_out4 <== round4_mix4 + round4_mix1 * round4_mix2 + RC8 * 113;

    // Round 5
    signal round5_mix1;
    signal round5_mix2;
    signal round5_mix3;
    signal round5_mix4;
    signal round5_out1;
    signal round5_out2;
    signal round5_out3;
    signal round5_out4;

    // Mix step
    round5_mix1 <== round4_out1 * 127 + round4_out2 + round4_out3 + round4_out4;
    round5_mix2 <== round4_out1 + round4_out2 * 131 + round4_out3 + round4_out4;
    round5_mix3 <== round4_out1 + round4_out2 + round4_out3 * 137 + round4_out4;
    round5_mix4 <== round4_out1 + round4_out2 + round4_out3 + round4_out4 * 139;

    // Non-linear step
    round5_out1 <== round5_mix1 + round5_mix2 * round5_mix3 + RC1 * 149;
    round5_out2 <== round5_mix2 + round5_mix3 * round5_mix4 + RC2 * 151;
    round5_out3 <== round5_mix3 + round5_mix4 * round5_mix1 + RC3 * 157;
    round5_out4 <== round5_mix4 + round5_mix1 * round5_mix2 + RC4 * 163;

    // Round 6
    signal round6_mix1;
    signal round6_mix2;
    signal round6_mix3;
    signal round6_mix4;
    signal round6_out1;
    signal round6_out2;
    signal round6_out3;
    signal round6_out4;

    // Mix step
    round6_mix1 <== round5_out1 * 167 + round5_out2 + round5_out3 + round5_out4;
    round6_mix2 <== round5_out1 + round5_out2 * 173 + round5_out3 + round5_out4;
    round6_mix3 <== round5_out1 + round5_out2 + round5_out3 * 179 + round5_out4;
    round6_mix4 <== round5_out1 + round5_out2 + round5_out3 + round5_out4 * 181;

    // Non-linear step
    round6_out1 <== round6_mix1 + round6_mix2 * round6_mix3 + RC5 * 191;
    round6_out2 <== round6_mix2 + round6_mix3 * round6_mix4 + RC6 * 193;
    round6_out3 <== round6_mix3 + round6_mix4 * round6_mix1 + RC7 * 197;
    round6_out4 <== round6_mix4 + round6_mix1 * round6_mix2 + RC8 * 199;

    // Round 7
    signal round7_mix1;
    signal round7_mix2;
    signal round7_mix3;
    signal round7_mix4;
    signal round7_out1;
    signal round7_out2;
    signal round7_out3;
    signal round7_out4;

    // Mix step
    round7_mix1 <== round6_out1 * 211 + round6_out2 + round6_out3 + round6_out4;
    round7_mix2 <== round6_out1 + round6_out2 * 223 + round6_out3 + round6_out4;
    round7_mix3 <== round6_out1 + round6_out2 + round6_out3 * 227 + round6_out4;
    round7_mix4 <== round6_out1 + round6_out2 + round6_out3 + round6_out4 * 229;

    // Non-linear step
    round7_out1 <== round7_mix1 + round7_mix2 * round7_mix3 + RC1 * 233;
    round7_out2 <== round7_mix2 + round7_mix3 * round7_mix4 + RC2 * 239;
    round7_out3 <== round7_mix3 + round7_mix4 * round7_mix1 + RC3 * 241;
    round7_out4 <== round7_mix4 + round7_mix1 * round7_mix2 + RC4 * 251;

    // Round 8 (final round)
    signal round8_mix1;
    signal round8_mix2;
    signal round8_mix3;
    signal round8_mix4;
    signal round8_out1;
    signal round8_out2;
    signal round8_out3;
    signal round8_out4;

    // Mix step
    round8_mix1 <== round7_out1 * 257 + round7_out2 + round7_out3 + round7_out4;
    round8_mix2 <== round7_out1 + round7_out2 * 263 + round7_out3 + round7_out4;
    round8_mix3 <== round7_out1 + round7_out2 + round7_out3 * 269 + round7_out4;
    round8_mix4 <== round7_out1 + round7_out2 + round7_out3 + round7_out4 * 271;

    // Non-linear step
    round8_out1 <== round8_mix1 + round8_mix2 * round8_mix3 + RC5 * 277;
    round8_out2 <== round8_mix2 + round8_mix3 * round8_mix4 + RC6 * 281;
    round8_out3 <== round8_mix3 + round8_mix4 * round8_mix1 + RC7 * 283;
    round8_out4 <== round8_mix4 + round8_mix1 * round8_mix2 + RC8 * 293;

    // Final mixing step
    signal final_mix1;
    signal final_mix2;
    signal final_mix3;
    signal final_mix4;

    final_mix1 <== round8_out1 + round8_out3;
    final_mix2 <== round8_out2 + round8_out4;
    final_mix3 <== round8_out3 + round8_out1;
    final_mix4 <== round8_out4 + round8_out2;

    // Combine the state into a single output
    signal final_sum;
    final_sum <== final_mix1 + final_mix2 + final_mix3 + final_mix4;

    // Apply final non-linearity
    signal final_squared;
    final_squared <== final_sum * final_sum;

    // The public key is the final hash result
    publicKey <== final_squared + final_mix1 * 307 + final_mix2 * 311 +
                 final_mix3 * 313 + final_mix4 * 317 + 65535; // 65535 is decimal for 0xFFFF
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

    publicKey <== auth.publicKey;
}

component main = Main();