// Simple Poseidon Hash Implementation
// This file contains a simplified implementation of the Poseidon hash function

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

// Round constants
function RC(i) {
    if (i == 0) return 101;
    if (i == 1) return 102;
    if (i == 2) return 103;
    if (i == 3) return 104;
    if (i == 4) return 105;
    if (i == 5) return 106;
    if (i == 6) return 107;
    if (i == 7) return 108;
    if (i == 8) return 109;
    if (i == 9) return 110;
    if (i == 10) return 111;
    if (i == 11) return 112;
    if (i == 12) return 113;
    if (i == 13) return 114;
    if (i == 14) return 115;
    if (i == 15) return 116;
    if (i == 16) return 117;
    if (i == 17) return 118;
    if (i == 18) return 119;
    if (i == 19) return 120;
    return 0;
}

// MDS matrix
function MDS(i, j) {
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

// MDS matrix multiplication
template Mix(t) {
    signal input in[t];
    signal output out[t];
    
    for (var i = 0; i < t; i++) {
        var sum = 0;
        for (var j = 0; j < t; j++) {
            sum += in[j] * MDS(i, j);
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
    
    // Components
    component sboxes[nRoundsF + nRoundsP][t];
    component mixes[nRoundsF + nRoundsP];
    
    // Initialize components
    for (var i = 0; i < nRoundsF + nRoundsP; i++) {
        mixes[i] = Mix(t);
        for (var j = 0; j < t; j++) {
            sboxes[i][j] = Sbox();
        }
    }
    
    // State
    signal state[nRoundsF + nRoundsP + 1][t];
    for (var j = 0; j < t; j++) {
        state[0][j] <== in[j];
    }
    
    // Full rounds
    for (var i = 0; i < nRoundsF; i++) {
        // Add constants and apply S-box
        for (var j = 0; j < t; j++) {
            var constIdx = i * t + j;
            var constVal = RC(constIdx);
            sboxes[i][j].in <== state[i][j] + constVal;
        }
        
        // Apply MDS matrix
        for (var j = 0; j < t; j++) {
            mixes[i].in[j] <== sboxes[i][j].out;
        }
        
        // Update state
        for (var j = 0; j < t; j++) {
            state[i+1][j] <== mixes[i].out[j];
        }
    }
    
    // Partial rounds (only apply S-box to first element)
    for (var i = nRoundsF; i < nRoundsF + nRoundsP; i++) {
        // Apply S-box to first element only
        var constIdx1 = i * t;
        var constVal1 = RC(constIdx1);
        sboxes[i][0].in <== state[i][0] + constVal1;
        
        // Pass through other elements with constants
        for (var j = 1; j < t; j++) {
            var constIdx2 = i * t + j;
            var constVal2 = RC(constIdx2);
            sboxes[i][j].in <== state[i][j] + constVal2;
        }
        
        // Apply MDS matrix
        for (var j = 0; j < t; j++) {
            mixes[i].in[j] <== sboxes[i][j].out;
        }
        
        // Update state
        for (var j = 0; j < t; j++) {
            state[i+1][j] <== mixes[i].out[j];
        }
    }
    
    // Output
    for (var j = 0; j < t; j++) {
        out[j] <== state[nRoundsF + nRoundsP][j];
    }
}

// Poseidon hash function
template SimplePoseidon(nInputs) {
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

// Authentication circuit
template SecureAuth() {
    // Private inputs (known only to the prover)
    signal input username;
    signal input password;
    
    // Public inputs (known to both prover and verifier)
    signal input publicSalt;
    
    // Public outputs (result of the computation)
    signal output publicKey;
    
    // Hash the credentials using the simple Poseidon hash function
    component hasher = SimplePoseidon(3);
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
