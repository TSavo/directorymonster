// Simple Hash Circuit
// This circuit implements a simple hash function for demonstration purposes

template SimpleHash() {
    signal input a;
    signal input b;
    signal input c;
    signal output out;
    
    out <== a * (b + 1) + b * (c + 2) + c * (a + 3) + 42;
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
