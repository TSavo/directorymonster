# Zero-Knowledge Proof (ZKP) Testing Guide

This document provides guidance on testing the Zero-Knowledge Proof (ZKP) functionality in DirectoryMonster.

## Overview

The ZKP authentication system in DirectoryMonster uses cryptographic proofs to verify user credentials without transmitting passwords. Testing this functionality requires special considerations due to the computational intensity of ZKP operations.

## Test Configuration

We've created a separate Jest configuration specifically for ZKP tests:

- **Configuration File**: `jest.config.zkp.js`
- **Test Files**: Located in `tests/crypto/` and `tests/lib/zkp/`
- **Mock Mode**: Tests can run with mock implementations to avoid actual cryptographic operations
- **Real Mode**: Tests can run with real implementations to verify actual cryptographic operations

## Running ZKP Tests

### With Mocks (Recommended for Development)

```bash
npm run test:zkp
```

This runs ZKP tests using mock implementations, which is faster and doesn't require circuit files.

### With Real Implementations

```bash
npm run test:zkp:real
```

This runs ZKP tests using real implementations, which is slower and requires circuit files to be present in the `circuits/` directory.

### Running Both Test Modes

```bash
npm run test:zkp:all
```

This runs both mock and real implementation tests sequentially. If circuit files are missing, it will attempt to generate them using the ZKP setup script.

### Using the Test Runner Script Directly

For more control, you can use the test runner script directly:

```bash
# Run both mock and real implementation tests
node scripts/run-zkp-tests.js

# Run only mock tests
node scripts/run-zkp-tests.js --mocks

# Run only real implementation tests
node scripts/run-zkp-tests.js --real

# Show help
node scripts/run-zkp-tests.js --help
```

## Environment Variables

- `ZKP_USE_MOCKS`: Set to `true` to force using mocks even in real mode
- `BCRYPT_WORK_FACTOR`: Controls the computational cost of bcrypt hashing (default: 10)

## Required Circuit Files

For real ZKP tests, the following circuit files must be present:

```
circuits/auth/auth.wasm
circuits/auth/auth_final.zkey
circuits/auth/verification_key.json
```

If these files are missing, tests will be skipped when running in real mode.

## Mock Implementation

The mock implementation of snarkjs is located in `tests/__mocks__/snarkjs.js`. It provides:

- Mock implementations of all snarkjs functions
- Tracking of function calls for better testing
- Simulation of error scenarios
- Consistent return values for deterministic testing

### Using the Mock in Tests

```javascript
// Import the mock
const snarkjs = require('snarkjs');

// Use the mock in tests
test('should generate a proof', async () => {
  const result = await snarkjs.groth16.fullProve(
    { input: 'value' },
    'circuit.wasm',
    'circuit.zkey'
  );

  expect(result.proof).toBeDefined();
  expect(result.publicSignals).toBeDefined();
});

// Simulate errors
test('should handle errors', async () => {
  // Simulate a specific error
  snarkjs._simulateError('groth16', 'fullProve', new Error('Test error'));

  await expect(
    snarkjs.groth16.fullProve({ input: 'value' }, 'circuit.wasm', 'circuit.zkey')
  ).rejects.toThrow('Test error');
});

// Check call tracking
test('should track function calls', async () => {
  // Reset mock calls
  snarkjs._reset();

  // Make a call
  await snarkjs.groth16.verify({}, ['1', '2'], {});

  // Check that the call was tracked
  const calls = snarkjs._getMockCalls();
  expect(calls.groth16.verify.length).toBe(1);
});
```

## Best Practices

1. **Use Mock Mode for Development**: Always use mock mode during development to avoid long test times.
2. **Run Real Tests Before Deployment**: Run tests with real implementations before deploying to production.
3. **Isolate ZKP Tests**: Keep ZKP tests separate from other tests to avoid performance issues.
4. **Use Conditional Testing**: Skip tests that require circuit files if they don't exist.
5. **Mock External Dependencies**: Use mocks for external dependencies to isolate ZKP functionality.
6. **Test Error Handling**: Verify that the system handles errors gracefully.
7. **Test Edge Cases**: Verify that the system handles edge cases correctly.

## Troubleshooting

### Tests Taking Too Long

- Use mock mode instead of real mode
- Reduce the number of tests running in real mode
- Increase the timeout for tests that require real ZKP operations

### Missing Circuit Files

- Generate circuit files using the ZKP setup scripts
- Check that circuit files are in the correct location
- Use mock mode if circuit files are not available

### Inconsistent Test Results

- Reset mock state between tests
- Use unique inputs for each test
- Avoid sharing state between tests

## CI/CD Integration

In CI/CD pipelines, we use the mock implementation by default:

```yaml
- name: Run ZKP tests with mocks
  run: npm run test:zkp
```

For comprehensive testing, we can also run real implementation tests:

```yaml
- name: Run ZKP tests with real implementations
  run: npm run test:zkp:real
```

## Further Reading

- [ZKP Authentication Specification](zkp-authentication.md)
- [Production Deployment Guide](production-deployment.md)
- [snarkjs Documentation](https://github.com/iden3/snarkjs)
