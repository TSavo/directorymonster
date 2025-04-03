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

## Prerequisites

Before deploying the ZKP authentication system to production, ensure you have the following:

- Node.js 18.x or later
- npm 8.x or later
- Docker and Docker Compose (for containerized deployment)
- Access to a production server with at least 4GB RAM and 2 CPU cores
- SSL certificate for secure communication
- Git access to the repository

## System Requirements

The ZKP authentication system has the following system requirements:

- **CPU**: Minimum 2 cores, recommended 4 cores
- **RAM**: Minimum 4GB, recommended 8GB
- **Disk Space**: Minimum 10GB, recommended 20GB
- **Network**: Stable internet connection with low latency
- **Operating System**: Linux (Ubuntu 20.04 LTS or later recommended)

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

### Option 2: Docker Installation (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/TSavo/directorymonster.git
   cd directorymonster
   ```

2. Build and run the Docker container:
   ```bash
   docker-compose -f docker-compose.zkp.yml up -d
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
```

Replace the placeholder values with your actual production values.

### Circuit Configuration

The ZKP authentication system uses a circuit file to generate and verify proofs. The circuit is compiled during the setup process, but you can customize it by modifying the `scripts/zkp-setup.ts` file.

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
   docker build -f Dockerfile.zkp -t directorymonster-zkp:latest .
   ```

2. Run the Docker container:
   ```bash
   docker run -d -p 3000:3000 --env-file .env --name directorymonster-zkp directorymonster-zkp:latest
   ```

### Option 3: Kubernetes Deployment

1. Apply the Kubernetes configuration:
   ```bash
   kubectl apply -f k8s/zkp-auth-deployment.yaml
   kubectl apply -f k8s/zkp-auth-service.yaml
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

### Metrics

The ZKP authentication system exposes metrics at the `/metrics` endpoint in Prometheus format.

## Troubleshooting

### Common Issues

1. **Circuit Compilation Fails**:
   - Ensure you have enough memory available
   - Check that the circuit file is valid
   - Try running `npm run zkp:setup` with the `--verbose` flag

2. **Proof Verification Fails**:
   - Ensure the verification key is correctly loaded
   - Check that the inputs are in the correct format
   - Verify that the circuit hasn't been modified since the keys were generated

3. **Performance Issues**:
   - Increase the available memory
   - Consider using a more powerful server
   - Optimize the circuit by reducing the number of constraints

### Support

For additional support, please contact the development team or open an issue on GitHub.

## Security Considerations

### Key Management

- Store the proving and verification keys securely
- Rotate keys periodically
- Use different keys for different environments

### Input Validation

- Validate all inputs before passing them to the ZKP system
- Implement rate limiting to prevent DoS attacks
- Use proper error handling to avoid leaking sensitive information

### Audit Trail

- Log all authentication attempts
- Monitor for unusual patterns
- Implement alerting for suspicious activities

### Regular Updates

- Keep the ZKP authentication system up to date
- Apply security patches promptly
- Conduct regular security audits
