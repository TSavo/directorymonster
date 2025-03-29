# Component Test Suite

This directory contains tests for all UI components in the DirectoryMonster application.

## Running Component Tests

We've created a dedicated test suite for components to make it easier to focus on component testing and coverage.

### Available Commands

```bash
# Run the component test suite
npm run test:components:suite

# Run with coverage reporting
npm run test:components:suite:coverage

# Run in watch mode (useful during development)
npm run test:components:suite:watch
```

## Test Organization

Component tests are organized following the same structure as the components themselves:

```
tests/
├── components/           # Core shared components
│   └── index.test.tsx    # Main entry point for component tests
├── admin/                # Admin-specific components
│   ├── auth/             # Authentication components
│   ├── categories/       # Category management components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   ├── listings/         # Listing management components
│   └── sites/            # Site management components
└── search/               # Search components
```

## Test File Patterns

We use the following patterns for test files:

- **Basic tests**: `ComponentName.test.tsx`
- **Feature-specific tests**: `ComponentName.[feature].test.tsx`
- **API interaction tests**: `ComponentName.api.test.tsx`
- **Validation tests**: `ComponentName.validation.test.tsx`
- **Accessibility tests**: `ComponentName.accessibility.test.tsx`

## Coverage Goals

Our target is to achieve 80% code coverage for all component files. The coverage report will show:

- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

## Adding New Component Tests

When adding a new component test:

1. Create the test file following the patterns above
2. Import the test in the appropriate section of `index.test.tsx`
3. Run the test suite to ensure all tests pass
4. Check coverage to identify any gaps

## Best Practices

- Use data-testid attributes for selecting elements
- Test behavior, not implementation
- Include accessibility tests for user-facing components
- Test edge cases and error states
- Create separate test files for complex components
