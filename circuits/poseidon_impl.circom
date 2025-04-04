// Poseidon Hash Implementation
// Based on the circomlib implementation but without pragma statements

// Constants for the Poseidon hash function
// These are cryptographically secure constants

// Round constants (first 20 values)
function POSEIDON_C(i) {
    if (i == 0) return 7120861356467848435263064379192047478074060781135320967663101236819528304084;
    if (i == 1) return 5539312785075198557354652258644340762290565243015459581665646134883356819676;
    if (i == 2) return 4452545070552170934457806624615590388175057453238309765200376958922796492318;
    if (i == 3) return 20619701001583904760601357484951574588621083236087856586626117568842480512645;
    if (i == 4) return 11850545221552558303547173588125124828006126357476075962872363376248400233997;
    if (i == 5) return 19713202510669519426866310177312825271937466086904128252925352533328942320862;
    if (i == 6) return 5264193217346594809064230588854833106629213417005594054582509111154195395650;
    if (i == 7) return 1231591151615280608192413140395717193908728252038629016566149671951788269190;
    if (i == 8) return 9553119725196511425848532608217648389171130140745120866316531503596265056529;
    if (i == 9) return 15259285263926338628179075436720471020020809187037737947865589148333861569152;
    if (i == 10) return 4039943058228372953743649814308411183557535830720519004701103928801778893680;
    if (i == 11) return 5704522872489888737700976022757835738912741058839654112107899982592773774457;
    if (i == 12) return 13044723621858394071269693066186960698307328825539592026151509500013578075804;
    if (i == 13) return 2136440413434750981831553205676581275004277593221841892524260866484622520106;
    if (i == 14) return 17673438669013559335048227557138286866806854503071001482860570658513308348428;
    if (i == 15) return 1884432236084752996162055263322596548501358020407811502588859960321972092408;
    if (i == 16) return 18680675805324812742447807922462871923236588096257066125571809442435739313961;
    if (i == 17) return 8538152818178769072463056355125581814434328698465606536320553961284835462596;
    if (i == 18) return 21276534821184028276277876144085431587631541680476086141668824232305039672421;
    if (i == 19) return 11428659624289742973723014321882446379301279138599483927916297902018234744882;
    return 0;
}

// MDS matrix for t=3 (2 inputs + 1 capacity)
function POSEIDON_M(i, j) {
    if (i == 0 && j == 0) return 1;
    if (i == 0 && j == 1) return 2;
    if (i == 0 && j == 2) return 3;
    if (i == 1 && j == 0) return 1;
    if (i == 1 && j == 1) return 1;
    if (i == 1 && j == 2) return 1;
    if (i == 2 && j == 0) return 1;
    if (i == 2 && j == 1) return 3;
    if (i == 2 && j == 2) return 1;
    return 0;
}

// S-box (x^5 in the finite field)
template Sigma() {
    signal input in;
    signal output out;

    signal in2;
    signal in4;

    in2 <== in*in;
    in4 <== in2*in2;

    out <== in4*in;
}

// Add round constants
template Ark(t) {
    signal input in[t];
    signal input constants[t];
    signal output out[t];

    for (var i=0; i<t; i++) {
        out[i] <== in[i] + constants[i];
    }
}

// Mix layer (MDS matrix multiplication)
template Mix(t) {
    signal input in[t];
    signal output out[t];

    var lc;
    for (var i=0; i<t; i++) {
        lc = 0;
        for (var j=0; j<t; j++) {
            lc += POSEIDON_M(i, j)*in[j];
        }
        out[i] <== lc;
    }
}

// Poseidon permutation
template PoseidonPermutation(t) {
    signal input in[t];
    signal output out[t];
    
    // Constants
    var nRoundsF = 8; // Full rounds
    var nRoundsP = 57; // Partial rounds for t=3
    
    // Components
    component ark[nRoundsF + nRoundsP];
    component sigma[nRoundsF + nRoundsP][t];
    component mix[nRoundsF + nRoundsP];
    
    // State
    signal state[nRoundsF + nRoundsP + 1][t];
    for (var j = 0; j < t; j++) {
        state[0][j] <== in[j];
    }
    
    // Round constants for each round and position
    signal constants[nRoundsF + nRoundsP][t];
    for (var i = 0; i < nRoundsF + nRoundsP; i++) {
        for (var j = 0; j < t; j++) {
            constants[i][j] <== POSEIDON_C(i*t + j);
        }
    }
    
    // Initialize components
    for (var i = 0; i < nRoundsF + nRoundsP; i++) {
        ark[i] = Ark(t);
        mix[i] = Mix(t);
        for (var j = 0; j < t; j++) {
            sigma[i][j] = Sigma();
        }
    }
    
    // Full rounds (first half)
    for (var i = 0; i < nRoundsF/2; i++) {
        // Add round constants
        for (var j = 0; j < t; j++) {
            ark[i].in[j] <== state[i][j];
            ark[i].constants[j] <== constants[i][j];
        }
        
        // Apply S-box to all elements
        for (var j = 0; j < t; j++) {
            sigma[i][j].in <== ark[i].out[j];
        }
        
        // Mix layer
        for (var j = 0; j < t; j++) {
            mix[i].in[j] <== sigma[i][j].out;
        }
        
        // Update state
        for (var j = 0; j < t; j++) {
            state[i+1][j] <== mix[i].out[j];
        }
    }
    
    // Partial rounds (middle part)
    for (var i = nRoundsF/2; i < nRoundsF/2 + nRoundsP; i++) {
        // Add round constants
        for (var j = 0; j < t; j++) {
            ark[i].in[j] <== state[i][j];
            ark[i].constants[j] <== constants[i][j];
        }
        
        // Apply S-box to first element only
        sigma[i][0].in <== ark[i].out[0];
        
        // Identity for other elements
        for (var j = 1; j < t; j++) {
            sigma[i][j].in <== ark[i].out[j];
        }
        
        // Mix layer
        for (var j = 0; j < t; j++) {
            if (j == 0) {
                mix[i].in[j] <== sigma[i][j].out;
            } else {
                mix[i].in[j] <== sigma[i][j].in; // Skip S-box for non-first elements
            }
        }
        
        // Update state
        for (var j = 0; j < t; j++) {
            state[i+1][j] <== mix[i].out[j];
        }
    }
    
    // Full rounds (second half)
    for (var i = nRoundsF/2 + nRoundsP; i < nRoundsF + nRoundsP; i++) {
        // Add round constants
        for (var j = 0; j < t; j++) {
            ark[i].in[j] <== state[i][j];
            ark[i].constants[j] <== constants[i][j];
        }
        
        // Apply S-box to all elements
        for (var j = 0; j < t; j++) {
            sigma[i][j].in <== ark[i].out[j];
        }
        
        // Mix layer
        for (var j = 0; j < t; j++) {
            mix[i].in[j] <== sigma[i][j].out;
        }
        
        // Update state
        for (var j = 0; j < t; j++) {
            state[i+1][j] <== mix[i].out[j];
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

// Authentication circuit
template SecureAuth() {
    // Private inputs (known only to the prover)
    signal input username;
    signal input password;
    
    // Public inputs (known to both prover and verifier)
    signal input publicSalt;
    
    // Public outputs (result of the computation)
    signal output publicKey;
    
    // Hash the credentials using the Poseidon hash function
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
