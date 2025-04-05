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

## Security Benefits

1. **Slow Hashing Algorithm**: bcrypt is intentionally slow, making brute force attacks more difficult.
2. **Built-in Salt**: bcrypt automatically handles salting, preventing rainbow table attacks.
3. **Adjustable Work Factor**: The salt rounds parameter allows adjusting the computational cost as hardware improves.
4. **Industry Standard**: bcrypt is a widely accepted standard for password hashing.

## Testing

The implementation is tested in:

- `tests/lib/zkp-bcrypt.test.ts`
- `tests/lib/zkp-mock-adapter-bcrypt.test.ts`

Run the tests with:

```bash
npx jest tests/lib/zkp-bcrypt.test.ts tests/lib/zkp-mock-adapter-bcrypt.test.ts
```

## CI/CD Integration

This security improvement is verified in the CI/CD pipeline through:

- The `security-checks.yml` workflow
- The `zkp-auth.yml` workflow with added security checks

## Best Practices

1. Use a salt rounds value of at least 10 (we use 12) for a good balance of security and performance.
2. Never store passwords in plain text or use fast hashing algorithms like MD5 or SHA-256 for password storage.
3. Verify password hashes using the bcrypt.compare function, not by generating a new hash and comparing.
4. Keep the bcrypt library updated to benefit from security improvements.
