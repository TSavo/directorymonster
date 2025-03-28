# DirectoryMonster Integration Tests

This directory contains integration tests for the DirectoryMonster application, focusing on verifying that different components of the system work correctly together.

## Directory Structure

- `setup.ts` - Common utilities and setup procedures for integration tests
- `/user-flows/` - Tests for common user flows and journeys
- `/multitenancy/` - Tests for multi-tenant functionality and domain resolution
- `/search/` - Tests for search indexing and retrieval

## Test Approach

Our integration tests follow these principles:

1. **Isolated Test Environment**: Each test suite sets up its own isolated test data with clearly defined test prefixes.
2. **End-to-End Flows**: Tests simulate real user flows, calling multiple API endpoints in sequence.
3. **Multi-Tenancy Verification**: Tests ensure data isolation between different sites.
4. **Comprehensive Cleanup**: All test data is cleaned up after test execution.

## Running the Tests

To run all integration tests:

```bash
npm test -- --testPathPattern=tests/integration
```

To run a specific integration test suite:

```bash
npm test -- tests/integration/multitenancy/site-identity.test.ts
```

## Common Utilities

The `setup.ts` file provides several utilities to simplify writing integration tests:

- `setupTestEnvironment()` - Creates a complete test environment with sites, categories, and listings
- `clearTestData()` - Removes all test data from Redis
- `createTestSites()` - Creates test sites for multi-tenant testing
- `createTestCategories()` - Creates test categories for each site
- `createTestListings()` - Creates test listings for each category
- `createMockRequest()` - Creates a mock NextRequest with appropriate headers and body
- `wait()` - Helper for testing async operations with timing dependencies

## Test Data Naming

All test data keys in Redis are prefixed with `test:` to distinguish them from actual application data and enable easy cleanup. For example:

- `test:site:id:{siteId}`
- `test:category:site:{siteId}:{slug}`
- `test:listing:id:{listingId}`

## Implementation Details

Integration tests use the actual API implementations and route handlers to test full request/response cycles, but they mock external dependencies like Redis to ensure isolation and prevent test data from affecting the real application.

The test setup utilities create a rich, interconnected dataset that reflects the relationships between sites, categories, and listings, allowing tests to verify that these relationships are maintained across the application.
