// Basic Hash Circuit
// This circuit implements a very basic hash function for demonstration purposes

template BasicHash() {
    signal input a;
    signal input b;
    signal input c;
    signal output out;
    
    // Use a non-linear combination of inputs to ensure different inputs produce different outputs
    out <== a * 101 + b * 103 + c * 107 + a * b * 109 + b * c * 113 + c * a * 127 + a * b * c * 131 + 42;
}

template Main() {
    signal input publicSalt;
    signal private input username;
    signal private input password;
    signal output publicKey;
    
    component hasher = BasicHash();
    hasher.a <== username;
    hasher.b <== password;
    hasher.c <== publicSalt;
    
    publicKey <== hasher.out;
}

component main = Main();
