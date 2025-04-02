# DirectoryMonster API E2E Testing

This directory contains end-to-end tests for the DirectoryMonster API endpoints, focusing on authentication, authorization, and multi-tenant security boundaries.

## Overview

The API E2E tests use SuperTest (a JavaScript alternative to REST-assured) to directly test the API endpoints without going through the browser. This provides faster, more targeted tests for API behavior, including:

- Authentication validation
- Permission checking
- Tenant isolation
- Request/response format validation

## Test Organization

The tests are organized as follows:

- `api-test-base.js` - Base class with common functionality for API tests
- `utils/auth-helper.js` - Authentication utilities for generating tokens
- Individual test files for specific API endpoints or concepts:
  - `sites-api.test.js` - Tests for the Sites API endpoints
  - `tenant-isolation.test.js` - Tests focused on multi-tenant security
  - `middleware.test.js` - Tests for the authentication middleware chain

## Running the Tests

To run the API E2E tests:

```bash
# Run all API E2E tests
npm run test:e2e:api

# Run with watch mode for development
npm run test:e2e:api:watch

# Run with coverage reports
npm run test:e2e:api:coverage
```

## Writing New Tests

To add tests for a new API endpoint:

1. Create a new test file in this directory (e.g., `listings-api.test.js`)
2. Extend from `ApiTestBase` to reuse common functionality
3. Write test cases that:
   - Test both success and error paths
   - Verify proper authorization checks
   - Validate multi-tenant isolation where applicable

Example:

```javascript
const ApiTestBase = require('./api-test-base');

describe('Listings API', () => {
  let apiTest;
  
  beforeAll(async () => {
    apiTest = new ApiTestBase();
    await apiTest.setupTestData();
  });
  
  test('GET /api/listings should return listings with proper authentication', async () => {
    // Arrange
    const authOptions = {
      permissions: [{ resource: 'listing', action: 'read' }]
    };
    
    // Act
    const response = await apiTest.authenticatedGet('/api/listings', authOptions);
    
    // Assert
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  // Additional test cases...
});
```

## Best Practices

1. **Isolation** - Each test should be independent and not rely on the state from other tests
2. **Clear Arrangements** - Make test setup explicit with clear authentication options
3. **Comprehensive Testing** - Test both success and error paths for each endpoint
4. **Security Focus** - Pay special attention to permission checks and tenant isolation
5. **Realistic Data** - Use realistic test data that matches production patterns

## Configuration

The API E2E tests use a dedicated Jest configuration file at `jest-configs/jest.api-e2e.config.js`. Additional configuration options can be added there as needed.
