# E2E Testing Framework

This directory contains end-to-end (E2E) tests using Jest and Puppeteer, with a focus on organization and maintainability.

## Core Principles

- **Organize by Page**: Each major page or feature gets its own folder
- **One Test = One File**: Each user behavior or test case has a dedicated file
- **Centralized Selectors**: All `data-testid` selectors live in a single file per page
- **Suite Orchestration**: A suite file imports all test cases for a page
- **Isolated Concerns**: Utilities, setup, and teardown are clearly separated

## Directory Structure

```
/e2e
  /global
    - setup.js          # Global Puppeteer setup
    - teardown.js       # Global Puppeteer teardown
    - globals.js        # Injects browser/page globally
  /utils
    - test-utils.js     # Common test utilities
    - hydration-utils.js # Utilities for component hydration
  /homepage
    - homepage.suite.test.js      # Suite file to run all homepage tests
    - homepage.selectors.js       # Selectors using data-testid
    - homepage.rendering.test.js  # Test for basic rendering
    - homepage.navigation.test.js # Test for navigation functionality
    - homepage.responsive.test.js # Test for responsive design
    - homepage.search.test.js     # Test for search functionality
    - homepage.content.test.js    # Test for content sections
    - homepage.404.test.js        # Test for 404 error handling
    - homepage.performance.test.js # Test for performance
  /login
    - login.suite.test.js         # Suite file for login tests
    - login.selectors.js          # Login selectors
    - login.valid-login.test.js   # Test for valid login
    - login.invalid-login.test.js # Test for invalid login
```

## Running Tests

To run all E2E tests using the new organized structure:

```bash
npm run test:e2e:organized
```

To run tests for a specific page:

```bash
npm run test:e2e:homepage
```

## Creating New Tests

1. Create a new folder for your page/feature in `tests/e2e/`
2. Create a `<page>.selectors.js` file with all your selectors
3. Create individual test files for each behavior you want to test
4. Create a suite file that imports all your test files
5. Add the test command to package.json

## Best Practices

1. **Use Selectors File**: Always use selectors from the selectors file, not hardcoded in tests
2. **Add Fallbacks**: Include fallback selectors when data-testid attributes aren't available
3. **Handle Hydration**: Use hydration utilities for Next.js component hydration
4. **Error Handling**: Add try/catch blocks and don't fail tests unnecessarily
5. **Screenshots**: Take screenshots at key points for debugging
6. **Graceful Degradation**: Tests should pass even when minor features are unavailable
7. **Isolation**: Each test file should be able to run independently

## Troubleshooting

- **Hydration Timeouts**: Increase timeout values in tests or check component hydration
- **Selector Not Found**: Check if the selector exists or add fallback selectors
- **Navigation Issues**: Use more generous timeouts for navigation or check for redirects
- **Browser Crashes**: Check for memory issues or use headless mode
