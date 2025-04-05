# Security Documentation

This directory contains documentation for the security features and improvements implemented in the DirectoryMonster application, with a focus on the Zero-Knowledge Proof (ZKP) authentication system.

## Security Improvements

The following security improvements have been implemented:

1. [Password Hashing Improvements](./password-hashing.md) - Replacing SHA-256 with bcrypt for password hashing
2. [ZKP Circuit Privacy](./zkp-circuit-privacy.md) - Ensuring private inputs remain private in ZKP circuits
3. [TypeScript Type Definitions](./typescript-definitions.md) - Fixing reserved keyword issues in TypeScript definitions
4. [HTTP Headers Implementation](./http-headers.md) - Properly implementing HTTP headers for rate limiting
5. [Division by Zero Protection](./division-by-zero.md) - Adding protection against division by zero in Montgomery curve operations
6. [File Integrity Checks](./file-integrity.md) - Adding integrity checks for cryptographic files
7. [Poseidon Hash Constants](./poseidon-constants.md) - Implementing proper cryptographically secure constants
8. [Hash Truncation Fix](./hash-truncation.md) - Fixing hash truncation issues to use full hash values
9. [Poseidon Round Parameters](./poseidon-rounds.md) - Increasing round parameters for better security

## Security Testing

All security improvements are covered by automated tests. You can run these tests using the following commands:

```bash
# Run all crypto tests (including security tests)
npm run test:crypto

# Run core ZKP tests (authentication, secure, simplified)
npm run test:crypto:core

# Verify the ZKP setup process
npm run test:crypto:setup

# Run only security improvement tests
npm run test:crypto:security

# Verify cryptographic file integrity
npm run security:verify

# Generate new checksums for cryptographic files
npm run security:generate

# Run security tests and verify file integrity
npm run security:check

# Run security audit on dependencies
npm run security:audit

# Run all security checks (tests, verification, audit)
npm run security:all
```

## CI/CD Integration

Security checks are integrated into the CI/CD pipeline through the following GitHub Actions workflows:

- [security-checks.yml](/.github/workflows/security-checks.yml) - Dedicated workflow for security checks
- [zkp-auth.yml](/.github/workflows/zkp-auth.yml) - ZKP authentication workflow with security checks

These workflows ensure that all security improvements are maintained and that no regressions are introduced.

## Security Best Practices

When working with the ZKP authentication system, follow these best practices:

1. Never expose private inputs in ZKP circuits
2. Use bcrypt for password hashing with appropriate salt rounds
3. Verify file integrity before using cryptographic files
4. Use full hash values without truncation
5. Ensure proper round parameters for cryptographic functions
6. Implement proper error handling for cryptographic operations
7. Set appropriate HTTP headers for security features
8. Protect against common vulnerabilities like division by zero

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/Projects/Cryptographic-Standards-and-Guidelines)
- [ZKP Authentication Specification](../zkp-authentication.md)
