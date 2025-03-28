# DirectoryMonster Testing Documentation

This directory contains comprehensive testing guidelines and documentation for the DirectoryMonster project. These guides are based on the successful implementation of testing for the Category Management components, which achieved 100% test coverage with robust, maintainable tests.

## Testing Guides

1. [General Testing Guide](./TESTING_GUIDE.md) - Core testing patterns and best practices
2. [Accessibility Testing](./ACCESSIBILITY_TESTING.md) - Guidelines for testing component accessibility
3. [Hook Testing](./HOOK_TESTING.md) - Strategies for testing React hooks

## Overview of Testing Strategy

The DirectoryMonster project follows a modular testing approach, where complex components and hooks are tested with multiple specialized test files, each focusing on a specific aspect of functionality.

### Main Testing Principles

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it's built
2. **Use data-testid Attributes**: Use data-testid for stable element selection
3. **Small, Focused Tests**: Create small, focused tests rather than large, all-encompassing ones
4. **Test All Component States**: Test loading, error, empty, and nominal states
5. **Accessibility First**: Include accessibility testing in your component tests
6. **Mock External Dependencies**: Isolate components by mocking external dependencies

## Example Test Organization

We follow a modular approach to organizing tests, breaking them down by functionality:

```
tests/
  └── admin/
      └── categories/
          ├── CategoryTable.basic.test.tsx      # Core rendering and structure
          ├── CategoryTable.hierarchy.test.tsx  # Hierarchical view functionality
          ├── CategoryTable.filtering.test.tsx  # Search and filtering
          ├── CategoryTable.accessibility.test.tsx # Accessibility and keyboard navigation
          ├── CategoryTable.pagination.test.tsx # Pagination and deletion functionality
          ├── helpers/
          │   └── categoryTableTestHelpers.tsx  # Shared test helpers
          └── hooks/
              ├── useCategoriesTestHelpers.ts   # Shared hook test helpers
              ├── useCategories.init.test.ts    # Initialization and state management
              ├── useCategories.filtering.test.ts # Search and filtering
              ├── useCategories.sorting.test.ts # Sorting functionality
              └── ...
```

## Test Coverage Goals

The DirectoryMonster project aims for high test coverage:

- **UI Components**: 90-100% coverage
- **Hooks and Utilities**: 90-100% coverage
- **API Routes**: 80-90% coverage

## Reference Implementations

The following test implementations serve as reference examples:

1. **Component Tests**:
   - `CategoriesMobileView.*.test.tsx`: Example of modular component testing
   - `CategoryTable.*.test.tsx`: Example of testing complex component with multiple states

2. **Hook Tests**:
   - `useCategories.*.test.ts`: Example of comprehensive hook testing

## Testing Tools and Libraries

The DirectoryMonster project uses these testing tools:

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **User Event**: Simulating user interactions
- **Mock Service Worker**: API mocking

## Setting Up Tests

To run the tests locally:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- path/to/test/file.test.tsx

# Run tests matching a pattern
npm test -- -t "CategoryTable"
```

## Writing New Tests

When writing new tests for a component or hook:

1. **Review the existing test patterns** in similar components
2. **Create small, focused test files** for different aspects of functionality
3. **Create reusable test helpers** for common testing tasks
4. **Test all component states** (loading, error, empty, nominal)
5. **Include accessibility tests** for components
6. **Mock external dependencies** like API calls

## Troubleshooting Common Issues

### React Testing Library

- **"An update to Component inside a test was not wrapped in act(...)"**:
  - Wrap state updates in `act()`
  - Use `waitFor` or `findBy*` queries for async operations

- **"Unable to find an element by testId"**:
  - Check that the component includes the correct `data-testid` attribute
  - Check for typos in the testId
  - Ensure the component is rendered (not hidden by conditional rendering)

### Jest

- **"Jest encountered an unexpected token"**:
  - Check that the file extension is included in the Jest configuration
  - Verify that the correct transformers are configured for the file type

- **"Cannot find module"**:
  - Check that the import path is correct
  - Verify that the module is installed and listed in package.json

## Future Improvements

The testing infrastructure will continue to evolve:

- Add automated accessibility testing with axe-core
- Implement visual regression testing
- Enhance API testing with Mock Service Worker
- Add end-to-end testing with Cypress

## Contributing to Tests

When contributing new features or changes:

1. Write tests **before or alongside** the implementation
2. Follow the existing test patterns and organization
3. Aim for high test coverage (90%+)
4. Include accessibility tests for UI components
5. Create small, focused test files
6. Create or update test helpers as needed

## Maintenance

Good test maintenance practices:

1. Keep test files small and focused
2. Update tests when component behavior changes
3. Refactor tests when they become brittle or difficult to maintain
4. Use data-testid attributes for stable element selection
5. Don't couple tests to implementation details

By following these guidelines, we ensure that our tests remain valuable and maintainable as the project evolves.
