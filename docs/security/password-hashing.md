# Password Hashing Improvements

## Overview

This document describes the improvements made to the password hashing mechanism in the ZKP authentication system, replacing SHA-256 with bcrypt for better security.

## Previous Implementation

The previous implementation used SHA-256 for password hashing, which is not specifically designed for password storage and is vulnerable to brute force attacks due to its speed.

```typescript
// File: src/lib/zkp.ts
export async function generatePublicKey(username: string, password: string, salt: string): Promise<string> {
  const combined = `${username}:${password}:${salt}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}
```

```typescript
// File: src/lib/zkp/mock-adapter.ts
derivePublicKey(input: ZKPInput): string {
  const { username, password, salt } = input;
  // Create a hash of the credentials
  const combined = `${username}:${password}:${salt}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}
```

## Improved Implementation

The improved implementation uses bcrypt, which is specifically designed for password hashing and includes built-in salting and work factor adjustment to slow down brute force attacks.

```typescript
// File: src/lib/zkp.ts
import * as bcrypt from 'bcrypt';

export async function generatePublicKey(username: string, password: string, salt: string): Promise<string> {
  // Combine the inputs (excluding salt as bcrypt will handle it)
  const combined = `${username}:${password}`;

  // Use bcrypt for secure hashing with salt
  const saltRounds = 12;
  return await bcrypt.hash(combined, saltRounds);
}
```

```typescript
// File: src/lib/zkp/mock-adapter.ts
import * as bcrypt from 'bcrypt';

derivePublicKey(input: ZKPInput): string {
  const { username, password } = input;

  // Combine the inputs (excluding salt as bcrypt will handle it)
  const combined = `${username}:${password}`;

  // Use bcrypt for secure hashing with salt
  const saltRounds = 12;
  return bcrypt.hashSync(combined, saltRounds);
}
```

```typescript
// File: src/lib/zkp/zkp-bcrypt.ts
import * as bcrypt from 'bcrypt';
import { ZKPInput, ZKPProof } from './adapter';
import { getZKPProvider } from './provider';

/**
 * Generate a bcrypt hash for a password
 * @param password The password to hash
 * @param saltRounds The number of salt rounds to use (default: 10)
 * @returns A promise that resolves to the bcrypt hash
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a bcrypt hash
 * @param password The password to verify
 * @param hash The bcrypt hash to verify against
 * @returns A promise that resolves to true if the password matches the hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

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
  // Hash the password with bcrypt
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

## Security Benefits

1. **Slow Hashing Algorithm**: bcrypt is intentionally slow, making brute force attacks more difficult.
2. **Built-in Salt**: bcrypt automatically handles salting, preventing rainbow table attacks.
3. **Adjustable Work Factor**: The salt rounds parameter allows adjusting the computational cost as hardware improves.
4. **Industry Standard**: bcrypt is a widely accepted standard for password hashing.
5. **ZKP Integration**: The integration with ZKP provides an additional layer of security.
6. **Double Protection**: Passwords are protected by both bcrypt and ZKP, creating a defense-in-depth approach.
7. **Resistance to Quantum Attacks**: The combination of bcrypt and ZKP provides better resistance to quantum computing attacks.
8. **No Password Transmission**: Passwords are never transmitted over the network, even in hashed form.

## Testing

The implementation is tested in:

- `tests/lib/zkp-bcrypt.test.ts` - Tests for the bcrypt integration with ZKP
- `tests/lib/zkp-mock-adapter-bcrypt.test.ts` - Tests for the mock adapter with bcrypt
- `tests/crypto/zkp-authentication.test.ts` - Tests for the complete authentication flow
- `tests/crypto/zkp-security-measures.test.ts` - Tests for security measures including bcrypt

Run the tests with:

```bash
# Run all ZKP-related tests
npx jest tests/crypto tests/lib/zkp-bcrypt.test.ts tests/lib/zkp-mock-adapter-bcrypt.test.ts

# Run specific bcrypt integration tests
npx jest tests/lib/zkp-bcrypt.test.ts

# Run security measures tests
npx jest tests/crypto/zkp-security-measures.test.ts
```

## CI/CD Integration

This security improvement is verified in the CI/CD pipeline through:

- The `security-checks.yml` workflow
- The `zkp-auth.yml` workflow with added security checks
- The `crypto-tests.yml` workflow that runs all cryptography-related tests
- The `bcrypt-integration.yml` workflow that specifically tests the bcrypt integration

## Best Practices

1. Use a salt rounds value of at least 10 (we use 12) for a good balance of security and performance.
2. Never store passwords in plain text or use fast hashing algorithms like MD5 or SHA-256 for password storage.
3. Verify password hashes using the bcrypt.compare function, not by generating a new hash and comparing.
4. Keep the bcrypt library updated to benefit from security improvements.
5. Combine bcrypt with ZKP for a defense-in-depth approach to password security.
6. Implement rate limiting, IP blocking, and exponential backoff to prevent brute force attacks.
7. Use CAPTCHA verification after multiple failed authentication attempts.
8. Log all authentication events for security auditing.
9. Test the system under high load to ensure security measures remain effective.
10. Implement proper error handling for all security-related operations.

## Integration with Other Security Measures

The bcrypt password hashing is integrated with other security measures:

1. **Rate Limiting**: Limits the number of authentication attempts per username.
2. **IP Blocking**: Blocks IP addresses after too many failed attempts.
3. **Exponential Backoff**: Implements exponential backoff for login attempts.
4. **CAPTCHA Verification**: Requires CAPTCHA verification after multiple failed attempts.
5. **Audit Logging**: Logs all authentication events for security auditing.
6. **Replay Attack Prevention**: Prevents replay attacks by binding proofs to specific sessions.
7. **Man-in-the-Middle Protection**: Prevents MITM attacks through username verification.

For more details on these security measures, see the [ZKP Authentication Specification](../zkp-authentication.md) and [Security Improvements](../../specs/security-improvements-zkp-auth.md).
