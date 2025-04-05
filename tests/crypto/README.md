# ZKP Authentication Testing

This directory contains tests for the Zero-Knowledge Proof (ZKP) authentication system.

## Test Categories

1. **Core ZKP Functions**: Tests for proof generation and verification
2. **Authentication Flow**: Tests for the complete authentication process
3. **Security Properties**: Tests for zero-knowledge properties and attack resistance
4. **Performance**: Tests for performance characteristics
5. **API Integration**: Tests for integration with the API layer
6. **SnarkAdapter**: Tests specifically for the SnarkAdapter implementation
7. **bcrypt Integration**: Tests for the integration of bcrypt with ZKP
8. **Security Measures**: Tests for rate limiting, IP blocking, and other security measures
9. **CAPTCHA Integration**: Tests for CAPTCHA verification
10. **Audit Logging**: Tests for comprehensive audit logging
11. **Replay Attack Prevention**: Tests for preventing replay attacks
12. **Man-in-the-Middle Protection**: Tests for preventing MITM attacks
13. **Concurrent Authentication**: Tests for handling multiple authentication requests

## Running the Tests

```bash
# Run all cryptographic tests
npm run test:crypto

# Run specific test files
npx jest tests/crypto/zkp-authentication.test.ts
npx jest tests/crypto/zkp-security-measures.test.ts
npx jest tests/crypto/secure-zkp-cli.test.ts
npx jest tests/crypto/zkp-setup-verification.test.ts

# Run bcrypt integration tests
npx jest tests/lib/zkp-bcrypt.test.ts
npx jest tests/lib/zkp-mock-adapter-bcrypt.test.ts

# Run all ZKP-related tests
npx jest tests/crypto tests/lib/zkp-bcrypt.test.ts tests/lib/zkp-mock-adapter-bcrypt.test.ts

# Run security measures tests
npx jest tests/crypto/zkp-security-measures.test.ts
```

## Test Requirements

- Node.js 16+
- Access to the compiled circuits (*.wasm and *.zkey files)
- Sufficient memory (at least 4GB RAM)

## Circuit Files

The tests expect the following circuit files to exist:

- `circuits/zkp_auth/zkp_auth_js/zkp_auth.wasm`: The WebAssembly file for the circuit
- `circuits/zkp_auth/zkp_auth_final.zkey`: The proving key for the circuit
- `circuits/zkp_auth/verification_key.json`: The verification key for the circuit

If these files don't exist, the tests will fail with the error "Circuit files not found. Please compile the circuits first."

### Compiling the Circuits

To compile the circuits, you need to install circom and snarkjs:

```bash
npm install -g circom snarkjs
```

Then, you can compile the circuits:

```bash
# Create the circuits directory
mkdir -p circuits/zkp_auth

# Compile the circuit
circom circuits/zkp_auth.circom --r1cs --wasm --sym

# Generate the proving key
snarkjs groth16 setup circuits/zkp_auth.r1cs circuits/powersOfTau28_hez_final_10.ptau circuits/zkp_auth/zkp_auth_final.zkey

# Export the verification key
snarkjs zkey export verificationkey circuits/zkp_auth/zkp_auth_final.zkey circuits/zkp_auth/verification_key.json
```

### Using Mock Implementations

If you don't want to compile the circuits, you have two options:

1. **Use the simplified tests**: Run `npx mocha tests/crypto/simplified-zkp.test.js` which uses a simplified implementation that doesn't require circuit files.

2. **Modify the ZKP implementation**: Modify the `src/lib/zkp.ts` file to use mock functions instead of the actual snarkjs implementation.

The simplified tests are recommended for CI/CD environments where you don't have access to the circuit files.

## Adding New Tests

When adding new cryptographic tests, ensure they:
1. Use the actual ZKP libraries, not mocks
2. Test both positive and negative cases
3. Verify security properties
4. Have reasonable performance expectations

## Security Properties Tested

The tests verify that the ZKP system maintains the following security properties:

1. **Zero-Knowledge**: The proof does not reveal the password
2. **Soundness**: Invalid proofs are rejected
3. **Completeness**: Valid proofs are accepted
4. **Replay Resistance**: Proofs cannot be reused
5. **Man-in-the-Middle Resistance**: Proofs are bound to the username
6. **bcrypt Integration**: Passwords are securely hashed with bcrypt
7. **Rate Limiting**: Authentication attempts are rate-limited
8. **IP Blocking**: IP addresses are blocked after too many failed attempts
9. **Exponential Backoff**: Login attempts are subject to exponential backoff
10. **CAPTCHA Verification**: CAPTCHA verification is required after multiple failed attempts
11. **Audit Logging**: Authentication events are logged for security auditing
12. **Concurrent Authentication**: Multiple authentication requests can be handled simultaneously
13. **Admin Bypass**: Administrators can bypass IP blocking for legitimate purposes
14. **Security Under Load**: Security measures remain effective under high load

## Test Files

- **zkp-authentication.test.ts**: Tests for the core ZKP authentication functionality
- **zkp-security-measures.test.ts**: Tests for security measures like rate limiting and IP blocking
- **secure-zkp-cli.test.ts**: Tests for the command-line interface to the ZKP system
- **zkp-setup-verification.test.ts**: Tests for the ZKP setup process
- **zkp-bcrypt.test.ts**: Tests for the bcrypt integration with ZKP
- **zkp-mock-adapter-bcrypt.test.ts**: Tests for the mock adapter with bcrypt
