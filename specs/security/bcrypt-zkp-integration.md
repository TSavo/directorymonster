# bcrypt-ZKP Integration Specification

## Overview

This specification outlines the integration of bcrypt password hashing with the Zero-Knowledge Proof (ZKP) authentication system in DirectoryMonster. This integration enhances security by adding an additional layer of protection for user passwords.

## Table of Contents

1. [Background](#background)
2. [Design Goals](#design-goals)
3. [Implementation Details](#implementation-details)
4. [Security Properties](#security-properties)
5. [Performance Considerations](#performance-considerations)
6. [Testing Requirements](#testing-requirements)
7. [Deployment Considerations](#deployment-considerations)

## Background

The existing ZKP authentication system allows users to prove they know their password without revealing it to the server. While this provides strong security guarantees, adding bcrypt password hashing before ZKP generation provides defense in depth:

1. If the ZKP system is compromised, passwords remain protected by bcrypt
2. Bcrypt's work factor can be adjusted as hardware improves
3. Industry-standard password hashing algorithm with proven security properties

## Design Goals

The bcrypt-ZKP integration aims to achieve the following goals:

1. **Defense in Depth**: Add an additional layer of security to the authentication system
2. **Configurable Security**: Allow adjustment of bcrypt work factor as hardware improves
3. **Backward Compatibility**: Maintain compatibility with existing authentication flows
4. **Performance Optimization**: Minimize impact on authentication performance
5. **Secure Implementation**: Follow best practices for cryptographic implementations

## Implementation Details

### Core Components

The bcrypt-ZKP integration consists of the following components:

1. **zkp-bcrypt.ts**: Core module that provides bcrypt integration with ZKP
2. **worker-pool.ts**: Worker pool for concurrent processing of authentication requests
3. **captcha-service.ts**: CAPTCHA verification service for additional security
4. **ip-blocker.ts**: IP blocking service for preventing brute force attacks
5. **progressive-delay.ts**: Exponential backoff for failed login attempts

### Key Functions

#### Password Hashing

```typescript
/**
 * Generate a bcrypt hash for a password
 * @param password The password to hash
 * @param saltRounds The number of salt rounds to use (defaults to environment variable or 10)
 * @returns A promise that resolves to the bcrypt hash
 */
export async function hashPassword(password: string, saltRounds?: number): Promise<string> {
  // Use provided saltRounds or get from environment
  const rounds = saltRounds || getBcryptWorkFactor();
  // Directly call bcrypt.hash to ensure it's properly tracked by spies in tests
  return bcrypt.hash(password, rounds);
}
```

#### ZKP Generation with bcrypt

```typescript
/**
 * Generate a ZKP proof using bcrypt for the password
 * @param username The username
 * @param password The password
 * @param salt The salt
 * @returns A promise that resolves to the ZKP proof
 */
export async function generateZKPWithBcrypt(
  username: string,
  password: string,
  salt: string
): Promise<ZKPProof> {
  // Hash the password with bcrypt using the configurable work factor
  const hashedPassword = await hashPassword(password);

  // Generate a ZKP proof using the hashed password
  const input: ZKPInput = {
    username,
    password: hashedPassword, // Use the hashed password
    salt
  };

  const adapter = getZKPProvider().getAdapter();
  return adapter.generateProof(input);
}
```

#### ZKP Verification with bcrypt

```typescript
/**
 * Verify a ZKP proof with bcrypt
 * @param proof The proof to verify
 * @param publicSignals The public signals
 * @param storedHash The stored bcrypt hash
 * @returns A promise that resolves to true if the proof is valid
 */
export async function verifyZKPWithBcrypt(
  proof: unknown,
  publicSignals: unknown,
  storedHash: string
): Promise<boolean> {
  const adapter = getZKPProvider().getAdapter();
  return adapter.verifyProof({
    proof,
    publicSignals,
    publicKey: storedHash
  });
}
```

### Configuration

The bcrypt work factor is configurable through environment variables:

```
BCRYPT_WORK_FACTOR=12  # Default is 10 if not specified
```

## Security Properties

The bcrypt-ZKP integration provides the following security properties:

1. **Defense in Depth**: If the ZKP system is compromised, passwords remain protected by bcrypt
2. **Adaptive Security**: Bcrypt's work factor can be adjusted as hardware improves
3. **Industry Standard**: Bcrypt is a well-established password hashing algorithm
4. **Configurable Security**: Work factor can be adjusted based on security requirements
5. **Full Hash Values**: No truncation of hash values for maximum security
6. **Cryptographic Isolation**: Separate cryptographic domains for bcrypt and ZKP
7. **Secure Defaults**: Reasonable default values for security parameters
8. **Fail Secure**: System fails securely when components are unavailable

## Performance Considerations

The bcrypt-ZKP integration has the following performance considerations:

1. **CPU Intensive**: Bcrypt is designed to be CPU intensive, which may impact authentication performance
2. **Worker Pool**: A worker pool is used to process authentication requests concurrently
3. **Configurable Work Factor**: The bcrypt work factor can be adjusted based on hardware capabilities
4. **Caching**: Public keys are cached to minimize bcrypt operations
5. **Graceful Degradation**: System degrades gracefully under high load

## Testing Requirements

The bcrypt-ZKP integration requires the following tests:

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test the integration of bcrypt with ZKP
3. **Security Tests**: Test security properties of the implementation
4. **Performance Tests**: Test performance impact of bcrypt integration
5. **Concurrency Tests**: Test concurrent authentication requests
6. **Edge Case Tests**: Test edge cases and error handling

## Deployment Considerations

When deploying the bcrypt-ZKP integration, consider the following:

1. **Work Factor**: Choose an appropriate work factor based on hardware capabilities
2. **Monitoring**: Monitor authentication performance and adjust work factor as needed
3. **Gradual Rollout**: Roll out the integration gradually to minimize impact
4. **Fallback**: Provide a fallback mechanism in case of issues
5. **Documentation**: Document the integration for developers and administrators
