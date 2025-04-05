# Directory Monster Security Documentation

## Authentication System

Directory Monster uses a secure authentication system that combines Zero-Knowledge Proofs (ZKP) with bcrypt password hashing to provide multiple layers of security.

### Zero-Knowledge Proof Authentication

The ZKP authentication system allows users to prove they know their password without actually sending the password to the server. This prevents password interception and server-side password leaks.

Key features:
- Passwords never leave the client
- Server stores only public keys, not password hashes
- Authentication is cryptographically secure

### Bcrypt Password Hashing

As an additional security measure, passwords are hashed using bcrypt before being used in the ZKP system. This provides defense in depth:

- If the ZKP system is compromised, passwords remain protected by bcrypt
- Bcrypt's work factor can be adjusted as hardware improves
- Industry-standard password hashing algorithm with proven security properties

For more details on the bcrypt integration, see [ZKP-Bcrypt Integration Specification](../specs/security/zkp-bcrypt-integration.md).

## CSRF Protection

All API endpoints are protected against Cross-Site Request Forgery (CSRF) attacks:

- CSRF tokens are required for all state-changing operations
- Tokens are validated on the server before processing requests
- Tokens are tied to the user's session

## Rate Limiting

To prevent brute force attacks, the system implements rate limiting:

- Failed login attempts are limited
- Account lockout after multiple failed attempts
- Exponential backoff for repeated failures

## Data Security

User data is protected through multiple mechanisms:

- Tenant isolation ensures data separation
- Role-based access control limits data access
- Sensitive data is encrypted at rest

## Secure Development Practices

The development process follows security best practices:

- Regular security audits
- Dependency scanning for vulnerabilities
- Secure code review process
- Security testing as part of CI/CD pipeline
