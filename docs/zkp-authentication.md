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
8. [Security Improvements](#security-improvements)
9. [References](#references)

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
9. **Progressive Delays**: The system implements exponential backoff for login attempts.
10. **Audit Logging**: The system logs authentication events for security auditing.
11. **bcrypt Password Hashing**: The system uses bcrypt for secure password hashing before ZKP generation.
12. **CAPTCHA Integration**: The system requires CAPTCHA verification after multiple failed attempts.
13. **Replay Attack Prevention**: The system prevents replay attacks by binding proofs to specific sessions.
14. **Man-in-the-Middle Protection**: The system prevents MITM attacks through username verification.
15. **Concurrent Authentication**: The system supports multiple authentication requests simultaneously.

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
- Integration with bcrypt for secure password hashing
- Support for concurrent proof generation
- Protection against replay attacks

### Server-Side Implementation

The server-side implementation is written in TypeScript and uses the snarkjs library to verify proofs. The implementation includes:

- A function to verify proofs
- A function to retrieve the salt for a username
- A function to store the public key for a username
- A function to generate cryptographically secure salts
- Rate limiting, IP blocking, and exponential backoff for security
- Comprehensive audit logging for security events
- CAPTCHA verification after multiple failed attempts
- Protection against replay attacks
- Support for concurrent verification
- Integration with bcrypt for secure password verification

### Security Measures

The system implements the following security measures:

1. **Rate Limiting**: The system limits the number of login attempts per username.
2. **IP Blocking**: The system blocks IP addresses after too many failed attempts.
3. **Exponential Backoff**: The system implements exponential backoff for login attempts, doubling the delay after each failed attempt.
4. **CAPTCHA Verification**: The system requires CAPTCHA verification after a configurable threshold of failed attempts.
5. **Comprehensive Audit Logging**: The system logs all authentication events, security incidents, and ZKP verifications for security auditing.
6. **Dynamic Salt Generation**: Each user has a unique, cryptographically secure salt.
7. **Secure Password Reset**: The password reset flow uses secure tokens with expiration times.
8. **bcrypt Password Hashing**: The system uses bcrypt with configurable salt rounds for secure password hashing.
9. **Admin Bypass**: Administrators can bypass IP blocking for legitimate administrative purposes.
10. **Replay Attack Prevention**: The system prevents replay attacks by binding proofs to specific sessions.
11. **Man-in-the-Middle Protection**: The system prevents MITM attacks through username verification.
12. **Concurrent Authentication Support**: The system handles multiple authentication requests simultaneously without degradation.

## Testing Requirements

The ZKP authentication system must be tested to ensure it meets the following requirements:

1. **Correctness**: The system must correctly authenticate users who know the password.
2. **Security**: The system must reject authentication attempts with incorrect passwords.
3. **Zero-Knowledge**: The system must not reveal any information about the password.
4. **Performance**: The system must generate and verify proofs within acceptable time limits.
5. **Salt Generation**: The system must generate cryptographically secure salts.
6. **Rate Limiting**: The system must implement rate limiting correctly.
7. **IP Blocking**: The system must implement IP blocking correctly.
8. **Exponential Backoff**: The system must implement exponential backoff correctly.
9. **Audit Logging**: The system must log authentication events correctly.
10. **CAPTCHA Integration**: The system must require CAPTCHA verification after multiple failed attempts.
11. **bcrypt Integration**: The system must correctly hash passwords using bcrypt.
12. **Replay Attack Prevention**: The system must prevent replay attacks.
13. **Man-in-the-Middle Protection**: The system must prevent MITM attacks.
14. **Concurrent Authentication**: The system must handle multiple authentication requests simultaneously.
15. **Admin Bypass**: Administrators must be able to bypass IP blocking.

### Test Cases

1. **Valid Authentication**: Test that a user with the correct password can authenticate.
2. **Invalid Authentication**: Test that a user with an incorrect password cannot authenticate.
3. **Different Passwords**: Test that different passwords produce different public keys.
4. **Zero-Knowledge**: Test that the proof and public signals do not reveal the password.
5. **Performance**: Test that proof generation and verification are fast enough for practical use.
6. **Salt Generation**: Test that salts are cryptographically secure and random.
7. **Rate Limiting**: Test that rate limiting prevents brute force attacks.
8. **IP Blocking**: Test that IP blocking prevents brute force attacks.
9. **Exponential Backoff**: Test that exponential backoff prevents brute force attacks.
10. **Audit Logging**: Test that authentication events are logged correctly.
11. **Password Reset**: Test that the password reset flow works correctly.
12. **First User Setup**: Test that the first user setup flow works correctly.
13. **CAPTCHA Integration**: Test that CAPTCHA verification is required after multiple failed attempts.
14. **bcrypt Integration**: Test that passwords are correctly hashed using bcrypt.
15. **Replay Attack Prevention**: Test that replay attacks are prevented.
16. **Man-in-the-Middle Protection**: Test that MITM attacks are prevented.
17. **Concurrent Authentication**: Test that multiple authentication requests can be handled simultaneously.
18. **Admin Bypass**: Test that administrators can bypass IP blocking.
19. **Security Under Load**: Test that security measures remain effective under high load.
20. **ZKP with bcrypt**: Test that ZKP works correctly with bcrypt-hashed passwords.

## Performance Considerations

The ZKP authentication system must be optimized for performance to ensure a good user experience. The following performance considerations should be taken into account:

1. **Proof Generation Time**: The time to generate a proof should be less than 1 second.
2. **Proof Verification Time**: The time to verify a proof should be less than 100 milliseconds.
3. **Circuit Size**: The circuit should be as small as possible to minimize the time to generate and verify proofs.
4. **Memory Usage**: The memory usage should be minimized to ensure the system can run on resource-constrained devices.
5. **Caching**: The system should cache verification keys and other static data to improve performance.
6. **Parallelization**: The system should use parallelization where possible to improve performance.
7. **bcrypt Work Factor**: The bcrypt work factor should be balanced between security and performance.
8. **Concurrent Processing**: The system should handle multiple authentication requests concurrently.
9. **Progressive Enhancement**: The system should work even if JavaScript is disabled, falling back to traditional authentication.
10. **Resource Allocation**: The system should allocate resources efficiently to prevent denial-of-service attacks.
11. **Load Testing**: The system should be tested under high load to ensure it remains responsive.
12. **Mobile Performance**: The system should be optimized for mobile devices with limited resources.

## Security Improvements

The ZKP authentication system has undergone several security improvements to enhance its cryptographic properties and protect against various attacks. For detailed information about each improvement, refer to the following documentation:

1. [Password Hashing Improvements](./security/password-hashing.md) - Replacing SHA-256 with bcrypt for password hashing
2. [ZKP Circuit Privacy](./security/zkp-circuit-privacy.md) - Ensuring private inputs remain private in ZKP circuits
3. [TypeScript Type Definitions](./security/typescript-definitions.md) - Fixing reserved keyword issues in TypeScript definitions
4. [HTTP Headers Implementation](./security/http-headers.md) - Properly implementing HTTP headers for rate limiting
5. [Division by Zero Protection](./security/division-by-zero.md) - Adding protection against division by zero in Montgomery curve operations
6. [File Integrity Checks](./security/file-integrity.md) - Adding integrity checks for cryptographic files
7. [Poseidon Hash Constants](./security/poseidon-constants.md) - Implementing proper cryptographically secure constants
8. [Hash Truncation Fix](./security/hash-truncation.md) - Fixing hash truncation issues to use full hash values
9. [Poseidon Round Parameters](./security/poseidon-rounds.md) - Increasing round parameters for better security
10. [IP Blocking and Rate Limiting](../specs/security-improvements-zkp-auth.md#ip-blocking-and-rate-limiting) - Implementing IP blocking and rate limiting
11. [CAPTCHA Integration](../specs/security-improvements-zkp-auth.md#captcha-integration) - Adding CAPTCHA verification after multiple failed attempts
12. [Exponential Backoff](../specs/security-improvements-zkp-auth.md#exponential-backoff) - Implementing exponential backoff for login attempts
13. [Comprehensive Audit Logging](../specs/security-improvements-zkp-auth.md#audit-logging) - Adding detailed logging for security events
14. [Replay Attack Prevention](../specs/security-improvements-zkp-auth.md#replay-attack-prevention) - Preventing replay attacks
15. [Man-in-the-Middle Protection](../specs/security-improvements-zkp-auth.md#mitm-protection) - Preventing MITM attacks
16. [Concurrent Authentication Support](../specs/security-improvements-zkp-auth.md#concurrent-authentication) - Supporting multiple authentication requests

A comprehensive security checklist is available in [ZKP Security Checklist](./security/zkp-security-checklist.md).

## References

1. [Circom Documentation](https://docs.circom.io/)
2. [SnarkJS Documentation](https://github.com/iden3/snarkjs)
3. [Zero-Knowledge Proofs: An Illustrated Primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
4. [Introduction to zk-SNARKs](https://consensys.net/blog/blockchain-explained/zero-knowledge-proofs-starks-vs-snarks/)
5. [The Poseidon Hash Function](https://www.poseidon-hash.info/)
6. [Circomlib Poseidon Implementation](https://github.com/iden3/circomlib/blob/master/circuits/poseidon.circom)
7. [NIST Cryptographic Standards](https://csrc.nist.gov/Projects/Cryptographic-Standards-and-Guidelines)
8. [bcrypt: Password Security](https://en.wikipedia.org/wiki/Bcrypt)
9. [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
10. [CAPTCHA: Telling Humans and Computers Apart](https://www.captcha.net/)
11. [Rate Limiting and Brute Force Protection](https://owasp.org/www-community/controls/Rate_limiting)
12. [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)
13. [Replay Attack Prevention](https://en.wikipedia.org/wiki/Replay_attack)
14. [Man-in-the-Middle Attack Prevention](https://en.wikipedia.org/wiki/Man-in-the-middle_attack)
