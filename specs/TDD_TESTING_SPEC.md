# Test-Driven Development (TDD) Specification

## Overview

This document outlines the Test-Driven Development approach required for all feature development in the DirectoryMonster project. TDD is a development methodology that relies on a short development cycle where requirements are turned into specific test cases, then the code is improved to pass the tests.

## Core TDD Principles

1. **Write tests first**: Tests must be written before implementation code
2. **Follow the Red-Green-Refactor cycle**:
   - **Red**: Write a failing test that defines the expected behavior
   - **Green**: Write the minimal implementation code to make the test pass
   - **Refactor**: Clean up both test and implementation code without changing behavior
3. **Incremental Design**: Add functionality in small increments, building upon working code

## TDD Workflow

### 1. Test Writing Phase

1. **Understand requirements** before writing any code
2. **Create a test file** if one doesn't exist
3. **Write a single test** that verifies a specific aspect of functionality
4. **Run the test** and confirm it fails (Red phase)
   ```bash
   npx jest -t "TestName"
   ```

### 2. Implementation Phase

1. **Write minimal code** to make the test pass
2. **Do not optimize** during this phase
3. **Focus only on the test passing**, not on architecture or design
4. **Run the test** and confirm it passes (Green phase)
   ```bash
   npx jest -t "TestName"
   ```

### 3. Refactoring Phase

1. **Clean up the code** without changing behavior
2. **Refactor both implementation and test code**
3. **Ensure tests continue to pass** during refactoring
4. **Commit the changes** once tests are passing and code is clean

## Specific Practices

### Route Testing

For API routes, test the following aspects:

1. **Middleware Usage**:
   - Verify that routes use `withTenantAccess` middleware
   - Verify that routes use the correct permission middleware
   - Test with correct resource types and permissions

2. **Error Handling**:
   - Test with missing tenant ID
   - Test with missing authentication
   - Test with invalid permissions
   - Test service errors

3. **Redis Operations**:
   - Test data persistence
   - Test data retrieval
   - Test tenant isolation

### Component Testing

For React components, test the following aspects:

1. **Rendering**:
   - Test initial render state
   - Test with different props
   - Test edge cases (empty state, error state)

2. **User Interactions**:
   - Test button clicks and form submissions
   - Test input changes
   - Test navigation flows

3. **State Management**:
   - Test state changes in response to user actions
   - Test state synchronization with server

## Recommended Test Structure

```typescript
describe('Feature or Component Name', () => {
  // Setup and mocks
  beforeEach(() => {
    // Common setup
  });

  describe('Specific Operation or Scenario', () => {
    it('should behave in this specific way', async () => {
      // Arrange
      // ...

      // Act
      // ...

      // Assert
      // ...
    });
  });
});
```

## Benefits and Justification

TDD provides several critical benefits to our development process:

1. **Documentation**: Tests serve as code documentation, explaining what the code should do
2. **Design**: TDD forces developers to think about design before implementation
3. **Regression Prevention**: A comprehensive test suite prevents regression bugs
4. **Confidence**: TDD gives developers confidence to refactor and improve code
5. **Focus**: TDD keeps development focused on specific requirements
6. **Future-Proofing**: Tests protect against future developers (including our future selves) breaking functionality when returning to the code without full context

## Command Reference

```bash
# Run a specific test
npx jest -t "TestName"

# Run tests in watch mode
npx jest --watch

# Run tests for a specific file
npx jest path/to/test/file.test.ts

# Run all tests with code coverage
npx jest --coverage
```

## Common TDD Pitfalls to Avoid

1. ❌ **Writing implementation first**: Never write implementation code before tests
2. ❌ **Writing too many tests at once**: Add one test at a time
3. ❌ **Testing implementation details**: Focus on behavior, not implementation
4. ❌ **Skipping the refactor phase**: Always clean up code after making tests pass
5. ❌ **Making existing tests pass by modifying the tests**: Change implementation, not tests
6. ❌ **Overly complex tests**: Keep tests simple and focused on one aspect

## TDD Checklist

For review and self-assessment, confirm that:

- [ ] Tests are written before implementation code
- [ ] Each test focuses on a single piece of functionality
- [ ] Implementation code is minimal to pass tests
- [ ] Code and tests are refactored after tests pass
- [ ] Tests verify behavior, not implementation details
- [ ] All tests pass before merging

## Integration with CI/CD

All pull requests must pass test suite before merging. The CI pipeline runs:
```bash
npm run test:all
```

Failed tests block merging until they are fixed.
