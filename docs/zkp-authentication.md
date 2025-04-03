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
```

## Circuit Design

The ZKP authentication circuit is designed to:

1. Take the username, password, and salt as private inputs.
2. Take the salt as a public input.
3. Output a public key derived from the inputs.

### Circuit Implementation

The circuit uses a multi-round hashing approach with the following features:

- 8 rounds of hashing with different prime multipliers
- Domain separation to prevent length extension attacks
- Non-linear mixing in each round
- Final mixing and squaring for additional security

```
// Simplified circuit representation
template SecureAuth() {
    // Private inputs
    signal input username;
    signal input password;
    
    // Public inputs
    signal input publicSalt;
    
    // Public outputs
    signal output publicKey;
    
    // Multi-round hashing implementation
    // ...
    
    // Final output
    publicKey <== finalHash;
}
```

## Authentication Flow

The authentication flow consists of the following steps:

1. **Registration**:
   - User provides username and password
   - System generates a random salt
   - System computes the public key using the ZKP circuit
   - System stores the username, salt, and public key (but not the password)

2. **Authentication**:
   - User provides username and password
   - System retrieves the salt for the username
   - Client generates a proof that it knows the password that corresponds to the public key
   - Server verifies the proof without learning the password

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

## Implementation Details

### Circuit Implementation

The circuit is implemented in Circom and compiled to WebAssembly for execution in the browser. The circuit uses a multi-round hashing approach with the following features:

- 8 rounds of hashing with different prime multipliers
- Domain separation to prevent length extension attacks
- Non-linear mixing in each round
- Final mixing and squaring for additional security

### Client-Side Implementation

The client-side implementation is written in JavaScript and uses the snarkjs library to generate proofs. The implementation includes:

- A function to generate proofs
- A function to verify proofs
- A function to export proofs for use in Solidity contracts

### Server-Side Implementation

The server-side implementation is written in JavaScript and uses the snarkjs library to verify proofs. The implementation includes:

- A function to verify proofs
- A function to retrieve the salt for a username
- A function to store the public key for a username

## Testing Requirements

The ZKP authentication system must be tested to ensure it meets the following requirements:

1. **Correctness**: The system must correctly authenticate users who know the password.
2. **Security**: The system must reject authentication attempts with incorrect passwords.
3. **Zero-Knowledge**: The system must not reveal any information about the password.
4. **Performance**: The system must generate and verify proofs within acceptable time limits.

### Test Cases

1. **Valid Authentication**: Test that a user with the correct password can authenticate.
2. **Invalid Authentication**: Test that a user with an incorrect password cannot authenticate.
3. **Different Passwords**: Test that different passwords produce different public keys.
4. **Zero-Knowledge**: Test that the proof and public signals do not reveal the password.
5. **Performance**: Test that proof generation and verification are fast enough for practical use.

## Performance Considerations

The ZKP authentication system must be optimized for performance to ensure a good user experience. The following performance considerations should be taken into account:

1. **Proof Generation Time**: The time to generate a proof should be less than 1 second.
2. **Proof Verification Time**: The time to verify a proof should be less than 100 milliseconds.
3. **Circuit Size**: The circuit should be as small as possible to minimize the time to generate and verify proofs.
4. **Memory Usage**: The memory usage should be minimized to ensure the system can run on resource-constrained devices.

## References

1. [Circom Documentation](https://docs.circom.io/)
2. [SnarkJS Documentation](https://github.com/iden3/snarkjs)
3. [Zero-Knowledge Proofs: An Illustrated Primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
4. [Introduction to zk-SNARKs](https://consensys.net/blog/blockchain-explained/zero-knowledge-proofs-starks-vs-snarks/)
5. [The Poseidon Hash Function](https://www.poseidon-hash.info/)
