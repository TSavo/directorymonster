# DirectoryMonster Command Reference

This document provides a comprehensive reference for all commands available in the DirectoryMonster project.

## Command Structure

All commands follow a consistent naming convention:

```
category:action[:subaction]
```

For example:
- `app:dev` - Run the application in development mode
- `test:crypto:security` - Run security-related crypto tests

## Simple Commands

These simplified commands are aliases for common operations:

| Command | Description | Equivalent |
|---------|-------------|------------|
| `npm run run` | Run the app in development mode | `npm run app:dev` |
| `npm run build` | Build and run the app in production | `npm run app:build && npm run app:start` |
| `npm run test` | Run all tests | `npm run test:all` |
| `npm run verify` | Verify everything is working | `npm run test:verify` |
| `npm run docker` | Run everything in Docker | `npm run docker:all` |
| `npm run setup` | Set up ZKP authentication | `npm run zkp:setup` |

## Windows-Specific Commands

For Windows users, these PowerShell-based commands are available:

| Command | Description | Equivalent |
|---------|-------------|------------|
| `npm run win:test` | Run all tests (Windows) | PowerShell version of `npm run test` |
| `npm run win:verify` | Verify everything is working (Windows) | PowerShell version of `npm run verify` |
| `npm run win:docker` | Run everything in Docker (Windows) | PowerShell version of `npm run docker` |
| `npm run win:setup` | Set up ZKP authentication (Windows) | PowerShell version of `npm run setup` |

## Application Commands

Commands for running and managing the application:

| Command | Description |
|---------|-------------|
| `npm run app:dev` | Run the app in development mode |
| `npm run app:dev:docker` | Run the app in development mode with Docker |
| `npm run app:build` | Build the app for production |
| `npm run app:start` | Start the app in production mode |
| `npm run app:lint` | Lint the codebase |
| `npm run app:format` | Format the codebase with Prettier |
| `npm run app:typecheck` | Check TypeScript types |
| `npm run app:all` | Set up, verify, build, and run the app |

## Docker Commands

Commands for Docker operations:

| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build Docker containers |
| `npm run docker:build:python` | Build Python Docker container |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:logs` | View Docker logs |
| `npm run docker:all` | Build and run everything in Docker |
| `npm run docker:zkp:up` | Start ZKP Docker containers |
| `npm run docker:zkp:down` | Stop ZKP Docker containers |
| `npm run docker:zkp:logs` | View ZKP Docker logs |

## ZKP Commands

Commands for Zero-Knowledge Proof operations:

| Command | Description |
|---------|-------------|
| `npm run zkp:setup` | Set up ZKP authentication |
| `npm run zkp:update` | Update ZKP implementation |
| `npm run zkp:debug` | Debug ZKP verification issues |
| `npm run zkp:test:poseidon` | Test Poseidon hash function |
| `npm run zkp:test:passwords` | Test password handling |
| `npm run zkp:verify` | Verify ZKP setup |

## Security Commands

Commands for security operations:

| Command | Description |
|---------|-------------|
| `npm run security:verify` | Verify file integrity |
| `npm run security:generate` | Generate new checksums |
| `npm run security:check` | Run security tests and verify integrity |
| `npm run security:audit` | Run security audit on dependencies |
| `npm run security:all` | Run all security checks |

## Data Commands

Commands for data operations:

| Command | Description |
|---------|-------------|
| `npm run data:seed` | Seed the database |
| `npm run data:seed:js` | Seed the database with JavaScript |
| `npm run data:seed:docker` | Seed the database in Docker |
| `npm run data:seed:auth` | Seed the database with authentication data |
| `npm run data:clear:users` | Clear Redis users |

## Test Commands

Commands for testing:

| Command | Description |
|---------|-------------|
| `npm run test:all` | Run all tests |
| `npm run test:verify` | Verify everything is working |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:api` | Run API tests |
| `npm run test:components` | Run component tests |
| `npm run test:components:categories` | Run category component tests |
| `npm run test:components:listings` | Run listing component tests |
| `npm run test:crypto` | Run crypto tests |
| `npm run test:crypto:core` | Run core ZKP tests |
| `npm run test:crypto:setup` | Test ZKP setup |
| `npm run test:crypto:security` | Run security-related crypto tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:e2e:all` | Run all end-to-end tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:with:seed` | Run tests with seeded data |
| `npm run test:with:seed:docker` | Run tests with seeded data in Docker |
| `npm run test:docker` | Run tests in Docker |
