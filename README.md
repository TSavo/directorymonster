# DirectoryMonster

An SEO-focused multitenancy directory platform with AI-powered data collection.

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/TSavo/directorymonster?utm_source=oss&utm_medium=github&utm_campaign=TSavo%2Fdirectorymonster&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Overview

DirectoryMonster is a comprehensive platform combining:

1. **Next.js Web Application**
   - Multi-tenant directory sites with custom domains
   - Redis-based data storage
   - SEO optimization with backlink management
   - Secure Zero-Knowledge Proof (ZKP) authentication

2. **AI-Powered Python Scraper**
   - Selenium-based web scraping with LLM analysis
   - Automated data extraction and categorization
   - Flexible data export options

3. **Zero-Knowledge Proof Authentication**
   - Cryptographically secure authentication without password transmission
   - Poseidon hash function from circomlib for secure hashing
   - Dynamic salt generation for enhanced security
   - Rate limiting, IP blocking, and exponential backoff for brute force protection
   - CAPTCHA verification after multiple failed attempts
   - Docker-ready deployment for production environments
   - Enhanced security with bcrypt password hashing
   - Full hash values without truncation for maximum security
   - Cryptographic file integrity verification
   - Protection against division by zero attacks
   - Comprehensive security testing and verification
   - Replay attack prevention through session binding
   - Man-in-the-middle protection through username verification
   - Concurrent authentication support without security degradation

## Requirements

- **Node.js**: Version 14 or higher
- **npm**: Version 6 or higher
- **Docker** (optional): For containerized development and deployment
- **Redis** (optional): For production deployments

## Quick Start

### Simple Commands

Use these commands if you just want things to work without understanding all the details:

```bash
# Run the app in development mode
npm run run

# Build and run the app in production mode
npm run build

# Run all the tests
npm run test

# Verify everything is working
npm run verify

# Run everything in Docker
npm run docker

# Set up ZKP authentication
npm run setup
```

#### Windows-Specific Commands

For Windows users, PowerShell-based commands are available:

```powershell
# Run all tests (Windows)
npm run win:test

# Verify everything is working (Windows)
npm run win:verify

# Run everything in Docker (Windows)
npm run win:docker

# Set up ZKP authentication (Windows)
npm run win:setup
```

For a complete reference of all commands, see [Commands Documentation](docs/COMMANDS.md).

### Detailed Setup

### Docker Development (Recommended)

```bash
# Start development environment with hot reloading
docker-compose up -d

# View logs
docker-compose logs -f

# Windows convenience scripts
start-dev.bat    # Start environment
dev-reload.bat   # Quick restart
rebuild-dev.bat  # Full rebuild
```

This provides:
- Automatic hot reloading
- Redis configuration
- Multitenancy hostname resolution
- Consistent environment across all developers

### Local Development (Alternative)

```bash
# Install dependencies
npm install

# Start development server (background)
npm run dev &

# Seed sample data (required for testing)
npm run seed
```

## Key Features

### Multitenancy Architecture

- Multiple directory sites from a single codebase
- Domain-based routing and site identification
- Isolated content per site with shared infrastructure

### Admin Dashboard

- Comprehensive site management
- Modular, component-based UI architecture
- Mobile-responsive design with accessibility support
- Hierarchical category management

### Component Architecture

The platform uses a modular component structure:

```
components/admin/
├── sites/          # Site management
├── categories/     # Category management
├── listings/       # Listing management
├── dashboard/      # Admin dashboard
├── auth/           # Authentication
├── layout/         # Admin layout
└── utils/          # Shared utilities
```

### Data Collection

The Python scraper in `/python` provides:

```bash
# Install dependencies
cd python
pip install -r requirements.txt

# Run scraper with AI analysis
python run_scraper.py --count 10 --categories "hiking gear"
```

Data can be saved via:
- **FileEndpointSaver**: Local JSON storage
- **APIEndpointSaver**: Direct API integration
- **EnhancedFileEndpointSaver**: Advanced file operations

## Security Improvements

DirectoryMonster implements advanced security features, particularly in the Zero-Knowledge Proof (ZKP) authentication system:

### Password Hashing

- Replaced SHA-256 with bcrypt for password hashing
- Implemented proper salt generation and management
- Added protection against timing attacks
- Integrated bcrypt with ZKP for a defense-in-depth approach

### Cryptographic Improvements

- Fixed hash truncation issues to use full hash values
- Implemented proper Poseidon hash constants
- Increased Poseidon round parameters for enhanced security
- Added protection against division by zero attacks
- Implemented replay attack prevention through session binding
- Added man-in-the-middle protection through username verification

### Brute Force Protection

- Implemented rate limiting for authentication attempts
- Added IP blocking after too many failed attempts
- Implemented exponential backoff for login attempts
- Added CAPTCHA verification after multiple failed attempts
- Implemented comprehensive audit logging for security events

### Implementation Security

