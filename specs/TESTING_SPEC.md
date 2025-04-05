# DirectoryMonster Testing Guide

This document provides comprehensive guidance for testing the DirectoryMonster application. Our testing strategy includes various types of tests, from unit tests to integration tests, ensuring high-quality and reliable software.

## Table of Contents

1. [Test Types](#test-types)
2. [Test Organization](#test-organization)
3. [Testing Tools](#testing-tools)
4. [Writing Tests](#writing-tests)
5. [Best Practices](#best-practices)
6. [Running Tests](#running-tests)
7. [Troubleshooting](#troubleshooting)

## Test Types

DirectoryMonster employs several types of tests:

### Unit Tests
- Test individual functions and components
- Mock dependencies for isolated testing
- Focus on code correctness
- Located in the `/tests` directory, mirroring the source code structure

### Integration Tests
- Test interactions between multiple components
- Simulate hostname resolution and site identity
- Verify data flow through the application
- Located in the `/tests/integration` directory

### Domain Resolution Tests
- Test real HTTP requests with Host headers
- Verify that the application correctly identifies sites by domain
- Test subdomain resolution and hostname normalization
- Located in the `/tests/scripts` directory

### Page Rendering Tests
- Test all page types (home, categories, listings)
- Verify correct content is shown for each site
- Test that one site's content doesn't appear on another site
- Located in the `/tests/scripts` directory

### Docker Testing
- Test the complete application in the Docker environment
- Verify Redis connectivity
- Run all test suites in sequence
- Configured in `docker-compose.test.yml`

## Test Organization

Our test files are organized to mirror the component structure:

```
tests/
  └── admin/                     # Admin component tests
      ├── categories/            # Category management tests
      │   ├── CategoryTable.test.tsx
      │   ├── useCategories.test.tsx
      │   └── components/
      │       ├── CategoryTableRow.test.tsx
      │       ├── CategoryTableHeader.test.tsx
      │       └── ...
      ├── listings/              # Listing management tests
      │   ├── ListingTable.test.tsx
      │   └── ...
      └── sites/                 # Site management tests
          ├── DomainManager.test.tsx
          ├── SiteForm.test.tsx
          └── ...
  ├── api/                       # API endpoint tests
  ├── components/                # General component tests
  ├── integration/               # Integration tests
  ├── middleware/                # Middleware tests
  └── utils/                     # Utility function tests
```

### Test File Organization Patterns

For complex components, we organize tests into multiple files based on features:

1. **Base Test File**: Core functionality, basic rendering, and structure tests
   - Example: `ComponentName.test.tsx`

2. **Feature-Specific Files**: Tests focusing on a specific aspect of the component
   - Example: `ComponentName.feature.test.tsx`

3. **Accessibility Files**: Tests focusing on ARIA attributes, keyboard navigation, etc.
   - Example: `ComponentName.accessibility.test.tsx`

This approach improves test clarity, maintenance, and allows developers to focus on specific aspects of a component.

## Testing Tools

DirectoryMonster uses the following testing tools:

1. **Jest**: JavaScript testing framework
2. **React Testing Library**: For testing React components
3. **User Event**: For simulating user interactions
4. **MSW (Mock Service Worker)**: For API mocking
5. **Jest-DOM**: For additional DOM matchers

## Writing Tests

### Component Tests

1. **Use Data Attributes for Selection**
   - Add `data-testid` attributes to all key elements in components
   - Use specific and descriptive test IDs (e.g., `cancel-button` not `button-1`)
   - Scope queries to specific components using `within()`
   - Prefer `getByTestId()` over `getByText()` or `getByRole()` when possible

2. **Test Behavior, Not Implementation**
   - Focus on component behavior and user interactions
   - Avoid testing implementation details like state variables or props
   - Test UI changes in response to user actions
   - Verify correct function calls with mock functions

3. **Accessibility Testing**
   - Verify proper ARIA attributes (`aria-label`, `aria-labelledby`, etc.)
   - Test keyboard navigation and focus management
   - Ensure focus trapping in modals and dialogs
   - Verify proper tab order and keyboard interactions

4. **Reduce CSS Coupling**
   - Avoid selecting elements by CSS classes when possible
   - Use flexible class matchers when necessary (`toHaveClass` with partial matches)
   - Focus on functional attributes rather than styling
   - If testing CSS-related functionality, use more general attribute matchers

5. **Test Edge Cases**
   - Test empty states and zero-item scenarios
   - Verify error handling and loading states
   - Test boundary conditions (e.g., first/last page in pagination)
   - Include tests for unexpected or invalid input

6. **Focus Management Testing**
   - Use `waitFor()` with focus assertions to handle async focus changes
   - Test focus restoration when components are unmounted and remounted
   - Verify focus is set correctly on initial render
   - Test focus cycling with Tab key navigation

7. **Organization and Documentation**
   - Group tests logically by functionality
   - Use descriptive test names that explain the expected behavior
   - Add comments to clarify test assertions and setup
   - Include references to accessibility guidelines when relevant

### React Hook Testing

1. **Isolate Tests From Side Effects**
   - Avoid testing `useEffect` side effects directly
   - Mock external dependencies like `fetch` with specific implementations per test
   - Use `cleanup` between tests to prevent state leakage
   - Restore original function implementations in `afterEach`

2. **Handle Asynchronous Updates**
   - Use `act()` to wrap state updates
   - For async operations, use `async/await` within `act()` calls
   - Use `waitFor()` instead of deprecated `waitForNextUpdate()`
   - Account for multiple state updates in a single operation

3. **Test Hook Behavior, Not Implementation**
   - Test return values and state updates, not internal functions
   - Focus on public API of the hook
   - Verify state changes in response to function calls
   - Test how consumers would use the hook

4. **Use Separate Hook Instances for Complex Tests**
   - Create fresh hook instances for testing multi-step operations
   - Avoid testing multiple state transitions in a single test
   - Use multiple `renderHook` calls for different scenarios

## Running Tests

### Prerequisites
- For unit and integration tests:
  - Node.js and npm
  - Install dependencies: `npm install`

- For HTTP/domain tests:
  - Running application (`npm run app:dev &` or Docker) - always run development servers with `&` to keep them in the background
  - Seeded data (run `npm run data:seed` before testing)
  - Local hosts file entries or `?hostname=` parameter

### Available Scripts

The following scripts are available in `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:components": "jest --testPathPattern='tests/.*\\.test\\.(ts|tsx)$'",
    "test:api": "jest --testPathPattern='tests/api/.*\\.test\\.ts$'",
    "test:unit": "jest --testPathPattern='tests/unit/.*\\.test\\.ts$'",
    "test:integration": "jest --testPathPattern='tests/integration/.*\\.test\\.(ts|tsx)$'",
    "test:domain": "bash tests/scripts/domain-tests.sh",
    "test:rendering": "bash tests/scripts/rendering-tests.sh",
    "test:multitenancy": "bash tests/scripts/multitenancy-tests.sh",
    "test:all": "npm run test:components && npm run test:api && npm run test:integration && npm run test:e2e:all",
    "test:docker": "npm run test:docker",
    "test:with:seed": "npm run data:seed && npm run test",
    "test:with:seed:docker": "npm run data:seed:docker && npm run test"
  }
}
```

### Redis and Data Requirements

For tests to pass, they require:

1. **In-memory Redis Fallback**: When Redis is not available, the application automatically uses an in-memory fallback. This is configured in `src/lib/redis-client.ts` with `USE_MEMORY_FALLBACK = true`.

2. **Seeded Data**: Many tests rely on seeded sample data. When using the in-memory Redis implementation, you must run `npm run data:seed` before testing, or use these convenience scripts:
   - `npm run test:with:seed`: Seeds data and runs unit tests
   - `npm run test:with:seed:docker`: Seeds data and runs tests with Docker

This fallback makes development easier by eliminating the need for Redis installation.

## Troubleshooting

### Common Issues

1. **React Component Errors**:
   - Error: "Functions are not valid as a child of Client Components"
   - Solution: Avoid using async functions directly within React components
   - Fix: Fetch all data at the top level of server components and pass it as props

2. **Missing Jest Environment**
   ```
   npm install --save-dev jest-environment-jsdom
   ```

3. **Missing Testing Library**
   ```
   npm install --save-dev @testing-library/jest-dom
   ```

4. **Connection Errors**
   - Ensure application is running on port 3000
   - Check hosts file for domain entries
   - Ensure Redis is running

5. **Mock Failures**
   - Check mock implementations in test files
   - Ensure mocks are reset between tests
   - Use mockImplementation for complex mocks

## Test Coverage Expectations

- Unit tests: 70-80% coverage
- Integration tests: Key user flows
- Domain tests: All registered domains
- Page tests: All page types for each site
