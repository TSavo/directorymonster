# Zero-Knowledge Proof (ZKP) Authentication Testing Guide

This document provides a comprehensive guide for testing the Zero-Knowledge Proof (ZKP) authentication system implemented in our application. It covers test setup, test types, and troubleshooting common issues.

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Edge Case Testing](#edge-case-testing)
5. [Security Testing](#security-testing)
6. [Performance Testing](#performance-testing)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Test Environment Setup

The ZKP authentication system can be tested in two modes:

### Mock Mode

Mock mode uses simplified implementations of the cryptographic operations for faster testing. This is useful for development and CI/CD pipelines where speed is important.

To enable mock mode, set the `ZKP_USE_MOCKS` environment variable to `true`:

```bash
cross-env ZKP_USE_MOCKS=true jest --config jest.config.zkp.js
```

### Real Mode

Real mode uses the actual cryptographic implementations for more thorough testing. This is important for security validation and pre-release testing.

To enable real mode, set the `ZKP_USE_MOCKS` environment variable to `false` or omit it:

```bash
cross-env ZKP_USE_MOCKS=false jest --config jest.config.zkp.js
```

### Circuit Files

The ZKP system requires compiled circuit files to function. Before running tests in real mode, ensure that the circuit compilation step has been completed:

```bash
npm run zkp:setup
```

This command will:
1. Compile the Circom circuits to WebAssembly
2. Generate the proving and verification keys
3. Set up the necessary directory structure

### Test Configuration

The ZKP tests use a dedicated Jest configuration file: `jest.config.zkp.js`. This configuration:

1. Sets up the appropriate test environment
2. Configures module resolution for ZKP-specific imports
3. Sets timeout values appropriate for cryptographic operations
4. Configures test coverage reporting

## Test Types

The ZKP authentication system includes several types of tests:

### Unit Tests

Unit tests verify individual components of the ZKP system:

- **ZKP Provider Tests**: Test the provider's ability to create and manage adapters
- **ZKP Adapter Tests**: Test the adapter's implementation of ZKP operations
- **bcrypt Integration Tests**: Test the integration with bcrypt for password hashing
- **Salt Generation Tests**: Test the generation of cryptographically secure salts
- **Public Key Derivation Tests**: Test the derivation of public keys from credentials

### Integration Tests

Integration tests verify the interaction between different components:

- **Authentication Flow Tests**: Test the end-to-end authentication process
- **Registration Flow Tests**: Test the user registration process
- **Password Reset Flow Tests**: Test the password reset process
- **Security Measure Integration Tests**: Test the integration with security measures like rate limiting

### Mock Implementation Tests

Mock implementation tests verify that the mock implementations behave correctly:

- **Mock Adapter Tests**: Test the mock adapter's implementation of ZKP operations
- **Mock Provider Tests**: Test the mock provider's ability to create and manage adapters
- **Mock bcrypt Integration Tests**: Test the mock integration with bcrypt

### Real Implementation Tests

Real implementation tests verify that the real cryptographic implementations work correctly:

- **Circuit Compilation Tests**: Test that the circuits compile correctly
- **Proof Generation Tests**: Test the generation of ZKP proofs
- **Proof Verification Tests**: Test the verification of ZKP proofs
- **Cryptographic Property Tests**: Test the cryptographic properties of the ZKP system

### Edge Case Tests

Edge case tests verify that the system handles unusual inputs correctly:

- **Empty Password Tests**: Test handling of empty passwords
- **Very Long Password Tests**: Test handling of very long passwords
- **Special Character Tests**: Test handling of special characters in passwords
- **Unicode Character Tests**: Test handling of Unicode characters in passwords
- **Invalid Salt Tests**: Test handling of invalid salts
- **Case Sensitivity Tests**: Test case sensitivity of usernames and passwords

### Security Tests

Security tests verify that the system is resistant to various attacks:

- **Zero-Knowledge Property Tests**: Test that the system does not reveal passwords
- **Replay Attack Prevention Tests**: Test that the system prevents replay attacks
- **Man-in-the-Middle Protection Tests**: Test that the system prevents MITM attacks
- **Brute Force Resistance Tests**: Test that the system is resistant to brute force attacks
- **Side-Channel Attack Resistance Tests**: Test that the system does not leak information through side channels
- **Timing Attack Resistance Tests**: Test that the system is resistant to timing attacks

## Running Tests

### Running All ZKP Tests

To run all ZKP tests:

```bash
npm run test:zkp
```

This command will run all tests using the mock implementation by default.

### Running Specific Test Files

To run a specific test file:

```bash
npm run test:zkp -- --testPathPattern=zkp-auth-mock.test.ts
```

### Running Tests with Specific Names

To run tests with specific names:

```bash
npm run test:zkp -- --testNamePattern="should verify a valid ZKP proof"
```

### Running Tests in Watch Mode

To run tests in watch mode, which will automatically re-run tests when files change:

```bash
npm run test:zkp -- --watch
```

### Running Tests with Coverage

To run tests with coverage reporting:

```bash
npm run test:zkp -- --coverage
```

## Edge Case Testing

Edge case testing is important to ensure that the ZKP authentication system handles unusual inputs correctly. The `zkp-edge-cases.test.ts` file contains tests for various edge cases:

### Empty Password

```typescript
it('should handle empty password during public key generation', async () => {
  await expect(generatePublicKey(testUsername, '', testSalt))
    .resolves.toBeDefined();
});
```

### Very Long Password

```typescript
it('should handle very long password during proof generation', async () => {
  const veryLongPassword = 'a'.repeat(100 * 1024);
  await expect(generateZKPWithBcrypt(testUsername, veryLongPassword, testSalt))
    .resolves.toBeDefined();
});
```

### Special Characters

```typescript
it('should verify proof with special characters in password', async () => {
  const specialCharPassword = 'P@$$w0rd!@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./';
  const publicKey = await generatePublicKey(testUsername, specialCharPassword, testSalt);
  const { proof, publicSignals } = await generateZKPWithBcrypt(testUsername, specialCharPassword, testSalt);
  const isValid = await verifyZKPWithBcrypt(proof, publicSignals, publicKey);
  expect(isValid).toBe(true);
});
```

### Unicode Characters

```typescript
it('should verify proof with Unicode characters in password', async () => {
  const unicodePassword = 'パスワード123🔒🔑👨‍💻';
  const publicKey = await generatePublicKey(testUsername, unicodePassword, testSalt);
  const { proof, publicSignals } = await generateZKPWithBcrypt(testUsername, unicodePassword, testSalt);
  const isValid = await verifyZKPWithBcrypt(proof, publicSignals, publicKey);
  expect(isValid).toBe(true);
});
```

## Security Testing

Security testing is crucial to ensure that the ZKP authentication system is resistant to various attacks. The `zkp-security-measures.test.ts` file contains tests for various security properties:

### Zero-Knowledge Property

```typescript
it('should not reveal password in public signals', async () => {
  const { publicSignals } = await generateZKPWithBcrypt(testUsername, testPassword, testSalt);
  const publicSignalsStr = JSON.stringify(publicSignals);
  expect(publicSignalsStr).not.toContain(testPassword);
});
```

### Replay Attack Prevention

```typescript
it('should include salt in proof generation to prevent replay attacks', async () => {
  const salt1 = crypto.randomBytes(16).toString('hex');
  const salt2 = crypto.randomBytes(16).toString('hex');
  
  const { proof: proof1, publicSignals: publicSignals1 } = 
    await generateZKPWithBcrypt(testUsername, testPassword, salt1);
  
  const { proof: proof2, publicSignals: publicSignals2 } = 
    await generateZKPWithBcrypt(testUsername, testPassword, salt2);

  expect(JSON.stringify(proof1)).not.toEqual(JSON.stringify(proof2));
  expect(JSON.stringify(publicSignals1)).not.toEqual(JSON.stringify(publicSignals2));
});
```

### Man-in-the-Middle Protection

```typescript
it('should not allow modifying public signals', async () => {
  const publicKey = await generatePublicKey(testUsername, testPassword, testSalt);
  const { proof, publicSignals } = await generateZKPWithBcrypt(testUsername, testPassword, testSalt);
  
  const tamperedPublicSignals = [...publicSignals];
  tamperedPublicSignals[0] = 'tampered-username';
  
  const isValid = await verifyZKPWithBcrypt(proof, tamperedPublicSignals, publicKey);
  expect(isValid).toBe(false);
});
```

### Timing Attack Resistance

```typescript
it('should take similar time to verify valid and invalid proofs', async () => {
  const password = 'password';
  const wrongPassword = 'wrong-password';
  
  const publicKey = await generatePublicKey(testUsername, password, testSalt);
  const validProof = await generateZKPWithBcrypt(testUsername, password, testSalt);
  const invalidProof = await generateZKPWithBcrypt(testUsername, wrongPassword, testSalt);

  const startValidTime = Date.now();
  await verifyZKPWithBcrypt(validProof.proof, validProof.publicSignals, publicKey);
  const validTime = Date.now() - startValidTime;

  const startInvalidTime = Date.now();
  await verifyZKPWithBcrypt(invalidProof.proof, invalidProof.publicSignals, publicKey);
  const invalidTime = Date.now() - startInvalidTime;

  const ratio = Math.max(validTime, invalidTime) / Math.min(validTime, invalidTime);
  expect(ratio).toBeLessThan(1.5);
});
```

## Performance Testing

Performance testing ensures that the ZKP authentication system is fast enough for practical use. The following tests measure the performance of key operations:

### Proof Generation Time

```typescript
it('should generate a proof within acceptable time', async () => {
  const startTime = Date.now();
  await generateZKPWithBcrypt(testUsername, testPassword, testSalt);
  const duration = Date.now() - startTime;
  
  console.log(`Proof generation took ${duration}ms`);
  expect(duration).toBeLessThan(2000); // Should be less than 2 seconds
});
```

### Proof Verification Time

```typescript
it('should verify a proof within acceptable time', async () => {
  const publicKey = await generatePublicKey(testUsername, testPassword, testSalt);
  const { proof, publicSignals } = await generateZKPWithBcrypt(testUsername, testPassword, testSalt);
  
  const startTime = Date.now();
  await verifyZKPWithBcrypt(proof, publicSignals, publicKey);
  const duration = Date.now() - startTime;
  
  console.log(`Proof verification took ${duration}ms`);
  expect(duration).toBeLessThan(1000); // Should be less than 1 second
});
```

## Troubleshooting

### Common Issues

#### Circuit Files Missing

If you encounter errors about missing circuit files:

```
Error: ENOENT: no such file or directory, open '/circuits/zkp_auth/zkp_auth.wasm'
```

Ensure that the circuit compilation step has been completed:

```bash
npm run zkp:setup
```

#### Verification Failures

If proof verification fails:

1. Check that the username, password, and salt match between proof generation and verification
2. Ensure the public key was generated with the same parameters
3. Verify that the circuit files are correctly compiled and accessible

#### Performance Issues

If ZKP operations are slow:

1. Use the mock implementation for testing and development
2. Consider optimizing the circuit
3. Implement caching for frequently used operations

#### Memory Issues

If you encounter memory issues during testing:

1. Run tests with increased memory allocation:
   ```bash
   node --max-old-space-size=4096 node_modules/.bin/jest --config jest.config.zkp.js
   ```
2. Consider running tests in smaller batches

### Debugging Tips

1. **Enable Verbose Logging**: Run tests with the `--verbose` flag to see more detailed output:
   ```bash
   npm run test:zkp -- --verbose
   ```

2. **Inspect Test Failures**: Use the `--testNamePattern` flag to focus on failing tests:
   ```bash
   npm run test:zkp -- --testNamePattern="should verify a valid ZKP proof"
   ```

3. **Check Circuit Compilation**: Verify that the circuit files are correctly compiled:
   ```bash
   ls -la circuits/zkp_auth/
   ```

4. **Examine Test Environment**: Check the test environment configuration:
   ```bash
   cat jest.config.zkp.js
   ```

5. **Monitor Resource Usage**: Use tools like `top` or Task Manager to monitor CPU and memory usage during tests

## Best Practices

### Writing Effective ZKP Tests

1. **Test Both Mock and Real Implementations**: Ensure that both the mock and real implementations are thoroughly tested
2. **Test Edge Cases**: Include tests for empty passwords, very long passwords, special characters, etc.
3. **Test Security Properties**: Verify that the system maintains its security properties
4. **Test Performance**: Measure the performance of key operations to ensure they are fast enough
5. **Use Descriptive Test Names**: Make test names clear and descriptive
6. **Isolate Tests**: Ensure that tests do not interfere with each other
7. **Clean Up After Tests**: Reset any state changes made during tests
8. **Use Appropriate Assertions**: Use assertions that clearly indicate what is being tested
9. **Test Error Handling**: Verify that the system handles errors gracefully
10. **Document Test Requirements**: Clearly document any requirements for running tests

### Maintaining ZKP Tests

1. **Keep Tests Up to Date**: Update tests when the implementation changes
2. **Review Test Coverage**: Regularly review test coverage to identify gaps
3. **Refactor Tests**: Refactor tests to improve clarity and maintainability
4. **Automate Testing**: Include ZKP tests in CI/CD pipelines
5. **Monitor Test Performance**: Keep an eye on test execution time
6. **Document Known Issues**: Document any known issues or limitations
7. **Use Test Fixtures**: Create reusable test fixtures for common test scenarios
8. **Separate Test Concerns**: Separate unit tests, integration tests, and performance tests
9. **Version Control Test Data**: Keep test data under version control
10. **Review Test Results**: Regularly review test results to identify trends