- Added integrity checks for cryptographic files
- Fixed privacy issues in ZKP circuits
- Fixed TypeScript reserved keyword issues
- Improved HTTP headers implementation
- Added support for concurrent authentication requests
- Implemented proper error handling for all security-related operations

### Security Verification

Verify the security of your installation with:

```bash
# Run all security checks
npm run verify

# Run specific security checks
npm run security:verify    # Verify file integrity
npm run security:check     # Run security tests and verify integrity
npm run security:audit     # Run security audit on dependencies
npm run security:all       # Run all security checks

# Run ZKP security measures tests
npx jest tests/crypto/zkp-security-measures.test.ts

# Run bcrypt integration tests
npx jest tests/lib/zkp-bcrypt.test.ts
```

For detailed information about security improvements, see [Security Documentation](docs/security/README.md) and [ZKP Security Checklist](docs/security/zkp-security-checklist.md).

## Testing

```bash
# Run all tests
npm run test

# Run verification tests
npm run verify

# Run tests with seeded data
npm run test:with:seed

# Run specific test types
npm run test:unit            # Unit tests
npm run test:integration     # Integration tests
npm run test:api             # API tests
npm run test:components      # Component tests

# Run specific component tests
npm run test:components:categories  # Category tests
npm run test:components:listings    # Listing tests

# Run crypto and security tests
npm run test:crypto          # All crypto tests
npm run test:crypto:core     # Core ZKP tests
npm run test:crypto:security # Security tests
npm run test:crypto:bcrypt   # bcrypt integration tests
npm run test:crypto:measures # Security measures tests

# Run end-to-end tests
npm run test:e2e             # Basic E2E tests
npm run test:e2e:all         # All E2E tests

# Run tests in Docker
npm run test:docker
```

The test suite covers:
- Component functionality and accessibility
- Domain resolution and multi-site isolation
- API endpoints and data management
- End-to-end user workflows
- ZKP authentication and security measures
- Dynamic salt generation and verification
- bcrypt integration with ZKP
- Rate limiting and IP blocking
- Exponential backoff for login attempts
- CAPTCHA verification
- Audit logging for security events
- Replay attack prevention
- Man-in-the-middle protection
- Concurrent authentication support

### Test-Driven Development

DirectoryMonster follows a strict TDD (Test-Driven Development) approach:

1. **Write tests first** before implementation code
2. **Follow Red-Green-Refactor cycle**:
   - Red: Write a failing test
   - Green: Write minimal code to pass the test
   - Refactor: Clean up code while ensuring tests still pass
3. **Tests as documentation** for future developers (including our future selves)

For detailed TDD guidelines, see [TDD Testing Specification](specs/TDD_TESTING_SPEC.md).

## Development Guidelines

1. **Always Use Docker** for consistent environment
2. **Component Architecture**:
   - Small, focused components with single responsibilities
   - Data fetching at the top level of server components
   - Props-based data flow (avoid prop drilling)
3. **CSS with Tailwind**:
   - Use `@import` instead of `@tailwind` in CSS files
   - Follow mobile-first responsive design
4. **Testing**:
   - Use TDD for all feature development
   - Test behavior, not implementation
   - Use data-testid attributes for selection
   - Cover accessibility requirements
5. **Git Workflow**:
   - Feature branches with descriptive names
   - Pull requests with comprehensive testing
   - CI verification before merging

## Configuration

### Environment Variables

```
REDIS_URL=redis://localhost:6379
AUTH_SECRET=your-auth-secret
```

### Local Domain Testing

Add to your hosts file:
```
127.0.0.1 fishinggearreviews.com
127.0.0.1 hikinggearreviews.com
127.0.0.1 fishing-gear.mydirectory.com
127.0.0.1 hiking-gear.mydirectory.com
```

Or use the `?hostname=` query parameter during development.

## Documentation

The project documentation is organized into implementation guides and specifications:

### Documentation Index
- [Documentation Index](DOCUMENTATION_INDEX.md) - Complete index of all documentation

### Implementation Guides
- [Docker Development](DOCKER-DEV.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Mocking Guide](docs/MOCKING_GUIDE.md)
- [Tenant Security Guide](docs/TENANT_SECURITY_GUIDE.md)

### Specifications
- [Testing Specification](specs/TESTING_SPEC.md)
- [TDD Testing Specification](specs/TDD_TESTING_SPEC.md)
- [Cross-Tenant Security Specification](specs/CROSS_TENANT_SECURITY_SPEC.md)
- [Multi-Tenant ACL Specification](specs/MULTI_TENANT_ACL_SPEC.md)
- [ZKP Authentication Specification](docs/zkp-authentication.md)

## Zero-Knowledge Proof Authentication

DirectoryMonster includes a cryptographically secure Zero-Knowledge Proof (ZKP) authentication system that allows users to prove they know their password without revealing it, providing a secure authentication mechanism that protects user credentials even in the event of a server compromise.

### Features

