# Hash Truncation Fix

## Overview

This document describes the improvements made to fix hash truncation issues in the ZKP implementation.

## Previous Implementation

The previous implementation truncated hash values to 64 bits, which significantly reduced the security of the hash function.

```javascript
// scripts/update-zkp-implementation.js
// Update the input format for the circuit
zkpIndex = zkpIndex.replace(
  /const input = \{[^}]+\};/s,
  `const input = {
      username: BigInt('0x' + crypto.createHash('sha256').update(username).digest('hex')) % BigInt(2**64),
      password: BigInt('0x' + crypto.createHash('sha256').update(password).digest('hex')) % BigInt(2**64),
      publicSalt: BigInt('0x' + crypto.createHash('sha256').update(salt).digest('hex')) % BigInt(2**64)
    };`
);
```

## Improved Implementation

The improved implementation uses full hash values without truncation, preserving the full security of the SHA-256 hash function.

```javascript
// scripts/update-zkp-implementation.js
// Update the input format for the circuit
// Use full hash values without truncation for better security
zkpIndex = zkpIndex.replace(
  /const input = \{[^}]+\};/s,
  `const input = {
      // Use full SHA-256 hash values without truncation for better security
      username: BigInt('0x' + crypto.createHash('sha256').update(username).digest('hex')),
      password: BigInt('0x' + crypto.createHash('sha256').update(password).digest('hex')),
      publicSalt: BigInt('0x' + crypto.createHash('sha256').update(salt).digest('hex'))
    };`
);
```

## Security Benefits

1. **Increased Entropy**: Using the full 256-bit hash value instead of truncating to 64 bits.
2. **Collision Resistance**: Significantly reduced probability of hash collisions.
3. **Brute Force Resistance**: Increased resistance to brute force attacks.
4. **Full Security**: Utilizing the full security properties of the SHA-256 hash function.

## Collision Probability Comparison

For a hash function with n bits of output and m different inputs:

- Probability of collision with full 256-bit hash (n=256, m=1000):  
  P ≈ 1 - e^(-1000*999/2*2^256) ≈ 1.85e-74 (virtually zero)

- Probability of collision with truncated 64-bit hash (n=64, m=1000):  
  P ≈ 1 - e^(-1000*999/2*2^64) ≈ 0.0054 (0.54% chance)

This demonstrates that truncation significantly increases the risk of collisions.

## Testing

The implementation is tested in:

- `tests/crypto/hash-truncation.test.ts`

Run the tests with:

```bash
npx jest tests/crypto/hash-truncation.test.ts
```

## CI/CD Integration

This security improvement is verified in the CI/CD pipeline through:

- The `security-checks.yml` workflow
- The `zkp-auth.yml` workflow with added security checks

## Best Practices

1. Never truncate cryptographic hash values unless absolutely necessary.
2. If truncation is required for circuit constraints, use at least 128 bits.
3. Document any truncation and its security implications.
4. Use the full hash value whenever possible to maintain security properties.
5. Consider the collision probability when determining hash output size.
