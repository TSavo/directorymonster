# Directory Monster Security Documentation

## Authentication System

Directory Monster uses a secure authentication system that combines Zero-Knowledge Proofs (ZKP) with bcrypt password hashing to provide multiple layers of security.

### Zero-Knowledge Proof Authentication with bcrypt Integration

The ZKP authentication system allows users to prove they know their password without actually sending the password to the server. This prevents password interception and server-side password leaks. The system is enhanced with bcrypt password hashing for additional security.

Key features:
- Passwords never leave the client
- Passwords are hashed with bcrypt before ZKP generation
- Server stores only public keys, not password hashes
- Authentication is cryptographically secure
- Worker pool for concurrent authentication processing
- Protection against replay and man-in-the-middle attacks

### Bcrypt Password Hashing

As an additional security measure, passwords are hashed using bcrypt before being used in the ZKP system. This provides defense in depth:

- If the ZKP system is compromised, passwords remain protected by bcrypt
- Configurable bcrypt work factor can be adjusted as hardware improves
- Industry-standard password hashing algorithm with proven security properties
- Full hash values without truncation for maximum security

For more details on the bcrypt integration, see [ZKP-Bcrypt Integration Specification](../specs/security/bcrypt-zkp-improvements.md).

## CSRF Protection

All API endpoints are protected against Cross-Site Request Forgery (CSRF) attacks:

- CSRF tokens are required for all state-changing operations
- Tokens are validated on the server before processing requests
- Tokens are tied to the user's session

## Security Measures

### Rate Limiting

To prevent brute force attacks, the system implements rate limiting with exponential backoff:

- Failed login attempts are limited with configurable thresholds
- Exponential backoff increases delays between attempts
- Rate limits are tracked per IP address and username
- Comprehensive logging of rate limit events

### IP Blocking

The system implements IP blocking to prevent malicious access attempts:

- IP addresses are blocked after multiple failed login attempts
- Block duration is based on IP risk level
- Risk levels are dynamically adjusted based on behavior
- Administrators can manually block or unblock IP addresses

### CAPTCHA Verification

The system requires CAPTCHA verification after multiple failed attempts:

- CAPTCHA threshold is based on IP risk level
- Multiple CAPTCHA providers are supported
- CAPTCHA verification is required for high-risk IPs
- CAPTCHA requirement is reset after successful authentication

### Concurrency Management

The system manages concurrent authentication requests to prevent resource exhaustion:

- Worker pool for concurrent processing of authentication requests
- Configurable concurrency limits
- Graceful degradation when limits are reached
- Fair scheduling of authentication requests

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
