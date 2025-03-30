# E2E Testing for DirectoryMonster

This directory contains end-to-end (E2E) tests for the DirectoryMonster application using Puppeteer.

## New Test Architecture

The E2E tests have been refactored to follow a modular, maintainable approach:

### Directory Structure

```
tests/e2e/
├── utils/                  # Shared utility functions
│   ├── test-utils.js       # Core test utilities
│   ├── auth-utils.js       # Authentication-related utilities
│   ├── browser-utils.js    # Browser setup and management
│   └── category-utils.js   # Category management utilities
├── category-management.test.js  # New focused category tests
├── categories.test.js           # Legacy category tests
└── README.md                    # This file
```

### Key Improvements

1. **Modular Design**: Functions are organized by domain for better reusability and maintainability.
2. **Standard DOM Selectors**: Replaced jQuery-style selectors with standard DOM APIs.
3. **Better Error Handling**: Added comprehensive error handling and fallbacks.
4. **Improved Logging**: Enhanced logging with timestamps, categories, and file output.
5. **Screenshot Capture**: Added automatic screenshot capture for debugging.
6. **Focused Test Files**: Each test file focuses on a specific area of functionality.

## Running the Tests

### Prerequisites

- Node.js and npm
- Docker (recommended for consistent environment)

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run only the new category management tests
npm run test:e2e:category-management

# Run the legacy category tests
npm run test:e2e:categories

# Run with debugging output
npm run test:e2e:categories:debug

# Run in watch mode
npm run test:e2e:watch
```

### Environment Variables

- `BASE_URL`: Application URL (default: http://localhost:3000)
- `HEADLESS`: Set to "false" to run tests with browser visible
- `TEST_SITE_SLUG`: Site slug to test with (default: hiking-gear)
- `ADMIN_USERNAME`: Admin username for tests (default: admin)
- `ADMIN_PASSWORD`: Admin password for tests (default: password123456)

## Writing New Tests

### Using Utility Functions

The utility functions are designed to be composable and reusable:

```javascript
// Import required utilities
const { loginAsAdmin } = require('./utils/auth-utils');
const { navigateToCategories } = require('./utils/category-utils');

// Use in tests
test('Should navigate to categories page', async () => {
  await loginAsAdmin(page);
  const success = await navigateToCategories(page, 'site-slug');
  expect(success).toBe(true);
});
```

### Best Practices

1. **Focused Tests**: Each test should focus on a single feature or workflow.
2. **Clear Names**: Use descriptive test and function names.
3. **Standard Selectors**: Use standard DOM selectors instead of jQuery-style selectors.
4. **Error Handling**: Always handle errors and provide fallback mechanisms.
5. **Screenshots**: Capture screenshots at key points for debugging.
6. **Logging**: Use the logging utilities to provide context.
7. **Timeouts**: Set appropriate timeouts for network operations.

## Debugging

Tests output logs and screenshots to help with debugging:

- **Logs**: Check `debug-logs/e2e-tests.log` for detailed test logs.
- **Screenshots**: Check the `screenshots/` directory for page states at key moments.
- **Run with `--verbose`**: Use the debug script to see more details.

## Legacy Tests

The legacy tests (`categories.test.js` etc.) are kept for backward compatibility. New tests should follow the modular approach of `category-management.test.js`.
