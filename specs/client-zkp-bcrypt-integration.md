# Client-Side ZKP-Bcrypt Integration Specification

## Overview

This specification outlines the integration of bcrypt password hashing with Zero-Knowledge Proof (ZKP) authentication in all client-side authentication flows. The goal is to enhance security by ensuring passwords are properly hashed with bcrypt before being used in ZKP proofs.

## Current Implementation

Currently, the server-side implementation uses bcrypt for password hashing, but the client-side authentication flows (login, first user setup, password reset) do not use the bcrypt integration with ZKP. Instead, they use the standard `generateProof` function, which does not hash passwords with bcrypt before generating ZKP proofs.

## Required Changes

### 1. Client-Side Authentication Flows

#### Login Flow (`ZKPLogin.tsx`)

Update the login flow to use `generateZKPWithBcrypt` instead of `generateProof`:

```typescript
// Current implementation
const { proof, publicSignals } = await generateProof({
  username,
  password,
  salt,
});

// New implementation
const { proof, publicSignals } = await generateZKPWithBcrypt(
  username,
  password,
  salt
);
```

#### First User Setup (`FirstUserSetup.tsx`)

Update the first user setup flow to use ZKP with bcrypt instead of sending the raw password:

```typescript
// Current implementation
const response = await fetch('/api/auth/setup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({
    username,
    password,
    email: email || undefined,
    siteName,
  }),
});

// New implementation
// Get salt from server or generate one
const salt = generateSalt();

// Generate ZKP with bcrypt
const { proof, publicSignals } = await generateZKPWithBcrypt(
  username,
  password,
  salt
);

const response = await fetch('/api/auth/setup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({
    username,
    proof,
    publicSignals,
    salt,
    email: email || undefined,
    siteName,
  }),
});
```

#### Password Reset (`PasswordResetForm.tsx`)

Update the password reset flow to use `generateZKPWithBcrypt` instead of `generateProof`:

```typescript
// Current implementation
const { proof, publicSignals } = await generateProof({
  username: email,
  password: newPassword,
  salt,
});

// New implementation
const { proof, publicSignals } = await generateZKPWithBcrypt(
  email,
  newPassword,
  salt
);
```

### 2. Server-Side API Endpoints

Update the server-side API endpoints to verify ZKP proofs with bcrypt:

#### `/api/auth/login`

```typescript
// Current implementation
const isValid = await verifyProof(proof, publicSignals, publicKey);

// New implementation
const isValid = await verifyZKPWithBcrypt(proof, publicSignals, publicKey);
```

#### `/api/auth/setup`

Update to handle ZKP proofs with bcrypt instead of raw passwords.

#### `/api/auth/confirm-reset`

```typescript
// Current implementation
const isValid = await verifyProof(proof, publicSignals, publicKey);

// New implementation
const isValid = await verifyZKPWithBcrypt(proof, publicSignals, publicKey);
```

## Testing Requirements

1. Unit tests for `generateZKPWithBcrypt` and `verifyZKPWithBcrypt` functions
2. Unit tests for client-side authentication flows with bcrypt integration
3. Integration tests for the complete authentication flow with bcrypt
4. End-to-end tests for login, first user setup, and password reset with bcrypt

## Implementation Timeline

1. Create unit tests for `generateZKPWithBcrypt` and `verifyZKPWithBcrypt` functions
2. Update client-side authentication flows to use bcrypt integration
3. Update server-side API endpoints to verify ZKP proofs with bcrypt
4. Create integration tests for the complete authentication flow
5. Create end-to-end tests for all authentication flows

## Security Considerations

1. Ensure bcrypt salt rounds are configurable and set to an appropriate value (minimum 10)
2. Ensure passwords are never transmitted in plain text
3. Ensure ZKP proofs are properly verified with bcrypt
4. Ensure backward compatibility with existing user accounts
5. Implement proper error handling for all authentication flows

## Acceptance Criteria

1. All client-side authentication flows use bcrypt integration with ZKP
2. All server-side API endpoints verify ZKP proofs with bcrypt
3. All tests pass, including unit tests, integration tests, and end-to-end tests
4. No passwords are transmitted in plain text
5. Existing user accounts continue to work with the new implementation
