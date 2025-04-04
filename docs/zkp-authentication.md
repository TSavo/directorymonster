# Zero-Knowledge Proof Authentication Specification

## Overview

This document specifies the Zero-Knowledge Proof (ZKP) authentication system implemented in DirectoryMonster. The system allows users to prove they know their password without revealing it, providing a secure authentication mechanism that protects user credentials even in the event of a server compromise.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Circuit Design](#circuit-design)
3. [Authentication Flow](#authentication-flow)
4. [Security Properties](#security-properties)
5. [Implementation Details](#implementation-details)
6. [Testing Requirements](#testing-requirements)
7. [Performance Considerations](#performance-considerations)
8. [References](#references)

## System Architecture

The ZKP authentication system consists of the following components:

1. **Circuit**: A mathematical representation of the authentication logic, implemented in Circom.
2. **Prover**: Client-side code that generates proofs using the circuit.
3. **Verifier**: Server-side code that verifies proofs without learning the password.
4. **Key Management**: System for generating and managing proving and verification keys.
5. **Salt Management**: System for generating and retrieving cryptographically secure salts.

### Component Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │────▶│    Prover   │────▶│  Verifier   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Password   │     │   Circuit   │     │    Keys     │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          │                   │
                          │                   │
                          ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │             │     │             │
                    │    Salt    │     │   Redis     │
                    │             │     │             │
                    └─────────────┘     └─────────────┘
```

## Circuit Design

The ZKP authentication circuit is designed to:

1. Take the username, password, and salt as private inputs.
2. Take the salt as a public input.
3. Output a public key derived from the inputs.

### Circuit Implementation

The circuit uses the Poseidon hash function from circomlib with the following features:

- Cryptographically secure Poseidon hash function
- Domain separation to prevent length extension attacks
- Non-linear mixing through the Poseidon S-box
- Proper MDS matrix for diffusion

```circom
// Actual circuit implementation
pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template ZKPAuth() {
    // Private inputs
    signal input username;
    signal input password;
    signal input salt;

    // Public inputs
    signal input publicSalt;

    // Public outputs
    signal output publicKey;

    // Verify salt matches public salt
    publicSalt === salt;

    // Use Poseidon hash for secure hashing
    component hasher = Poseidon(3);
    hasher.inputs[0] <== username;
    hasher.inputs[1] <== password;
    hasher.inputs[2] <== salt;

    // Output the public key
    publicKey <== hasher.out;
}

component main {public [publicSalt]} = ZKPAuth();
```

## Authentication Flow

The authentication flow consists of the following steps:

1. **First User Setup**:
   - First user provides username and password
   - System generates a cryptographically secure random salt
   - System computes the public key using the ZKP circuit
   - System stores the username, salt, and public key (but not the password)

2. **User Registration**:
   - User provides username and password
   - System generates a cryptographically secure random salt
   - System computes the public key using the ZKP circuit
   - System stores the username, salt, and public key (but not the password)

3. **Authentication**:
   - User provides username and password
   - System retrieves the salt for the username
   - Client generates a proof that it knows the password that corresponds to the public key
   - Server verifies the proof without learning the password
   - System implements rate limiting, IP blocking, and progressive delays for security

4. **Password Reset**:
   - User requests password reset
   - System generates a reset token and sends it to the user's email
   - User provides new password and reset token
   - System verifies the reset token
   - System generates a new salt and public key
   - System updates the user's salt and public key

### Sequence Diagram

```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│         │                  │         │                  │         │
│  User   │                  │ Client  │                  │ Server  │
│         │                  │         │                  │         │
└────┬────┘                  └────┬────┘                  └────┬────┘
     │                            │                            │
     │ Enter username/password    │                            │
     │ -------------------------▶ │                            │
     │                            │                            │
     │                            │ Request salt               │
     │                            │ -------------------------▶ │
     │                            │                            │
     │                            │ Return salt                │
     │                            │ ◀------------------------- │
     │                            │                            │
     │                            │ Generate proof             │
     │                            │ ----------------------┐    │
     │                            │                       │    │
     │                            │ ◀---------------------┘    │
     │                            │                            │
     │                            │ Send proof                 │
     │                            │ -------------------------▶ │
     │                            │                            │
     │                            │                            │ Verify proof
     │                            │                            │ -----------┐
     │                            │                            │            │
     │                            │                            │ ◀----------┘
     │                            │                            │
     │                            │ Authentication result      │
     │                            │ ◀------------------------- │
     │                            │                            │
     │ Authentication result      │                            │
     │ ◀------------------------- │                            │
     │                            │                            │
```

## Security Properties

The ZKP authentication system provides the following security properties:

1. **Zero-Knowledge**: The server learns nothing about the password during authentication.
2. **Soundness**: It is computationally infeasible to generate a valid proof without knowing the password.
3. **Completeness**: A user who knows the password can always generate a valid proof.
4. **Forward Secrecy**: If a password is compromised, previous authentication sessions remain secure.
5. **Domain Separation**: The system prevents length extension attacks through domain separation.
6. **Dynamic Salt Generation**: Each user has a unique, cryptographically secure salt.
7. **Rate Limiting**: The system implements rate limiting to prevent brute force attacks.
8. **IP Blocking**: The system blocks IP addresses after too many failed attempts.
9. **Progressive Delays**: The system implements progressive delays for login attempts.
10. **Audit Logging**: The system logs authentication events for security auditing.

## Implementation Details

### Circuit Implementation

The circuit is implemented in Circom and compiled to WebAssembly for execution in the browser. The circuit uses the Poseidon hash function from circomlib with the following features:

- Cryptographically secure Poseidon hash function
- Domain separation to prevent length extension attacks
- Non-linear mixing through the Poseidon S-box
- Proper MDS matrix for diffusion

### Client-Side Implementation

The client-side implementation is written in TypeScript and uses the snarkjs library to generate proofs. The implementation includes:

- A function to generate proofs
- A function to verify proofs
- A function to derive public keys from username, password, and salt
- A function to generate cryptographically secure salts

### Server-Side Implementation

The server-side implementation is written in TypeScript and uses the snarkjs library to verify proofs. The implementation includes:

- A function to verify proofs
- A function to retrieve the salt for a username
- A function to store the public key for a username
- A function to generate cryptographically secure salts
- Rate limiting, IP blocking, and progressive delays for security
- Audit logging for security events

### Security Measures

The system implements the following security measures:

1. **Rate Limiting**: The system limits the number of login attempts per username.
2. **IP Blocking**: The system blocks IP addresses after too many failed attempts.
3. **Progressive Delays**: The system implements progressive delays for login attempts.
4. **CAPTCHA Verification**: The system requires CAPTCHA verification after a few failed attempts.
5. **Audit Logging**: The system logs authentication events for security auditing.
6. **Dynamic Salt Generation**: Each user has a unique, cryptographically secure salt.
7. **Secure Password Reset**: The password reset flow uses secure tokens with expiration times.

## Testing Requirements

The ZKP authentication system must be tested to ensure it meets the following requirements:

1. **Correctness**: The system must correctly authenticate users who know the password.
2. **Security**: The system must reject authentication attempts with incorrect passwords.
3. **Zero-Knowledge**: The system must not reveal any information about the password.
4. **Performance**: The system must generate and verify proofs within acceptable time limits.
5. **Salt Generation**: The system must generate cryptographically secure salts.
6. **Rate Limiting**: The system must implement rate limiting correctly.
7. **IP Blocking**: The system must implement IP blocking correctly.
8. **Progressive Delays**: The system must implement progressive delays correctly.
9. **Audit Logging**: The system must log authentication events correctly.

### Test Cases

1. **Valid Authentication**: Test that a user with the correct password can authenticate.
2. **Invalid Authentication**: Test that a user with an incorrect password cannot authenticate.
3. **Different Passwords**: Test that different passwords produce different public keys.
4. **Zero-Knowledge**: Test that the proof and public signals do not reveal the password.
5. **Performance**: Test that proof generation and verification are fast enough for practical use.
6. **Salt Generation**: Test that salts are cryptographically secure and random.
7. **Rate Limiting**: Test that rate limiting prevents brute force attacks.
8. **IP Blocking**: Test that IP blocking prevents brute force attacks.
9. **Progressive Delays**: Test that progressive delays prevent brute force attacks.
10. **Audit Logging**: Test that authentication events are logged correctly.
11. **Password Reset**: Test that the password reset flow works correctly.
12. **First User Setup**: Test that the first user setup flow works correctly.

## Performance Considerations

The ZKP authentication system must be optimized for performance to ensure a good user experience. The following performance considerations should be taken into account:

1. **Proof Generation Time**: The time to generate a proof should be less than 1 second.
2. **Proof Verification Time**: The time to verify a proof should be less than 100 milliseconds.
3. **Circuit Size**: The circuit should be as small as possible to minimize the time to generate and verify proofs.
4. **Memory Usage**: The memory usage should be minimized to ensure the system can run on resource-constrained devices.
5. **Caching**: The system should cache verification keys and other static data to improve performance.
6. **Parallelization**: The system should use parallelization where possible to improve performance.

## References

1. [Circom Documentation](https://docs.circom.io/)
2. [SnarkJS Documentation](https://github.com/iden3/snarkjs)
3. [Zero-Knowledge Proofs: An Illustrated Primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
4. [Introduction to zk-SNARKs](https://consensys.net/blog/blockchain-explained/zero-knowledge-proofs-starks-vs-snarks/)
5. [The Poseidon Hash Function](https://www.poseidon-hash.info/)
6. [Circomlib Poseidon Implementation](https://github.com/iden3/circomlib/blob/master/circuits/poseidon.circom)
