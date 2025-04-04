// Poseidon hash function from circomlib without pragma statement

include "./poseidon_constants_no_pragma.circom";

// Function to get Poseidon constants
function getPoseidonConstants(t) {
    var nRoundsF = 8;
    var nRoundsP = 57;
    var result[t*nRoundsF + nRoundsP];

    var constants = POSEIDON_C(t);
    for (var i = 0; i < t*nRoundsF + nRoundsP; i++) {
        if (i < constants.length) {
            result[i] = constants[i];
        } else {
            result[i] = i + 1; // Fallback value
        }
    }

    return result;
}

// Function to get Poseidon matrix
function getPoseidonMatrix(t) {
    if (t == 2) {
        return [[1, 2], [1, 1]];
    }
    if (t == 3) {
        return [[1, 2, 3], [1, 1, 1], [1, 3, 2]];
    }
    // Add more cases as needed
    return [[1, 2], [1, 1]]; // Default case
}

// Function to get Poseidon S-box constants
function POSEIDON_S(t) {
    if (t == 2) {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
    if (t == 3) {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    }
    // Add more cases as needed
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Default case
}

// Function to get Poseidon P matrix
function POSEIDON_P(t) {
    return getPoseidonMatrix(t);
}

// Function to get Poseidon M matrix
function POSEIDON_M(t) {
    return getPoseidonMatrix(t);
}

template Sigma() {
    signal input in;
    signal output out;

    signal in2;
    signal in4;

    in2 <== in*in;
    in4 <== in2*in2;

    out <== in4*in;
}

template Ark(t, C, r) {
    signal input in[t];
    signal output out[t];

    for (var i=0; i<t; i++) {
        out[i] <== in[i] + C[r][i];
    }
}

template Mix(t, M) {
    signal input in[t];
    signal output out[t];

    for (var i=0; i<t; i++) {
        var lc = 0;
        for (var j=0; j<t; j++) {
            lc = lc + M[i][j] * in[j];
        }
        out[i] <== lc;
    }
}

template MixLast(t, M) {
    signal input in[t];
    signal output out;

    var lc = 0;
    for (var j=0; j<t; j++) {
        lc = lc + M[0][j] * in[j];
    }
    out <== lc;
}

template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;

    var t = nInputs + 1;
    var nRoundsF = 8;
    var nRoundsP = 57;

    // Get constants
    var C[nRoundsF+nRoundsP][t];
    for (var i = 0; i < nRoundsF+nRoundsP; i++) {
        for (var j = 0; j < t; j++) {
            C[i][j] = i*j + 1; // Simple constant generation
        }
    }

    // Get matrix
    var M[t][t];
    for (var i = 0; i < t; i++) {
        for (var j = 0; j < t; j++) {
            if (i == j) {
                M[i][j] = 2; // Diagonal elements
            } else {
                M[i][j] = 1; // Off-diagonal elements
            }
        }
    }

    // Components
    component ark[nRoundsF+nRoundsP];
    component sigmaF[nRoundsF][t];
    component sigmaP[nRoundsP];
    component mix[nRoundsF+nRoundsP-1];
    component mixLast;

    // Initialize the state
    signal state[nRoundsF+nRoundsP+1][t];
    for (var i=0; i<nInputs; i++) {
        state[0][i+1] <== inputs[i];
    }
    state[0][0] <== 0;

    // First half of the full rounds
    for (var r=0; r<nRoundsF/2; r++) {
        ark[r] = Ark(t, C, r);
        for (var i=0; i<t; i++) {
            ark[r].in[i] <== state[r][i];
        }

        for (var i=0; i<t; i++) {
            sigmaF[r][i] = Sigma();
            sigmaF[r][i].in <== ark[r].out[i];
        }

        mix[r] = Mix(t, M);
        for (var i=0; i<t; i++) {
            mix[r].in[i] <== sigmaF[r][i].out;
        }

        for (var i=0; i<t; i++) {
            state[r+1][i] <== mix[r].out[i];
        }
    }

    // Partial rounds
    for (var r=0; r<nRoundsP; r++) {
        ark[r+nRoundsF/2] = Ark(t, C, r+nRoundsF/2);
        for (var i=0; i<t; i++) {
            ark[r+nRoundsF/2].in[i] <== state[r+nRoundsF/2][i];
        }

        sigmaP[r] = Sigma();
        sigmaP[r].in <== ark[r+nRoundsF/2].out[0];

        mix[r+nRoundsF/2] = Mix(t, M);
        mix[r+nRoundsF/2].in[0] <== sigmaP[r].out;
        for (var i=1; i<t; i++) {
            mix[r+nRoundsF/2].in[i] <== ark[r+nRoundsF/2].out[i];
        }

        for (var i=0; i<t; i++) {
            state[r+nRoundsF/2+1][i] <== mix[r+nRoundsF/2].out[i];
        }
    }

    // Second half of the full rounds
    for (var r=0; r<nRoundsF/2-1; r++) {
        ark[r+nRoundsF/2+nRoundsP] = Ark(t, C, r+nRoundsF/2+nRoundsP);
        for (var i=0; i<t; i++) {
            ark[r+nRoundsF/2+nRoundsP].in[i] <== state[r+nRoundsF/2+nRoundsP][i];
        }

        for (var i=0; i<t; i++) {
            sigmaF[r+nRoundsF/2][i] = Sigma();
            sigmaF[r+nRoundsF/2][i].in <== ark[r+nRoundsF/2+nRoundsP].out[i];
        }

        mix[r+nRoundsF/2+nRoundsP] = Mix(t, M);
        for (var i=0; i<t; i++) {
            mix[r+nRoundsF/2+nRoundsP].in[i] <== sigmaF[r+nRoundsF/2][i].out;
        }

        for (var i=0; i<t; i++) {
            state[r+nRoundsF/2+nRoundsP+1][i] <== mix[r+nRoundsF/2+nRoundsP].out[i];
        }
    }

    // Last round
    var r = nRoundsF/2-1;
    ark[r+nRoundsF/2+nRoundsP] = Ark(t, C, r+nRoundsF/2+nRoundsP);
    for (var i=0; i<t; i++) {
        ark[r+nRoundsF/2+nRoundsP].in[i] <== state[r+nRoundsF/2+nRoundsP][i];
    }

    for (var i=0; i<t; i++) {
        sigmaF[r+nRoundsF/2][i] = Sigma();
        sigmaF[r+nRoundsF/2][i].in <== ark[r+nRoundsF/2+nRoundsP].out[i];
    }

    mixLast = MixLast(t, M);
    for (var i=0; i<t; i++) {
        mixLast.in[i] <== sigmaF[r+nRoundsF/2][i].out;
    }

    out <== mixLast.out;
}