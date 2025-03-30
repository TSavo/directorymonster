# Admin Component Test Utilities

This directory contains test utilities, helpers, and structure tests for the DirectoryMonster admin components.

## Purpose

The test files in this directory serve several purposes:

1. **Import Structure Tests**: Verify that components can be properly imported using both named and default export patterns, ensuring consistent and reliable module exports.

2. **Test Utility Functions**: Provide shared utility functions and helpers that can be used across all admin component tests.

3. **Mock Providers**: Implement mock versions of context providers, hooks, and services to facilitate component testing in isolation.

## Test Files

- **auth-imports.test.tsx**: Tests that all auth components can be properly imported using both named imports and default imports. This ensures that the module export patterns are working correctly and consistently.

## Test Organization

This directory is part of a larger testing structure for admin components:

```
src/components/admin/tests/     # Test utilities and structure tests
tests/admin/                    # Main test implementations
├── auth/                       # Auth component tests
├── categories/                 # Category management tests
├── dashboard/                  # Dashboard component tests
├── layout/                     # Layout component tests
├── listings/                   # Listing management tests
├── navigation/                 # Navigation component tests
└── sites/                      # Site management tests
```

## Usage Guidelines

### Import Tests

Import tests ensure that components can be properly imported using both named and default exports. They follow this pattern:

```tsx
// Test named imports
import { 
  ComponentA, 
  ComponentB,
  ComponentC
} from '../module';

// Test default imports
import ComponentADefault from '../module/ComponentA';
import ComponentBDefault from '../module/ComponentB';
import ComponentCDefault from '../module/ComponentC';

describe('Module Import Test', () => {
  it('renders both named and default imports correctly', () => {
    // Basic rendering test to verify imports work
    expect(() => {
      render(<ComponentA />);
      render(<ComponentB />);
      render(<ComponentC />);
      
      render(<ComponentADefault />);
      render(<ComponentBDefault />);
      render(<ComponentCDefault />);
    }).not.toThrow();
  });
});
```

### Test Utilities

When adding test utilities to this directory, follow these guidelines:

1. **Scope**: Create utilities that are useful for multiple test files across different component categories.

2. **Naming**: Use clear, descriptive names that indicate what the utility does.

3. **Documentation**: Include JSDoc comments explaining the purpose and usage of the utility.

4. **Type Safety**: Use TypeScript types for all utility functions and objects.

## Testing Pattern

DirectoryMonster uses a multi-layered testing approach:

1. **Unit Tests**: Test individual components in isolation, focusing on their behavior, rendering, and interactions.

2. **Integration Tests**: Test components working together, with a focus on data flow and event handling.

3. **Feature Tests**: Test complete features or user workflows across multiple components.

4. **E2E Tests**: Test the entire application from a user's perspective, using browser automation.

## Best Practices

When writing tests for admin components:

1. **Component Isolation**: Test each component in isolation by mocking its dependencies.

2. **Data-Testid Attributes**: Use `data-testid` attributes for test element selection.

3. **Test Behaviors**: Focus on testing behaviors rather than implementation details.

4. **Accessibility Testing**: Include tests for keyboard navigation and screen reader accessibility.

5. **Edge Cases**: Test error states, loading states, and empty states.

## Setting Up Test Files

New component test files should be created in the `tests/admin/` directory, not in this directory. This directory is reserved for test utilities and structure tests.

For example, if you're adding tests for a new component in `sites/NewComponent.tsx`, create the test file at `tests/admin/sites/NewComponent.test.tsx`.

## Additional Resources

For more detailed information on testing practices and patterns, refer to these resources:

- `/specs/COMPONENT_TESTING.md`: Guidelines for component testing
- `/specs/HOOK_TESTING.md`: Guidelines for testing React hooks
- `/specs/TEST_HELPERS.md`: Documentation of test helper functions