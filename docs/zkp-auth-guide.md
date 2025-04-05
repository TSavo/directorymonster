# Zero-Knowledge Proof Authentication System Guide

## Overview

The Zero-Knowledge Proof (ZKP) Authentication System provides a secure way to authenticate users without revealing their passwords. This guide explains how to set up, use, and test the system.

## Table of Contents

1. [Setup](#setup)
2. [Usage](#usage)
3. [Security Features](#security-features)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Configuration](#advanced-configuration)
7. [References](#references)

## Setup

### Prerequisites

- Node.js 16 or higher
- npm 7 or higher
- Docker (optional, for containerized setup)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TSavo/directorymonster.git
   cd directorymonster
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the ZKP authentication system:
   ```bash
   npm run setup

   # Or use the detailed setup command
   npm run zkp:setup
   ```

   This script performs the following steps:
   - Generates secure MDS matrix for the Poseidon hash function
   - Creates the ZKP authentication circuit
   - Compiles the circuit
   - Generates the proving key
   - Sets up bcrypt integration with configurable work factor
   - Configures the worker pool for concurrent authentication
   - Sets up CAPTCHA verification with risk-based thresholds
   - Configures IP blocking with risk-based security measures
   - Exports the verification key
   - Creates a test input file
   - Generates a witness
   - Generates a proof
   - Verifies the proof

### Docker Setup

To run the ZKP authentication system in Docker:

1. Start the Docker container:
   ```bash
   npm run docker:zkp:up
   ```

2. To stop the Docker container:
   ```bash
   npm run docker:zkp:down
   ```

3. To view logs:
   ```bash
   npm run docker:zkp:logs
   ```

## Usage

### Authentication Flow

1. **Registration**:
   - User provides username and password
   - System generates a random salt
   - System computes the public key using the ZKP circuit
   - System stores the username, salt, and public key (but not the password)

2. **Authentication**:
   - User provides username and password
   - System retrieves the salt for the username
   - Client generates a proof that it knows the password that corresponds to the public key
   - Server verifies the proof without learning the password

### API Usage

#### Client-Side

```javascript
import { ZKPProvider } from '../lib/zkp/provider';
import { generateZKPWithBcrypt } from '../lib/zkp/zkp-bcrypt';
import { CaptchaWidget } from '../components/admin/auth/CaptchaWidget';

// Get the ZKP provider instance
const zkp = ZKPProvider.getInstance();

// Generate a proof with bcrypt integration
async function login(username, password, captchaToken) {
  try {
    // Get the salt for the user
    const response = await fetch(`/api/auth/salt?username=${encodeURIComponent(username)}`);
    const { salt, requireCaptcha } = await response.json();

    // Check if CAPTCHA is required
    if (requireCaptcha && !captchaToken) {
      return { success: false, requireCaptcha: true, message: 'CAPTCHA verification required' };
    }

    // Generate a proof with bcrypt integration
    const proof = await generateZKPWithBcrypt(username, password, salt);

    // Send the proof to the server
    const loginResponse = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      },
      body: JSON.stringify({
        username,
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        captchaToken: captchaToken // Include CAPTCHA token if available
      })
    });

    const result = await loginResponse.json();

    // Handle rate limiting and IP blocking
    if (!result.success) {
      if (result.requireCaptcha) {
        // Show CAPTCHA widget
        return { ...result, requireCaptcha: true };
      }

      if (result.rateLimited) {
        // Handle rate limiting with exponential backoff
        return { ...result, rateLimited: true };
      }

      if (result.ipBlocked) {
        // Handle IP blocking
        return { ...result, ipBlocked: true };
      }
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

#### Server-Side

```javascript
import { ZKPProvider } from '../lib/zkp/provider';
import { verifyZKPWithBcrypt } from '../lib/zkp/zkp-bcrypt';
import { UserService } from '../lib/user-service';
import { AuditService, AuditAction, AuditSeverity } from '../lib/audit/audit-service';
import { isIpBlocked, recordFailedAttempt, resetFailedAttempts, getIpRiskLevel } from '../lib/auth/ip-blocker';
import { verifyCaptcha, getCaptchaThreshold, recordFailedAttemptForCaptcha, resetCaptchaRequirement } from '../lib/auth/captcha-service';
import { getAuthWorkerPool } from '../lib/auth/worker-pool';
import { trackAuthRequest, completeAuthRequest } from '../lib/auth/concurrency';
import { withRateLimit } from '../middleware/withRateLimit';

// Get the ZKP provider instance and worker pool
const zkp = ZKPProvider.getInstance();
const workerPool = getAuthWorkerPool();
const userService = new UserService();

// Verify a proof with bcrypt integration
async function verifyAuth(req) {
  const { username, proof, publicSignals, captchaToken } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    // Check if IP is blocked
    const isBlocked = await isIpBlocked(ip);
    if (isBlocked) {
      // Log the blocked attempt
      await AuditService.logEvent({
        action: AuditAction.IP_BLOCKED,
        ip,
        userAgent,
        severity: AuditSeverity.MEDIUM,
        details: { reason: 'IP address is blocked' }
      });

      return { success: false, error: 'IP address is blocked', ipBlocked: true };
    }

    // Check if CAPTCHA is required
    const captchaThreshold = await getCaptchaThreshold(ip);
    const failedAttempts = await getFailedAttempts(ip, username);
    const requireCaptcha = failedAttempts >= captchaThreshold;

    if (requireCaptcha && !captchaToken) {
      return { success: false, requireCaptcha: true, message: 'CAPTCHA verification required' };
    }

    // Verify CAPTCHA if provided
    if (captchaToken) {
      const isCaptchaValid = await verifyCaptcha(captchaToken, ip);
      if (!isCaptchaValid) {
        await recordFailedAttemptForCaptcha(ip);
        return { success: false, error: 'Invalid CAPTCHA', requireCaptcha: true };
      }
    }

    // Track concurrent authentication requests
    const canProceed = await trackAuthRequest(username);
    if (!canProceed) {
      return { success: false, error: 'Authentication system is busy. Please try again later.', rateLimited: true };
    }
    try {
      // Get the user from the database
      const user = await userService.getUserByUsername(username);
      if (!user) {
        // Complete the authentication request to release resources
        await completeAuthRequest(username);

        // Record failed attempt
        await recordFailedAttempt(ip, username, userAgent);
        await recordFailedAttemptForCaptcha(ip);

        // Log the failed attempt
        await AuditService.logEvent({
          action: AuditAction.FAILED_LOGIN,
          username,
          ip,
          userAgent,
          severity: AuditSeverity.LOW,
          details: { reason: 'User not found' }
        });

        return { success: false, error: 'Invalid username or password' };
      }

      // Use the worker pool to verify the proof
      const verificationResult = await workerPool.executeTask({
        type: 'verify',
        proof,
        publicSignals,
        publicKey: user.publicKey
      });

      // Complete the authentication request to release resources
      await completeAuthRequest(username);

      if (!verificationResult.success || !verificationResult.result) {
        // Record failed attempt
        await recordFailedAttempt(ip, username, userAgent);
        await recordFailedAttemptForCaptcha(ip);

        // Log the failed attempt
        await AuditService.logEvent({
          action: AuditAction.FAILED_LOGIN,
          username,
          ip,
          userAgent,
          severity: AuditSeverity.LOW,
          details: { reason: 'Invalid proof' }
        });

        return { success: false, error: 'Invalid username or password' };
      }

      // Authentication successful
      // Reset failed attempts
      await resetFailedAttempts(ip);
      await resetCaptchaRequirement(ip);

      // Update last login time
      const updatedUser = await userService.updateLastLogin(username);

      // Log the successful login
      await AuditService.logEvent({
        action: AuditAction.SUCCESSFUL_LOGIN,
        username,
        ip,
        userAgent,
        severity: AuditSeverity.INFO,
        details: { userId: user.id }
      });

      // Generate a JWT token
      const token = generateToken(user);

      return {
        success: true,
        token,
        user: {
          username: user.username,
          role: user.role,
          id: user.id,
          lastLogin: updatedUser.lastLogin,
        },
      };
    } catch (error) {
      // Complete the authentication request to release resources
      await completeAuthRequest(username);

      // Log the error
      console.error('Error during authentication:', error);

      // Log the error to the audit service
      await AuditService.logEvent({
        action: AuditAction.AUTHENTICATION_ERROR,
        username,
        ip,
        userAgent,
        severity: AuditSeverity.HIGH,
        details: { error: error.message }
      });

      return { success: false, error: 'Authentication error' };
  } catch (error) {
    // Complete the authentication request to release resources
    if (username) {
      await completeAuthRequest(username);
    }

    // Log the error
    console.error('Error during authentication:', error);

    return { success: false, error: 'Authentication error' };
  }
}

// Wrap the verification function with rate limiting
export const POST = withRateLimit(
  async (req) => {
    return verifyAuth(req);
  },
  {
    limit: 10,
    windowInSeconds: 60,
    identifierFn: (req) => {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      return `login:${ip}`;
    }
  }
);
```

## Security Features

The ZKP Authentication System includes several security features to protect against various attacks:

### bcrypt Password Hashing

Passwords are hashed using bcrypt before being used in the ZKP system. This provides defense in depth:

- If the ZKP system is compromised, passwords remain protected by bcrypt
- Configurable bcrypt work factor can be adjusted as hardware improves
- Industry-standard password hashing algorithm with proven security properties

### Rate Limiting

To prevent brute force attacks, the system implements rate limiting with exponential backoff:

- Failed login attempts are limited with configurable thresholds
- Exponential backoff increases delays between attempts
- Rate limits are tracked per IP address and username

### IP Blocking

The system implements IP blocking to prevent malicious access attempts:

- IP addresses are blocked after multiple failed login attempts
- Block duration is based on IP risk level
- Risk levels are dynamically adjusted based on behavior

### CAPTCHA Verification

The system requires CAPTCHA verification after multiple failed attempts:

- CAPTCHA threshold is based on IP risk level
- Multiple CAPTCHA providers are supported
- CAPTCHA verification is required for high-risk IPs

### Worker Pool

The system uses a worker pool for concurrent processing of authentication requests:

- Multiple authentication requests can be processed simultaneously
- Configurable concurrency limits prevent resource exhaustion
- Graceful degradation when limits are reached
- Fair scheduling of authentication requests

### Audit Logging

The system logs authentication events for security auditing:

- Successful and failed login attempts are logged
- IP blocking events are logged
- CAPTCHA verification events are logged
- Authentication errors are logged
- Logs include severity levels for filtering

### Concurrency Management

The system manages concurrent authentication requests to prevent resource exhaustion:

- Limits the number of concurrent authentication requests
- Tracks authentication requests per username
- Releases resources after authentication completes
- Prevents denial-of-service attacks

## Testing

The ZKP Authentication System includes comprehensive tests to ensure security and functionality:

### Unit Tests

```bash
# Run bcrypt integration tests
npx jest tests/lib/zkp/zkp-bcrypt.test.ts

# Run worker pool tests
npx jest tests/lib/auth/worker-pool.test.ts

# Run CAPTCHA service tests
npx jest tests/lib/auth/captcha-service.test.ts

# Run IP blocker tests
npx jest tests/lib/auth/ip-blocker.test.ts
```

### Integration Tests

```bash
# Run authentication flow tests
npx jest tests/integration/auth/authentication-flow.test.ts

# Run security measures tests
npx jest tests/integration/auth/security-measures.test.ts

# Run edge cases tests
npx jest tests/integration/auth/edge-cases.test.ts
```

### Security Tests

```bash
# Run all security tests
npm run test:all-security

# Run ZKP security measures tests
npx jest tests/crypto/zkp-security-measures.test.ts
```

## Troubleshooting

### Common Issues

#### CAPTCHA Verification Failed

If CAPTCHA verification fails, check the following:

- Ensure the CAPTCHA token is valid and not expired
- Verify that the correct CAPTCHA provider is configured
- Check that the CAPTCHA secret key is correctly set in environment variables

#### IP Blocking

If an IP address is blocked, you can unblock it using the admin interface or directly through Redis:

```bash
# Connect to Redis
redis-cli

# List all blocked IPs
KEYS auth:blocked:ip:*

# Unblock a specific IP
DEL auth:blocked:ip:192.168.1.1
```

#### Worker Pool Errors

If you encounter worker pool errors, check the following:

- Ensure the worker pool is properly initialized
- Check that the concurrency limits are appropriate for your hardware
- Verify that the worker pool is properly shut down when not in use

## Advanced Configuration

### Environment Variables

The ZKP Authentication System can be configured using the following environment variables:

```
# bcrypt Configuration
BCRYPT_WORK_FACTOR=12  # Default is 10 if not specified

# CAPTCHA Configuration
RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
CAPTCHA_THRESHOLD=3  # Number of failed attempts before CAPTCHA is required

# IP Blocking Configuration
IP_BLOCK_DURATION=86400  # Duration in seconds (24 hours)
MAX_FAILED_ATTEMPTS=5  # Number of failed attempts before IP is blocked

# Worker Pool Configuration
WORKER_POOL_SIZE=4  # Number of workers in the pool
MAX_CONCURRENT_AUTH=10  # Maximum number of concurrent authentication requests
```

## Security Features

The ZKP Authentication System includes several security features:

### 1. Zero-Knowledge Proofs with bcrypt Integration

- **What it is**: A cryptographic method that allows one party to prove to another that they know a value without revealing the value itself, enhanced with bcrypt password hashing.
- **How it works**: The system hashes passwords with bcrypt before using them in the ZKP circuit, which uses the Poseidon hash function with a secure MDS matrix.
- **Benefits**: Even if the server is compromised, user passwords remain secure with multiple layers of protection.

### 2. bcrypt Password Hashing

- **What it is**: An industry-standard password hashing algorithm designed to be slow and computationally intensive.
- **How it works**: The system hashes passwords using bcrypt with a configurable work factor before using them in the ZKP system.
- **Benefits**: Provides defense in depth, with the work factor adjustable as hardware improves.

### 3. Worker Pool for Concurrent Authentication

- **What it is**: A system for processing multiple authentication requests simultaneously.
- **How it works**: The system maintains a pool of worker threads that can process authentication requests concurrently.
- **Benefits**: Improves performance and prevents denial-of-service attacks by managing resources efficiently.

### 4. Risk-Based IP Blocking

- **What it is**: A mechanism to block IP addresses that make too many failed login attempts, with block duration based on risk level.
- **How it works**: The system tracks failed login attempts by IP address, assigns risk levels, and blocks IPs that exceed thresholds.
- **Benefits**: Prevents brute-force attacks and adapts security measures based on threat levels.

### 5. CAPTCHA Verification with Risk-Based Thresholds

- **What it is**: A challenge-response test to determine if the user is human, with thresholds based on IP risk level.
- **How it works**: After a few failed login attempts, the system requires CAPTCHA verification, with the threshold adjusted based on IP risk level.
- **Benefits**: Prevents automated attacks and adds an additional layer of security that adapts to threat levels.

### 6. Exponential Backoff for Rate Limiting

- **What it is**: A mechanism to add increasing delays after failed login attempts.
- **How it works**: The system implements rate limiting with exponential backoff, increasing delays between attempts.
- **Benefits**: Makes brute-force attacks impractical by significantly increasing the time required.

### 7. Comprehensive Audit Logging

- **What it is**: A system to log authentication attempts and security events with severity levels.
- **How it works**: The system logs all authentication events, including successful and failed attempts, IP blocking, CAPTCHA verification, and errors.
- **Benefits**: Provides a trail of evidence for security incidents and helps identify patterns of suspicious activity.

### 8. Concurrency Management

- **What it is**: A system to manage concurrent authentication requests and prevent resource exhaustion.
- **How it works**: The system tracks authentication requests per username and limits the number of concurrent requests.
- **Benefits**: Prevents denial-of-service attacks and ensures fair access to authentication resources.

## References

- [bcrypt-ZKP Integration Specification](../specs/security/bcrypt-zkp-integration.md)
- [ZKP Authentication Specification](./zkp-authentication.md)
- [Security Documentation](./security.md)
- [bcrypt-ZKP Improvements](../specs/security/bcrypt-zkp-improvements.md)
- [Security Components Test Coverage](../specs/security/security-components-test-coverage.md)

