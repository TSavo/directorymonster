// Simple Hash Circuit
// This circuit implements a simple hash function for demonstration purposes

template SimpleHash() {
    signal input a;
    signal input b;
    signal input c;
    signal output out;
    
    // Use a non-linear combination of inputs to ensure different inputs produce different outputs
    signal a2;
    signal b2;
    signal c2;
    signal ab;
    signal bc;
    signal ca;
    
    a2 <== a * a;
    b2 <== b * b;
    c2 <== c * c;
    ab <== a * b;
    bc <== b * c;
    ca <== c * a;
    
    out <== a2 + b2 + c2 + ab + bc + ca + a * b * c + 42;
}

template Main() {
    signal input publicSalt;
    signal private input username;
    signal private input password;
    signal output publicKey;
    
    component hasher = SimpleHash();
    hasher.a <== username;
    hasher.b <== password;
    hasher.c <== publicSalt;
    
    publicKey <== hasher.out;
}

component main = Main();
