# DirectoryMonster Test Suite Guidelines

## Test Commands

```bash
# Unit tests (Jest)
npm test

# Integration tests (Jest)
npm run test:integration 

# Domain resolution tests (Bash)
npm run test:domain

# Page rendering tests (Bash)
npm run test:rendering

# Comprehensive multitenancy tests (Bash)
npm run test:multitenancy

# All tests combined
npm run test:all

# Docker environment tests
npm run test:docker
```

## Test Types

1. **Unit Tests**
   - Tests individual functions and components
   - Mock dependencies for isolated testing
   - Focus on code correctness

2. **Integration Tests**
   - Tests interactions between multiple components
   - Simulates hostname resolution and site identity
   - Verifies data flow through the application

3. **Domain Resolution Tests**
   - Tests real HTTP requests with Host headers
   - Verifies that the application correctly identifies sites by domain
   - Tests subdomain resolution and hostname normalization

4. **Page Rendering Tests**
   - Tests all page types (home, categories, listings)
   - Verifies correct content is shown for each site
   - Tests that one site's content doesn't appear on another site

5. **Docker Testing**
   - Tests the complete application in the Docker environment
   - Verifies Redis connectivity
   - Runs all test suites in sequence

## Running Tests

### Prerequisites
- For unit and integration tests:
  - Node.js and npm
  - Install dependencies: `npm install`

- For HTTP/domain tests:
  - Running application (`npm run dev &` or Docker) - always run development servers with `&` to keep them in the background
  - Seeded data (run `npm run seed` before testing)
  - Local hosts file entries or `?hostname=` parameter
  
### Redis and Data Requirements

For tests to pass, they require:

1. **In-memory Redis Fallback**: When Redis is not available, the application automatically uses an in-memory fallback. This is configured in `src/lib/redis-client.ts` with `USE_MEMORY_FALLBACK = true`.

2. **Seeded Data**: Many tests rely on seeded sample data. When using the in-memory Redis implementation, you must run `npm run seed` before testing, or use these convenience scripts:
   - `npm run test:with-seed`: Seeds data and runs unit tests
   - `npm run test:all-with-seed`: Seeds data and runs all tests 
   - `npm run test:with-server`: Seeds data, starts the server, and runs tests

This fallback makes development easier by eliminating the need for Redis installation.

### Common Issues
1. **Missing Jest Environment**
   ```
   npm install --save-dev jest-environment-jsdom
   ```

2. **Missing Testing Library**
   ```
   npm install --save-dev @testing-library/jest-dom
   ```

3. **Connection Errors**
   - Ensure application is running on port 3000
   - Check hosts file for domain entries
   - Ensure Redis is running

4. **Mock Failures**
   - Check mock implementations in test files
   - Ensure mocks are reset between tests
   - Use mockImplementation for complex mocks

## Test Coverage Expectations

- Unit tests: 70-80% coverage
- Integration tests: Key user flows
- Domain tests: All registered domains
- Page tests: All page types for each site

## Continuous Integration

The test suite is designed to run in CI environments:

1. Run linting and type checking
   ```
   npm run lint && npm run typecheck
   ```

2. Run unit and integration tests
   ```
   npm test
   ```

3. Start application and run domain/rendering tests
   ```
   npm run docker:up && npm run test:docker
   ```

## Development Best Practices

1. **Running Development Servers**
   - Always run continuous processes like development servers in the background using `&`:
     ```bash
     npm run dev &
     ```
   - This allows you to continue using the terminal for other commands
   - To bring the process back to the foreground: `fg`
   - To stop the background process: `kill %1` or find the PID with `ps` and use `kill [PID]`

2. **Working with Redis**
   - If Redis is not available, the app can use an in-memory fallback (configured in `src/lib/redis-client.ts`)
   - For production, always use a proper Redis instance

3. **URL Construction**
   - Always use the URL utility functions in `src/lib/site-utils.ts` to construct URLs
   - For components, use the Link wrapper components in `src/components/LinkUtilities.tsx`
   - See `docs/url-utilities.md` for detailed documentation and examples
   - Follow these patterns to ensure consistent URL construction across the application