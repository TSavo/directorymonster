# Critical Paths Integration Tests

This directory contains integration tests for the most critical user paths in DirectoryMonster. These tests ensure that the core functionality of the application works correctly and that different components interact properly.

## Test Coverage

The integration tests cover the following critical paths:

1. **Homepage** - Tests the homepage rendering, navigation, and search functionality
2. **Category Pages** - Tests category page rendering, listing display, and navigation
3. **Listing Pages** - Tests listing page rendering, details display, and related listings
4. **Search** - Tests the search functionality, results display, and filtering
5. **Advanced Search** - Tests the advanced search functionality in the admin area
6. **Login** - Tests the login page rendering and authentication flow

## Running the Tests

To run all critical path integration tests:

```bash
npm test -- tests/integration/critical-paths
```

To run a specific test:

```bash
npm test -- tests/integration/critical-paths/homepage.test.tsx
```

## Test Structure

Each test file follows a similar structure:

1. **Setup** - Mocks necessary dependencies and creates test data
2. **Tests** - Tests specific functionality and user flows
3. **Cleanup** - Cleans up mocks and test data

## Mocking Strategy

The tests use the following mocking strategy:

1. **Component Mocks** - Mock complex components that are not directly tested
2. **API Mocks** - Mock API calls to return test data
3. **Context Mocks** - Mock context providers to provide test data
4. **Router Mocks** - Mock Next.js router for navigation testing

## Test Data

Test data is created using the utility functions in `setup.ts`:

- `createMockSite()` - Creates a mock site configuration
- `createMockCategory()` - Creates a mock category
- `createMockListing()` - Creates a mock listing
- `createMockListings()` - Creates multiple mock listings
- `createMockCategories()` - Creates multiple mock categories

## Test Utilities

The tests use the following utilities:

- `TestWrapper` - Provides necessary context for tests
- `renderWithWrapper()` - Renders components with the test wrapper
- `waitForElementToBeLoaded()` - Waits for elements to be loaded
- `waitForNavigation()` - Waits for navigation to complete
- `mockFetch()` - Mocks fetch for API calls
- `resetMocks()` - Resets mocks between tests
