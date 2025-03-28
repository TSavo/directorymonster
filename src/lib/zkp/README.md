# Zero-Knowledge Proof Authentication System

This directory contains the implementation of a Zero-Knowledge Proof (ZKP) authentication system for DirectoryMonster. The system allows users to prove their identity without ever sending their passwords to the server.

## Overview

The authentication system uses the [SnarkJS](https://github.com/iden3/snarkjs) library and [Circom](https://github.com/iden3/circom) circuits to implement ZKP generation and verification. We use an adapter pattern to make the implementation swappable, allowing for different ZKP libraries to be used in the future.

## Architecture

### Adapter Pattern

The system is built around an adapter pattern with the following components:

1. **ZKPAdapter Interface** (`adapter.ts`): Defines the contract that all ZKP implementations must follow
2. **SnarkAdapter** (`snark-adapter.ts`): Concrete implementation of the adapter using SnarkJS
3. **ZKPProvider** (`provider.ts`): Factory that provides access to the current ZKP implementation
4. **Public API** (`index.ts`): Exports simplified functions that use the current adapter

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
2. The client generates a ZKP proof using SnarkJS (without ever sending the password)
3. The proof is sent to the server for verification
4. If valid, the server issues a JWT token for authentication
5. The token is stored in localStorage and used for subsequent requests

## Implementing Your Own ZKP Adapter

To implement a different ZKP system:

1. Create a new class that implements the `ZKPAdapter` interface
2. Create a new provider that returns your adapter
3. Update the `getZKPProvider` function in `provider.ts` to use your provider
4. The rest of the system will automatically use your implementation

## Security Considerations

- CSRF protection is implemented for all authentication endpoints
- Rate limiting prevents brute force attacks
- Tokens have a limited lifespan and must be refreshed
- Account locking provides additional security
- All cryptographic operations happen client-side
- No sensitive information is ever logged

## Future Improvements

- Implement proper Circom circuits for authentication
- Integrate a proper Powers of Tau ceremony for the trusted setup
- Use Web Workers for proof generation to avoid blocking the UI
- Implement biometric authentication as an additional factor
- Support for hardware security keys
