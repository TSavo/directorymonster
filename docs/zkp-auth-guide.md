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
   npm run zkp:setup
   ```

   This script performs the following steps:
   - Generates secure MDS matrix for the Poseidon hash function
   - Creates the ZKP authentication circuit
   - Compiles the circuit
   - Generates the proving key
   - Exports the verification key
   - Creates a test input file
   - Generates a witness
   - Generates a proof
   - Verifies the proof

### Docker Setup

To run the ZKP authentication system in Docker:

1. Start the Docker container:
   ```bash
   npm run zkp:docker
   ```

2. To stop the Docker container:
   ```bash
   npm run zkp:docker:down
   ```

3. To view logs:
   ```bash
   npm run zkp:docker:logs
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

// Get the ZKP provider instance
const zkp = ZKPProvider.getInstance();

// Generate a proof
async function login(username, password) {
  try {
    // Get the salt for the user
    const response = await fetch(`/api/auth/salt?username=${encodeURIComponent(username)}`);
    const { salt } = await response.json();
    
    // Generate a proof
    const input = { username, password, salt };
    const { proof, publicSignals } = await zkp.generateProof(input);
    
    // Send the proof to the server
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, proof, publicSignals })
    });
    
    return await loginResponse.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

#### Server-Side

```javascript
import { ZKPProvider } from '../lib/zkp/provider';
import { UserService } from '../lib/user-service';
import { AuditService } from '../lib/auth/audit-service';
import { IpBlocker } from '../lib/auth/ip-blocker';
import { CaptchaService } from '../lib/auth/captcha-service';

// Get the ZKP provider instance
const zkp = ZKPProvider.getInstance();
const userService = new UserService();
const auditService = new AuditService();
const ipBlocker = new IpBlocker();
const captchaService = new CaptchaService();

// Verify a proof
async function verifyLogin(req, res) {
  const { username, proof, publicSignals } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  try {
    // Check if IP is blocked
    const isBlocked = await ipBlocker.isBlocked(ip);
    if (isBlocked) {
      auditService.logSecurityEvent({
        type: 'BLOCKED_IP_ATTEMPT',
        ip,
        username,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ success: false, error: 'IP address is blocked' });
    }
    
    // Check if CAPTCHA is required
    const isCaptchaRequired = await captchaService.isCaptchaRequired(ip);
    if (isCaptchaRequired && !req.body.captchaToken) {
      auditService.logSecurityEvent({
        type: 'CAPTCHA_REQUIRED',
        ip,
        username,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        success: false, 
        error: 'CAPTCHA verification required', 
        captchaRequired: true 
      });
    }
    
    // Verify CAPTCHA if provided
    if (req.body.captchaToken) {
      const isValidCaptcha = await captchaService.verifyCaptcha(req.body.captchaToken, ip);
      if (!isValidCaptcha) {
        auditService.logSecurityEvent({
          type: 'INVALID_CAPTCHA',
          ip,
          username,
          timestamp: new Date().toISOString()
        });
        return res.status(400).json({ success: false, error: 'Invalid CAPTCHA' });
      }
    }
    
    // Apply progressive delay
    const delay = await ipBlocker.getProgressiveDelay(ip);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Get the user
    const user = await userService.getUserByUsername(username);
    if (!user) {
      await ipBlocker.recordFailedAttempt(ip);
      await captchaService.recordFailedAttempt(ip);
      
      auditService.logAuthenticationAttempt({
        username,
        ip,
        success: false,
        reason: 'User not found',
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Verify the proof
    try {
      const isValid = await zkp.verifyProof({
        proof,
        publicSignals,
        publicKey: user.publicKey
      });
      
      if (isValid) {
        // Record successful login
        await ipBlocker.recordSuccessfulLogin(ip);
        await captchaService.recordSuccessfulVerification(ip);
        
        // Log successful authentication
        auditService.logAuthenticationAttempt({
          username,
          ip,
          success: true,
          timestamp: new Date().toISOString()
        });
        
        // Generate a token
        const token = generateAuthToken(user);
        return res.status(200).json({ success: true, token });
      } else {
        throw new Error('Invalid proof');
      }
    } catch (error) {
      // Record failed attempt
      await ipBlocker.recordFailedAttempt(ip);
      await captchaService.recordFailedAttempt(ip);
      
      // Log failed authentication
      auditService.logAuthenticationAttempt({
        username,
        ip,
        success: false,
        reason: error.message,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ success: false, error: 'Authentication error' });
  }
}
```

## Security Features

The ZKP Authentication System includes several security features:

### 1. Zero-Knowledge Proofs

- **What it is**: A cryptographic method that allows one party to prove to another that they know a value without revealing the value itself.
- **How it works**: The system uses the Poseidon hash function with a secure MDS matrix to create a circuit that can verify a password without revealing it.
- **Benefits**: Even if the server is compromised, user passwords remain secure.

