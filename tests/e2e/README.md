# End-to-End (E2E) Tests for DirectoryMonster

This directory contains E2E tests for DirectoryMonster using Puppeteer. These tests verify that the application works correctly from a user's perspective by automating browser interactions.

## Setup and Configuration

### Prerequisites

- Node.js 14+ and npm
- Running DirectoryMonster application (local development server)
- Test user credentials configured in the environment variables or using default test values

### Environment Variables

The E2E tests can be configured with the following environment variables:

- `BASE_URL`: The base URL of the application (default: `http://localhost:3000`)
- `SITE_DOMAIN`: The domain of the site to test (default: `mydirectory.com`)
- `TEST_USER`: The email for the test user (default: `test@example.com`)
- `TEST_PASSWORD`: The password for the test user (default: `password123`)
- `NODE_ENV`: Set to `production` to run tests in headless mode, otherwise browser will be visible
- `DEBUG`: Set to any value to enable console logging from the browser

## Running Tests

### Running All E2E Tests

```bash
npm run test:e2e
```

### Running Specific Tests

```bash
# Run only login tests
npm run test:e2e:login

# Watch mode for development
npm run test:e2e:watch
```

### Running with Custom Configuration

```bash
# Set environment variables inline
BASE_URL=http://dev.mydirectory.com TEST_USER=admin@example.com TEST_PASSWORD=secure123 npm run test:e2e
```

## Test Structure

Each test file focuses on a specific feature or user flow. The tests use the Page Object Model pattern to organize code and make tests more maintainable.

### Current Test Files

- `login.test.js`: Tests the login page and authentication flows
  - Rendering of login form
  - Validation of form inputs
  - Error handling for incorrect credentials
  - Successful login flow
  - Remember Me functionality
  - Password reset link
  - Logout functionality

## Writing New Tests

When adding new E2E tests:

1. Create a new test file in this directory
2. Follow the existing patterns for page navigation and element selection
3. Use data-testid attributes in your components for reliable element selection
4. Add appropriate timeout values for operations
5. Add the new test file to the test scripts in package.json if needed

## Best Practices

- Use `data-testid` attributes for selecting elements, rather than CSS classes or tags
- Handle timeouts and waits appropriately for async operations
- Set reasonable timeouts for different operations
- Use page object models for complex flows
- Clean up resources after tests (e.g., close browser)
- Don't rely on UI text that might change
- Add appropriate error messages for test failures

## Debugging

For debugging E2E tests:

1. Set `NODE_ENV` to a non-production value to run tests with a visible browser:
   ```bash
   NODE_ENV=development npm run test:e2e:login
   ```

2. Enable browser console logging:
   ```bash
   DEBUG=true npm run test:e2e:login
   ```

3. Set longer timeouts for step-by-step debugging:
   ```bash
   jest tests/e2e/login.test.js --testTimeout=120000
   ```

## Adding Tests to CI/CD

E2E tests are integrated into the CI/CD pipeline. You can see the configuration in the GitHub Actions workflow files.

## Known Issues and Limitations

- Tests assume a test user exists with the configured credentials
- Some tests might be flaky if the application's response time varies
- Tests currently don't isolate the database, so they might affect persistent data

## Future Improvements

- Add visual regression testing
- Improve test isolation with database seeding/clearing
- Add accessibility testing with axe-core
- Create more page objects for reusable test code
