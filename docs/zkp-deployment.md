# Zero-Knowledge Proof Authentication System Deployment Guide

## Overview

This guide provides instructions for deploying the Zero-Knowledge Proof (ZKP) Authentication System in a production environment. The system allows users to prove they know their password without revealing it, providing a secure authentication mechanism that protects user credentials even in the event of a server compromise.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Monitoring](#monitoring)
6. [Backup and Recovery](#backup-and-recovery)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

## Prerequisites

Before deploying the ZKP Authentication System, ensure you have the following:

- Node.js 16 or higher
- npm 7 or higher
- Docker and Docker Compose (for containerized deployment)
- Redis (for session management and rate limiting)
- A domain name with SSL certificate
- Access to a production server with at least 2GB RAM and 2 CPU cores

## Installation

### Option 1: Direct Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TSavo/directorymonster.git
   cd directorymonster
   ```

2. Install dependencies:
   ```bash
   npm install --production
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Set up the ZKP authentication system:
   ```bash
   npm run zkp:setup
   ```

### Option 2: Docker Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TSavo/directorymonster.git
   cd directorymonster
   ```

2. Build and start the Docker containers:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=1d
CAPTCHA_SITE_KEY=your-captcha-site-key
CAPTCHA_SECRET_KEY=your-captcha-secret-key

# ZKP Authentication
ZKP_ENABLED=true
ZKP_CIRCUIT_PATH=/app/circuits/zkp_auth/zkp_auth.circom
ZKP_VERIFICATION_KEY_PATH=/app/circuits/zkp_auth/verification_key.json
ZKP_WASM_PATH=/app/circuits/zkp_auth/zkp_auth_js/zkp_auth.wasm
ZKP_ZKEY_PATH=/app/circuits/zkp_auth/zkp_auth_final.zkey

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
```

Replace the placeholder values with your actual configuration.

### Security Configuration

Update the security configuration in `src/config.js`:

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
    siteKey: process.env.CAPTCHA_SITE_KEY,
    secretKey: process.env.CAPTCHA_SECRET_KEY,
    threshold: 3,                // Number of failed attempts before requiring CAPTCHA
  },
  audit: {
    enabled: process.env.AUDIT_LOG_ENABLED === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  // ...
};
```

## Deployment

### Option 1: Direct Deployment

1. Start the application:
   ```bash
   npm start
   ```

2. For production deployment, use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "directorymonster" -- start
   pm2 save
   pm2 startup
   ```

### Option 2: Docker Deployment

1. Deploy using Docker Compose:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. For Kubernetes deployment, use the provided Kubernetes manifests:
   ```bash
   kubectl apply -f kubernetes/
   ```

### Nginx Configuration

For production deployment, use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring

### Health Checks

The application provides health check endpoints:

- `/api/health`: Basic health check
- `/api/health/detailed`: Detailed health check including Redis connection status

### Logging

Logs are written to the following locations:

- Application logs: `logs/app.log`
- Audit logs: `logs/audit.log`
- Error logs: `logs/error.log`

### Metrics

The application exposes metrics at the `/api/metrics` endpoint in Prometheus format. You can use Prometheus and Grafana to monitor the application.

## Backup and Recovery

### Backup

1. Back up the ZKP authentication files:
   ```bash
   tar -czvf zkp-auth-backup.tar.gz circuits/zkp_auth
   ```

2. Back up the Redis data:
   ```bash
   redis-cli --rdb redis-backup.rdb
   ```

### Recovery

1. Restore the ZKP authentication files:
   ```bash
   tar -xzvf zkp-auth-backup.tar.gz -C /path/to/directorymonster
   ```

2. Restore the Redis data:
   ```bash
   redis-cli shutdown
   cp redis-backup.rdb /var/lib/redis/dump.rdb
   redis-server
   ```

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
   tail -f logs/app.log
   tail -f logs/error.log
   ```

3. Use the test scripts:
   ```bash
   npm run test:crypto:secure -- --verbose
   ```

## Security Considerations

### Key Management

- Store the JWT secret securely and rotate it regularly.
- Protect the ZKP verification key and proving key.
- Use environment variables for sensitive configuration.

### Rate Limiting

The system includes rate limiting to prevent brute-force attacks:

- IP-based blocking after too many failed attempts
- Progressive delays for failed login attempts
- CAPTCHA verification after a few failed attempts

### Audit Logging

The system logs all authentication attempts and security events:

- Successful and failed login attempts
- IP blocking events
- CAPTCHA verification events
- Password reset attempts

### SSL/TLS

Always use HTTPS in production to protect data in transit:

- Use a valid SSL certificate
- Configure secure SSL/TLS protocols and ciphers
- Enable HTTP Strict Transport Security (HSTS)

### Regular Updates

Keep the system up to date:

- Regularly update dependencies
- Apply security patches promptly
- Monitor security advisories for the technologies used
