# Zero-Knowledge Proof Authentication System

This directory contains the implementation of a Zero-Knowledge Proof (ZKP) authentication system for DirectoryMonster. The system allows users to prove their identity without ever sending their passwords to the server.

## Overview

The authentication system uses the [SnarkJS](https://github.com/iden3/snarkjs) library and [Circom](https://github.com/iden3/circom) circuits to implement ZKP generation and verification. We use an adapter pattern to make the implementation swappable, allowing for different ZKP libraries to be used in the future.

## Architecture

### Adapter Pattern

The system is built around an adapter pattern with the following components:

1. **ZKPAdapter Interface** (`adapter.ts`): Defines the contract that all ZKP implementations must follow
2. **SnarkAdapter** (`snark-adapter.ts`): Concrete implementation of the adapter using SnarkJS
3. **MockZKPAdapter** (`mock-adapter.ts`): Mock implementation for testing
4. **ZKPProvider** (`provider.ts`): Factory that provides access to the current ZKP implementation
5. **Public API** (`index.ts`): Exports simplified functions that use the current adapter
6. **ZKP-Bcrypt Integration** (`zkp-bcrypt.ts`): Integration with bcrypt for secure password hashing

### Components

- `ZKPLogin.tsx`: React component for the login form
- `SessionManager.tsx`: React context provider for authentication state
- `PasswordResetForm.tsx`: React component for password reset
- `LogoutButton.tsx`: React component for logout functionality
- `RoleGuard.tsx`: React component for role-based access control

### API Endpoints

- `/api/auth/verify`: Verifies ZKP proofs and issues JWT tokens
- `/api/auth/refresh`: Refreshes JWT tokens
- `/api/auth/request-reset`: Handles password reset requests
- `/api/auth/confirm-reset`: Confirms password resets with ZKP

## How It Works

1. User enters username/password in the login form
2. The password is hashed using bcrypt for additional security
3. The client generates a ZKP proof using SnarkJS (without ever sending the password)
4. The proof is sent to the server for verification
5. The server checks for rate limiting, IP blocking, and other security measures
6. If valid, the server issues a JWT token for authentication
7. The token is stored in localStorage and used for subsequent requests
8. All authentication attempts are logged for security auditing

## Implementing Your Own ZKP Adapter

To implement a different ZKP system:

1. Create a new class that implements the `ZKPAdapter` interface
2. Create a new provider that returns your adapter
3. Update the `getZKPProvider` function in `provider.ts` to use your provider
4. The rest of the system will automatically use your implementation

## Security Considerations

- CSRF protection is implemented for all authentication endpoints
- Rate limiting prevents brute force attacks
- IP blocking prevents attacks from malicious IP addresses
- Exponential backoff increases delays after failed attempts
- CAPTCHA verification is required after multiple failed attempts
- bcrypt is used for secure password hashing
- Tokens have a limited lifespan and must be refreshed
- Account locking provides additional security
- All cryptographic operations happen client-side
- No sensitive information is ever logged
- Comprehensive audit logging for security events
- Replay attack prevention through session binding
- Man-in-the-middle protection through username verification
- Concurrent authentication support without security degradation

## Future Improvements

- Implement proper Circom circuits for authentication
- Integrate a proper Powers of Tau ceremony for the trusted setup
- Use Web Workers for proof generation to avoid blocking the UI
- Implement biometric authentication as an additional factor
- Support for hardware security keys
- Implement more advanced rate limiting algorithms
- Add support for multi-factor authentication
- Improve performance of proof generation and verification
- Implement more sophisticated IP blocking strategies
- Add support for geolocation-based security measures
- Implement machine learning for anomaly detection
- Add support for WebAuthn/FIDO2 authentication
