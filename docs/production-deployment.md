# Production Deployment Guide for ZKP Authentication System

This guide provides detailed instructions for deploying the Zero-Knowledge Proof (ZKP) authentication system to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)
9. [Reproducibility](#reproducibility)

## Prerequisites

Before deploying the ZKP authentication system to production, ensure you have the following:

- Node.js 18.x or later
- npm 8.x or later
- Docker and Docker Compose (for containerized deployment)
- Access to a production server with at least 4GB RAM and 2 CPU cores
- SSL certificate for secure communication
- Git access to the repository
- Redis server for storing user data and session information

## System Requirements

The ZKP authentication system has the following system requirements:

- **CPU**: Minimum 2 cores, recommended 4 cores
- **RAM**: Minimum 4GB, recommended 8GB
- **Disk Space**: Minimum 10GB, recommended 20GB
- **Network**: Stable internet connection with low latency
- **Operating System**: Linux (Ubuntu 20.04 LTS or later recommended)
- **Redis**: Version 6.0 or later

## Installation

### Option 1: Direct Installation

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
   This command will:
   - Compile the Poseidon circuit
   - Generate the proving and verification keys
   - Set up the necessary files for the ZKP authentication system

### Option 2: Docker Installation (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/TSavo/directorymonster.git
   cd directorymonster
   ```

2. Build and run the Docker container:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3000
NODE_ENV=production

# ZKP Authentication Configuration
ZKP_AUTH_ENABLED=true
ZKP_AUTH_CIRCUIT_PATH=/app/circuits/zkp_auth
ZKP_AUTH_WASM_PATH=/app/circuits/zkp_auth/zkp_auth_js/zkp_auth.wasm
ZKP_AUTH_ZKEY_PATH=/app/circuits/zkp_auth/zkp_auth_final.zkey
ZKP_AUTH_VKEY_PATH=/app/circuits/zkp_auth/verification_key.json

# Security Configuration
SESSION_SECRET=your-very-secure-session-secret
JWT_SECRET=your-very-secure-jwt-secret
JWT_EXPIRATION=86400 # 24 hours in seconds

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Rate Limiting Configuration
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=60000 # 1 minute in milliseconds
IP_BLOCK_THRESHOLD=10
IP_BLOCK_DURATION_MS=3600000 # 1 hour in milliseconds

# CAPTCHA Configuration
CAPTCHA_ENABLED=true
CAPTCHA_SECRET=your-captcha-secret
CAPTCHA_SITE_KEY=your-captcha-site-key
```

Replace the placeholder values with your actual production values.

### Circuit Configuration

The ZKP authentication system uses the Poseidon circuit from circomlib to generate and verify proofs. The circuit is compiled during the setup process, but you can customize it by modifying the `circuits/zkp_auth/zkp_auth.circom` file.

## Deployment

### Option 1: Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the application:
   ```bash
   npm start
   ```

### Option 2: Docker Deployment (Recommended)

1. Build the Docker image:
   ```bash
   docker build -t directorymonster:latest .
   ```

2. Run the Docker container:
   ```bash
   docker run -d -p 3000:3000 --env-file .env --name directorymonster directorymonster:latest
   ```

### Option 3: Kubernetes Deployment

1. Apply the Kubernetes configuration:
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   ```

## Monitoring

### Health Checks

The ZKP authentication system provides health check endpoints:

- `/api/health`: Basic health check
- `/api/health/zkp`: ZKP-specific health check

### Logging

Logs are written to the following locations:

- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- ZKP-specific logs: `logs/zkp.log`
- Authentication logs: `logs/auth.log`

### Metrics

The ZKP authentication system exposes metrics at the `/metrics` endpoint in Prometheus format. Key metrics include:

- Authentication attempts (success/failure)
- Proof generation time
- Proof verification time
- Rate limiting events
- IP blocking events

## Troubleshooting

### Common Issues

1. **Circuit Compilation Fails**:
   - Ensure you have enough memory available (at least 4GB)
   - Check that the circuit file is valid
   - Try running `npm run zkp:setup` with the `--verbose` flag
   - Verify that circom is installed correctly

2. **Proof Verification Fails**:
   - Ensure the verification key is correctly loaded
   - Check that the inputs are in the correct format
   - Verify that the circuit hasn't been modified since the keys were generated
   - Check the salt retrieval process

3. **Performance Issues**:
   - Increase the available memory
   - Consider using a more powerful server
   - Optimize the circuit by reducing the number of constraints
   - Implement caching for verification keys

4. **Redis Connection Issues**:
   - Verify that Redis is running
   - Check the Redis connection string
   - Ensure the Redis password is correct
   - Verify that the Redis server is accessible from the application

### Support

For additional support, please contact the development team or open an issue on GitHub.

## Security Considerations

### Key Management

- Store the proving and verification keys securely
- Rotate keys periodically
- Use different keys for different environments
- Implement proper access controls for key files

### Input Validation

- Validate all inputs before passing them to the ZKP system
- Implement rate limiting to prevent DoS attacks
- Use proper error handling to avoid leaking sensitive information
- Sanitize all user inputs to prevent injection attacks

### Audit Trail

- Log all authentication attempts
- Monitor for unusual patterns
- Implement alerting for suspicious activities
- Store audit logs securely and for an appropriate duration

### Security Measures

- Implement rate limiting for all authentication endpoints
- Use IP blocking for repeated failed attempts
- Implement progressive delays for login attempts
- Require CAPTCHA verification after a few failed attempts
- Use secure HTTP headers (HSTS, CSP, etc.)
- Implement proper CSRF protection

### Regular Updates

- Keep the ZKP authentication system up to date
- Apply security patches promptly
- Conduct regular security audits
- Stay informed about new vulnerabilities in dependencies

## Reproducibility

The ZKP authentication system is designed to be reproducible, meaning that the same inputs will always produce the same outputs. This is important for security and reliability.

### Deterministic Circuit Compilation

The circuit compilation process is deterministic, meaning that the same circuit file will always produce the same compiled circuit. This is ensured by:

- Using a specific version of circom (2.0.0)
- Using a specific version of circomlib (2.0.5)
- Using a specific version of snarkjs (0.7.0)

### Deterministic Key Generation

The key generation process is deterministic, meaning that the same circuit will always produce the same proving and verification keys. This is ensured by:

- Using a specific version of snarkjs (0.7.0)
- Using a specific entropy source for key generation
- Using a specific curve (bn128)

### Deterministic Proof Generation and Verification

The proof generation and verification processes are deterministic, meaning that the same inputs will always produce the same proof, and the same proof will always verify the same way. This is ensured by:

- Using a specific version of snarkjs (0.7.0)
- Using a specific curve (bn128)
- Using a specific protocol (groth16)

### Verification

To verify that the system is working correctly, you can run the following tests:

```bash
# Run all crypto tests
npm run test:crypto

# Run secure ZKP tests
npm run test:crypto:secure

# Run simplified ZKP tests
npm run test:crypto:simplified

# Run security measures tests
npm run test:crypto:security

# Run dynamic salt generation tests
npm run test:crypto:salt
```

These tests verify that the ZKP authentication system is working correctly and that it provides the expected security properties.
