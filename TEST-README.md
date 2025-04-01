# Testing Guide for DirectoryMonster

This document explains how to run tests effectively in this project.

## Important Note About E2E Tests

**E2E tests are NEVER run by default.** They are resource-intensive and can cause performance issues. You must explicitly use the e2e-specific commands to run them.

## Common Test Commands

### Running Regular Tests (Never Includes E2E Tests)

```bash
# Run all tests (never includes E2E tests)
npm test

# Run a specific test file
npm test -- path/to/test.test.ts

# Run tests matching a pattern
npm test -- -t "test pattern"

# Run tests in a specific directory
npm test -- tests/unit/api
```

### Using the Specific Test Helper

We've created a helper script that provides warnings if you try to run e2e tests:

```bash
# Run a specific test file
npm run test:specific tests/unit/api/admin/dashboard/stats.test.ts

# Run tests in a specific directory
npm run test:specific tests/unit/api
```

### Running E2E Tests (Only When Necessary)

E2E tests must be run using dedicated commands:

```bash
# Run a specific E2E test
npm run test:e2e:categories

# Run all E2E tests (will be resource-intensive)
npm run test:e2e
```

### Other Useful Test Commands

```bash
# Run tests with minimal output
npm run test:minimal

# Run tests and only show failures
npm run test:failures-only

# Run component tests
npm run test:components

# Run API tests
npm run test:api

# Run unit tests
npm run test:unit
```

## Test Filtering Tips

- Use `-t` to filter by test name: `npm test -- -t "should return 404"`
- Use file paths to run specific test files: `npm test -- tests/unit/api/admin/dashboard/stats.test.ts`
- Use directory paths to run all tests in a directory: `npm test -- tests/unit/api`

## Troubleshooting

If you encounter issues with tests:

1. Make sure you're not running E2E tests unintentionally
2. Use the `test:specific` command to ensure E2E tests are excluded
3. For performance issues, run only the tests you need rather than the entire suite
