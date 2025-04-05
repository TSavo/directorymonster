# ZKP-Bcrypt Integration Specification

## Overview

This specification outlines the integration of bcrypt password hashing with the existing Zero-Knowledge Proof (ZKP) authentication system in Directory Monster. This integration enhances security by adding an additional layer of protection to user passwords.

## Motivation

While ZKP authentication already provides a secure way to authenticate users without sending passwords to the server, adding bcrypt hashing provides additional security benefits:

1. **Defense in Depth**: If the ZKP system is compromised, passwords remain protected by bcrypt
2. **Industry Standard**: Bcrypt is a well-established password hashing algorithm with proven security properties
3. **Adaptive Security**: Bcrypt's work factor can be adjusted as hardware improves, maintaining security over time

## Implementation Details

### Client-Side Implementation

#### 1. ZKP-Bcrypt Module

A new module `src/lib/zkp/zkp-bcrypt.ts` provides the integration between bcrypt and ZKP:

```typescript
export async function generateZKPWithBcrypt(
  username: string,
  password: string,
  salt: string
): Promise<ZKPProof> {
  // Hash the password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);
  
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

#### 2. Authentication Components

The following components have been updated to use the bcrypt-enhanced ZKP:

- `ZKPLogin.tsx`: Uses `generateZKPWithBcrypt` for authentication
- `FirstUserSetup.tsx`: Uses bcrypt for new user registration
- `PasswordResetForm.tsx`: Uses bcrypt for password resets

### Server-Side Implementation

The following API endpoints have been updated to verify ZKP proofs with bcrypt:

1. `/api/auth/verify`: Verifies login credentials
2. `/api/auth/setup`: Handles user creation
3. `/api/auth/confirm-reset`: Processes password resets

### Security Considerations

1. **Salt Management**: Salts are still managed by the existing salt cache system
2. **Work Factor**: Bcrypt is configured with a default work factor of 10, which can be adjusted as needed
3. **Backward Compatibility**: The implementation supports both bcrypt-enhanced ZKP and the original ZKP system during the transition period

## Testing

The following test files have been updated to verify the bcrypt integration:

1. `tests/lib/zkp-bcrypt-client.test.ts`: Tests the client-side bcrypt integration
2. `tests/components/admin/auth/ZKPLogin-bcrypt.test.tsx`: Tests the login component
3. `tests/components/admin/auth/FirstUserSetup-bcrypt.test.tsx`: Tests the user setup component
4. `tests/components/admin/auth/PasswordResetForm-bcrypt.test.tsx`: Tests the password reset component

## Future Work

1. **Performance Optimization**: Evaluate and optimize the performance impact of adding bcrypt
2. **Work Factor Adjustment**: Implement a system to adjust the bcrypt work factor based on server capabilities
3. **Test Updates**: Update all existing tests to work with the bcrypt-enhanced ZKP system

## Conclusion

The integration of bcrypt with ZKP provides a significant security enhancement to the authentication system. By hashing passwords with bcrypt before using them in ZKP, we add an additional layer of protection that follows the principle of defense in depth.
