# Simple Commands for DirectoryMonster

## "Just Do It" Commands

These commands are for when you just want things to work without understanding all the details:

| Command | Description |
|---------|-------------|
| `npm run just:run` | Just run the app in development mode |
| `npm run just:build` | Just build and run the app in production mode |
| `npm run just:test` | Just run all the tests |
| `npm run just:verify` | Just verify everything is working |
| `npm run just:docker` | Just run everything in Docker |

## Detailed "Do It All" Commands

These commands do the same things but with more detailed output:

| Command | Description |
|---------|-------------|
| `npm run do:all` | Set up ZKP, verify, build, and run the app |
| `npm run do:test` | Run all tests with detailed output |
| `npm run do:verify` | Verify everything with detailed output |
| `npm run do:docker` | Run everything in Docker with detailed output |

## What Each Command Actually Does

### `just:run` / `do:all`
- Sets up Zero-Knowledge Proof authentication
- Verifies the setup
- Builds the application
- Starts the application

### `just:test` / `do:test`
- Runs all crypto tests
- Runs all security tests
- Verifies file integrity
- Runs core ZKP tests
- Verifies ZKP setup

### `just:verify` / `do:verify`
- Verifies ZKP setup
- Verifies file integrity
- Runs security audit

### `just:docker` / `do:docker`
- Builds and runs the application in Docker
- Includes ZKP setup
- Includes Redis for caching/sessions

## Docker Details

The Docker setup:
- Automatically sets up ZKP authentication
- Builds the application
- Runs in production mode
- Includes Redis
- Persists data between restarts

Access the application at http://localhost:3000 after running `npm run just:docker`.
