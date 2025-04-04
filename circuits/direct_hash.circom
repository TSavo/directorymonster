// Direct Hash Implementation
// This file contains a direct implementation of a hash function for ZKP authentication

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
    
    // Use a simple MDS matrix
    for (var i = 0; i < t; i++) {
        var sum = 0;
        for (var j = 0; j < t; j++) {
            // Matrix multiplication with constants
            if (i == 0 && j == 0) sum += in[j] * 1;
            else if (i == 0 && j == 1) sum += in[j] * 2;
            else if (i == 0 && j == 2) sum += in[j] * 3;
            else if (i == 1 && j == 0) sum += in[j] * 1;
            else if (i == 1 && j == 1) sum += in[j] * 1;
            else if (i == 1 && j == 2) sum += in[j] * 1;
            else if (i == 2 && j == 0) sum += in[j] * 1;
            else if (i == 2 && j == 1) sum += in[j] * 3;
            else if (i == 2 && j == 2) sum += in[j] * 2;
            else sum += in[j];
        }
        out[i] <== sum;
    }
}

// Round constants
function RC0() { return 101; }
function RC1() { return 102; }
function RC2() { return 103; }
function RC3() { return 104; }
function RC4() { return 105; }
function RC5() { return 106; }
function RC6() { return 107; }
function RC7() { return 108; }
function RC8() { return 109; }
function RC9() { return 110; }
function RC10() { return 111; }
function RC11() { return 112; }
function RC12() { return 113; }
function RC13() { return 114; }
function RC14() { return 115; }
function RC15() { return 116; }
function RC16() { return 117; }
function RC17() { return 118; }
function RC18() { return 119; }
function RC19() { return 120; }

// Get a round constant by index
function RC(i) {
    if (i == 0) return RC0();
    if (i == 1) return RC1();
    if (i == 2) return RC2();
    if (i == 3) return RC3();
    if (i == 4) return RC4();
    if (i == 5) return RC5();
    if (i == 6) return RC6();
    if (i == 7) return RC7();
    if (i == 8) return RC8();
    if (i == 9) return RC9();
    if (i == 10) return RC10();
    if (i == 11) return RC11();
    if (i == 12) return RC12();
    if (i == 13) return RC13();
    if (i == 14) return RC14();
    if (i == 15) return RC15();
    if (i == 16) return RC16();
    if (i == 17) return RC17();
    if (i == 18) return RC18();
    if (i == 19) return RC19();
    return 0;
}

// Direct hash function
template DirectHash(nInputs) {
    signal input in[nInputs];
    signal output out;
    
    // The permutation width is nInputs + 1 (for the capacity element)
    var t = nInputs + 1;
    
    // Number of rounds
    var nRoundsF = 4; // Full rounds
    var nRoundsP = 3; // Partial rounds
    
    // Initial state: capacity element followed by inputs
    signal state[nRoundsF + nRoundsP + 1][t];
    state[0][0] <== 0; // Capacity element initialized to 0
    for (var i = 0; i < nInputs; i++) {
        state[0][i+1] <== in[i];
    }
    
    // S-box components
    component sboxes[nRoundsF + nRoundsP][t];
    for (var i = 0; i < nRoundsF + nRoundsP; i++) {
        for (var j = 0; j < t; j++) {
            sboxes[i][j] = Sbox();
        }
    }
    
    // MDS components
    component mds[nRoundsF + nRoundsP];
    for (var i = 0; i < nRoundsF + nRoundsP; i++) {
        mds[i] = MDS(t);
    }
    
    // Full rounds
    for (var i = 0; i < nRoundsF; i++) {
        // Add constants and apply S-box
        for (var j = 0; j < t; j++) {
            var constIdx = i * t + j;
            var constVal = RC(constIdx % 20);
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
        var constVal1 = RC(constIdx1 % 20);
        sboxes[i][0].in <== state[i][0] + constVal1;
        
        // Pass through other elements
        for (var j = 1; j < t; j++) {
            var constIdx2 = roundOffset + j;
            var constVal2 = RC(constIdx2 % 20);
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
    
    // Output is the first element of the permutation output
    out <== state[nRoundsF + nRoundsP][0];
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
    
    // Hash the credentials using the direct hash function
    signal inputs[3];
    inputs[0] <== username;
    inputs[1] <== password;
    inputs[2] <== publicSalt;
    
    component hasher = DirectHash(3);
    for (var i = 0; i < 3; i++) {
        hasher.in[i] <== inputs[i];
    }
    
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
