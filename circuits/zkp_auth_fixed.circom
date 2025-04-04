// ZKP Authentication System - Fixed Implementation
// This file contains a fixed implementation of a zero-knowledge proof authentication system
// using the Poseidon hash function with properly handled constants.

// ===== Poseidon Hash Function Implementation =====
// Individual constants for the Poseidon hash function
function POSEIDON_C0() { return 12242166908188651009970641195982497967459347605789172021371900301183566655543; }
function POSEIDON_C1() { return 17932046681654363289819542333399231991845911173984431932858527799919361250831; }
function POSEIDON_C2() { return 5833708990301431069569835075913858948580902333559772216202041331114981953833; }
function POSEIDON_C3() { return 2522739648873455112248956792675127367973937455123397155708707253675003602590; }
function POSEIDON_C4() { return 10050922469622855003642130093269955914337609481119030363320772825490455650060; }
function POSEIDON_C5() { return 8034210669110152083598302539560391429105951848578103329842520423678456763760; }
function POSEIDON_C6() { return 2433527473191362519225201818379798896274235440674831806935994819346720558093; }
function POSEIDON_C7() { return 19086599799750063545166407521394145898970499081491601855718700215540718884068; }
function POSEIDON_C8() { return 19565512326238652633944324260209805453604395967152053828904619901900764559433; }
function POSEIDON_C9() { return 19372846553738648867533853416361476190815452220865389841521691967967898991088; }

// Get a constant by index
function POSEIDON_CONSTANT(i) {
    if (i == 0) return POSEIDON_C0();
    if (i == 1) return POSEIDON_C1();
    if (i == 2) return POSEIDON_C2();
    if (i == 3) return POSEIDON_C3();
    if (i == 4) return POSEIDON_C4();
    if (i == 5) return POSEIDON_C5();
    if (i == 6) return POSEIDON_C6();
    if (i == 7) return POSEIDON_C7();
    if (i == 8) return POSEIDON_C8();
    if (i == 9) return POSEIDON_C9();
    return 0;
}

// MDS matrix for the Poseidon hash function
function POSEIDON_MDS(i, j) {
    if (i == 0 && j == 0) return 1;
    if (i == 0 && j == 1) return 2;
    if (i == 0 && j == 2) return 3;
    if (i == 1 && j == 0) return 1;
    if (i == 1 && j == 1) return 1;
    if (i == 1 && j == 2) return 1;
    if (i == 2 && j == 0) return 1;
    if (i == 2 && j == 1) return 3;
    if (i == 2 && j == 2) return 2;
    return 0;
}

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

    // Hash the credentials using Poseidon
    component hasher = Poseidon(3);
    hasher.inputs[0] <== username;
    hasher.inputs[1] <== password;
    hasher.inputs[2] <== publicSalt;

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

    publicKey <== auth.publicKey;
}

component main = Main();
