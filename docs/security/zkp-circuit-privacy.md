# ZKP Circuit Privacy

## Overview

This document describes the improvements made to ensure private inputs remain private in the Zero-Knowledge Proof (ZKP) circuits.

## Previous Implementation

In the previous implementation, the password input in the ZKP circuit was not explicitly marked as private, which could potentially expose sensitive information in the public signals.

```circom
// circuits/zkp_auth/zkp_auth.circom
template SecureAuth() {
    // Private inputs (known only to the prover)
    signal input username;
    signal input password;
    
    // ...
}

template Main() {
    // Public inputs
    signal input publicSalt;

    // Private inputs
    signal input username;
    signal input password;
    
    // ...
}
```

## Improved Implementation

The improved implementation explicitly marks the username and password inputs as private, ensuring they are not exposed in the public signals.

```circom
// circuits/zkp_auth/zkp_auth.circom
template SecureAuth() {
    // Private inputs (known only to the prover)
    signal private input username;
    signal private input password;
    
    // ...
}

template Main() {
    // Public inputs
    signal input publicSalt;

    // Private inputs
    signal private input username;
    signal private input password;
    
    // ...
}
```

Additionally, the `.sym` file was updated to reflect the privacy settings:

```
1,2,0,main.publicSalt
2,3,1,main.username
3,4,1,main.password
4,1,0,main.publicKey
```

Where the third column indicates the privacy flag (0 for public, 1 for private).

## Security Benefits

1. **Zero-Knowledge Property**: Ensures that the proof system truly maintains the zero-knowledge property by not revealing private inputs.
2. **Privacy Protection**: Prevents the exposure of sensitive information like passwords in the public signals.
3. **Proper Circuit Design**: Follows best practices for ZKP circuit design by explicitly marking private inputs.
4. **Reduced Attack Surface**: Minimizes the risk of information leakage through the proof system.

## Testing

The implementation is tested in:

- `tests/crypto/zkp-privacy.test.ts`

Run the tests with:

```bash
npx jest tests/crypto/zkp-privacy.test.ts
```

## CI/CD Integration

This security improvement is verified in the CI/CD pipeline through:

- The `security-checks.yml` workflow
- The `zkp-auth.yml` workflow with added security checks

## Best Practices

1. Always explicitly mark private inputs with the `private` keyword in circom circuits.
2. Verify the privacy settings in the `.sym` file after compilation.
3. Test that private inputs are not exposed in the public signals.
4. Follow the principle of least privilege by only exposing the minimum necessary information as public signals.