### 2. Domain Separation

- **What it is**: A technique to ensure that proofs generated for one purpose cannot be reused for another purpose.
- **How it works**: The system uses different domain constants for authentication and password reset operations.
- **Benefits**: Prevents replay attacks and ensures that proofs are used only for their intended purpose.

### 3. IP-Based Blocking

- **What it is**: A mechanism to block IP addresses that make too many failed login attempts.
- **How it works**: The system tracks failed login attempts by IP address and blocks IPs that exceed a threshold.
- **Benefits**: Prevents brute-force attacks and protects user accounts.

### 4. CAPTCHA Verification

- **What it is**: A challenge-response test to determine if the user is human.
- **How it works**: After a few failed login attempts, the system requires CAPTCHA verification.
- **Benefits**: Prevents automated attacks and adds an additional layer of security.

### 5. Progressive Delays

- **What it is**: A mechanism to add increasing delays after failed login attempts.
- **How it works**: The system adds a delay that increases with each failed attempt.
- **Benefits**: Makes brute-force attacks impractical by significantly increasing the time required.

### 6. Audit Logging

- **What it is**: A system to log authentication attempts and security events.
- **How it works**: The system logs all authentication attempts, including successful and failed attempts, with details such as username, IP address, and timestamp.
- **Benefits**: Provides a trail of evidence for security incidents and helps identify patterns of suspicious activity.

## Testing

### Running Tests

To run the ZKP authentication tests:

```bash
# Run all crypto tests
npm run test:crypto

# Run secure ZKP tests
npm run test:crypto:secure

# Run simplified ZKP tests
npm run test:crypto:simplified

# Run ZKP security measures tests
npm run test:crypto:security

# Run dynamic salt generation tests
npm run test:crypto:salt
```

### Test Coverage

The tests cover the following scenarios:

1. **Authentication Flow**: Tests the complete authentication flow from registration to login.
2. **Security Measures**: Tests IP blocking, CAPTCHA verification, and progressive delays.
3. **Salt Generation**: Tests dynamic salt generation and rotation.
4. **Error Handling**: Tests how the system handles various error conditions.
5. **Performance**: Tests the performance of proof generation and verification.

## Troubleshooting

### Common Issues

1. **Circuit Compilation Errors**:
   - **Problem**: Errors when compiling the circuit.
   - **Solution**: Ensure you have the correct version of Circom installed and that the circuit syntax is correct.

2. **Proof Verification Failures**:
   - **Problem**: Proofs are not being verified correctly.
   - **Solution**: Check that the salt and public key match, and that the proof was generated with the correct inputs.

3. **Performance Issues**:
   - **Problem**: Proof generation or verification is slow.
   - **Solution**: Optimize the circuit, use a smaller circuit, or use a more powerful machine.

4. **Path Issues**:
   - **Problem**: Files not found or incorrect paths.
   - **Solution**: Ensure all paths use `process.cwd()` for consistent access from the project root.

### Debugging

To debug the ZKP authentication system:

1. Enable debug logging:
   ```javascript
   // In src/lib/zkp/index.js
   const DEBUG = true;
   ```

2. Check the logs:
   ```bash
   npm run zkp:docker:logs
   ```

3. Use the test scripts:
   ```bash
   npm run test:crypto:secure -- --verbose
   ```

## Advanced Configuration

### Customizing Security Parameters

You can customize the security parameters in the `config.js` file:

```javascript
// In src/config.js
module.exports = {
  // ...
  ipBlocker: {
    maxFailedAttempts: 5,        // Number of failed attempts before blocking
    blockDuration: 15 * 60,      // Block duration in seconds (15 minutes)
    adminUsername: 'admin',      // Admin username that can bypass IP blocking
  },
  captcha: {
    enabled: true,               // Enable CAPTCHA verification
    siteKey: 'your-site-key',    // reCAPTCHA site key
    secretKey: 'your-secret-key', // reCAPTCHA secret key
    threshold: 3,                // Number of failed attempts before requiring CAPTCHA
  },
  audit: {
    enabled: true,               // Enable audit logging
    logLevel: 'info',            // Log level (debug, info, warn, error)
  },
  // ...
};
```

### Using a Different Hash Function

The system uses the Poseidon hash function by default, but you can use a different hash function by modifying the circuit:

1. Create a new circuit file with your hash function.
2. Update the `zkp-setup.ts` script to use your circuit.
3. Regenerate the proving and verification keys.

## References

1. [Circom Documentation](https://docs.circom.io/)
2. [SnarkJS Documentation](https://github.com/iden3/snarkjs)
3. [Poseidon Hash Function](https://www.poseidon-hash.info/)
4. [Zero-Knowledge Proofs: An Illustrated Primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
5. [Introduction to zk-SNARKs](https://consensys.net/blog/blockchain-explained/zero-knowledge-proofs-starks-vs-snarks/)
