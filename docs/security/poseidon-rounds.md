# Poseidon Round Parameters

## Overview

This document describes the improvements made to increase the Poseidon hash function round parameters for better security.

## Previous Implementation

The previous implementation used a limited number of rounds for the Poseidon hash function, which could potentially reduce its security.

```circom
// circuits/zkp_auth/zkp_auth.circom
// Constants
var nRoundsF = 4; // Full rounds
var nRoundsP = 3; // Partial rounds

// ...

var constVal = POSEIDON_CONSTANT(constIdx % 10);
```

## Improved Implementation

The improved implementation increases both the full and partial rounds, and uses all available constants.

```circom
// circuits/zkp_auth/zkp_auth.circom
// Constants
var nRoundsF = 8; // Full rounds (increased from 4)
var nRoundsP = 57; // Partial rounds (increased from 3)

// ...

var constVal = POSEIDON_CONSTANT(constIdx % 21);
```

## Security Benefits

1. **Increased Resistance to Algebraic Attacks**: More rounds make algebraic attacks more difficult.
2. **Improved Diffusion**: Better diffusion properties with more rounds.
3. **Reduced Risk of Statistical Attacks**: More rounds reduce the risk of statistical attacks.
4. **Security Margin**: Provides a larger security margin against future cryptanalysis.

## Round Parameter Recommendations

The recommended number of rounds for Poseidon depends on the security level and the size of the field. For a 256-bit prime field:

- Full rounds: At least 8
- Partial rounds: At least 57

Our implementation meets these recommendations.

## Testing

The implementation is tested in:

- `tests/crypto/poseidon-rounds.test.ts`

Run the tests with:

```bash
npx jest tests/crypto/poseidon-rounds.test.ts
```

## CI/CD Integration

This security improvement is verified in the CI/CD pipeline through:

- The `security-checks.yml` workflow
- The `zkp-auth.yml` workflow with added security checks

## Best Practices

1. Follow the recommended number of rounds for the Poseidon hash function.
2. Increase the number of rounds if higher security is required.
3. Use all available constants to maximize entropy.
4. Balance security with performance considerations.
5. Stay updated with the latest cryptanalysis of the Poseidon hash function.