- **Secure Authentication**: Users can authenticate without transmitting passwords
- **Cryptographic Security**: Uses the Poseidon hash function from circomlib
- **Dynamic Salt Generation**: Each user has a unique, cryptographically secure salt
- **bcrypt Integration**: Passwords are securely hashed with bcrypt before ZKP generation
- **Security Measures**: Rate limiting, IP blocking, exponential backoff, and CAPTCHA verification
- **Audit Logging**: Comprehensive logging of authentication events
- **Docker Integration**: Ready for production deployment with Docker
- **TypeScript Implementation**: Fully typed implementation for better developer experience
- **Replay Attack Prevention**: Proofs are bound to specific sessions to prevent replay attacks
- **Man-in-the-Middle Protection**: Username verification prevents MITM attacks
- **Concurrent Authentication**: Multiple authentication requests can be handled simultaneously
- **Admin Bypass**: Administrators can bypass IP blocking for legitimate purposes

### Authentication Flow

1. **First User Setup**:
   - First user provides username and password
   - System generates a cryptographically secure random salt
   - System computes the public key using the ZKP circuit
   - System stores the username, salt, and public key (but not the password)

2. **User Authentication**:
   - User provides username and password
   - Password is hashed using bcrypt for additional security
   - System retrieves the salt for the username
   - Client generates a proof that it knows the password that corresponds to the public key
   - Server verifies the proof without learning the password
   - System checks for rate limiting, IP blocking, and other security measures
   - System implements exponential backoff for failed login attempts
   - CAPTCHA verification is required after multiple failed attempts
   - All authentication events are logged for security auditing

3. **Password Reset**:
   - User requests password reset
   - System generates a reset token and sends it to the user's email
   - User provides new password and reset token
   - System verifies the reset token
   - System generates a new salt and public key
   - System updates the user's salt and public key

### Usage

```typescript
import { generateProof, verifyProof, generateSalt, derivePublicKey } from '@/lib/zkp';
import { hashPassword, verifyPassword, generateZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';

// Generate a salt
const salt = generateSalt();

// Generate a bcrypt salt with custom rounds
const bcryptSalt = await generateBcryptSalt(12); // 12 salt rounds

// Hash a password with bcrypt (uses BCRYPT_WORK_FACTOR env var or defaults to 10)
const hashedPassword = await hashPassword('password');

// Hash with custom salt rounds
const customHashedPassword = await hashPassword('password', 12);

// Verify a password against a hash
const isPasswordValid = await verifyPassword('password', hashedPassword);

// Generate a public key
const publicKey = await generatePublicKey('username', 'password', salt);

// Generate a proof with bcrypt integration
const { proof, publicSignals } = await generateZKPWithBcrypt('username', 'password', salt);

// Generate a standard proof
const standardProof = await generateProof({
  username: 'username',
  password: hashedPassword, // Use the hashed password
  salt: salt
});

// Verify a proof
const isValid = await verifyProof({
  proof,
  publicSignals,
  publicKey
});
```

### Setup

```bash
# Set up the ZKP authentication system
npm run zkp:setup

# Run tests to verify the setup
npm run test:crypto

# Run security measures tests
npx jest tests/crypto/zkp-security-measures.test.ts

# Run bcrypt integration tests
npx jest tests/lib/zkp-bcrypt.test.ts

# Run the application with ZKP authentication
npm run dev
```

### Security Considerations

- The ZKP authentication system is designed to be secure against various attacks, including brute force attacks, timing attacks, and replay attacks.
- The system implements rate limiting, IP blocking, and exponential backoff to prevent brute force attacks.
- The system requires CAPTCHA verification after multiple failed attempts.
- The system uses bcrypt for secure password hashing before ZKP generation.
- Configurable bcrypt work factor via `BCRYPT_WORK_FACTOR` environment variable.
- The system uses dynamic salt generation to prevent precomputed table attacks.
- The system logs all authentication events for comprehensive security auditing.
- The system prevents replay attacks by binding proofs to specific sessions.
- The system prevents man-in-the-middle attacks through username verification.

### Environment Variables

- `BCRYPT_WORK_FACTOR`: Controls the computational cost of bcrypt hashing (default: 10)
  - Higher values increase security but also increase CPU usage
  - Recommended to increase as hardware improves
  - Example: `BCRYPT_WORK_FACTOR=12`

For more information, see the [ZKP Authentication Specification](docs/zkp-authentication.md) and the [Production Deployment Guide](docs/production-deployment.md).

## Troubleshooting

1. **Testing Issues**:
   - Always seed data first: `npm run seed`
   - Use convenience scripts: `npm run test:with-seed`
   - Add domain entries to hosts file or use `?hostname=` parameter

2. **CSS Issues**:
   - Use `@import` instead of `@tailwind` directives
   - Verify PostCSS configuration
   - Check Tailwind dependencies

3. **Next.js Errors**:
   - Move async operations to server components
   - Pre-process data before passing to client components
   - Avoid nested async operations

4. **Redis Connection**:
   - For local development, use in-memory fallback
   - For Docker, verify Redis container is running
   - Check connection string in environment variables