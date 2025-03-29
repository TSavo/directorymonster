# DirectoryMonster Testing Documentation

This directory contains comprehensive documentation for testing the DirectoryMonster application.

## Directory Structure

### Main Testing Guides
- **[TESTING.md](./TESTING.md)**: Main testing guide with an overview of testing approaches, structure, and practices
- **[COMPONENT_TESTING.md](./COMPONENT_TESTING.md)**: Detailed patterns and examples for component testing
- **[API_TESTING.md](./API_TESTING.md)**: Patterns and examples for API endpoint testing
- **[INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md)**: Guide for integration testing, including multitenancy and end-to-end flows
- **[TEST_HELPERS.md](./TEST_HELPERS.md)**: Documentation for test helpers, fixtures, mocks, and utilities

### Specialized Testing Guides
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)**: Guide for accessibility testing practices
- **[AUTH_TESTING.md](./AUTH_TESTING.md)**: Guide for authentication and authorization testing
- **[HOOK_TESTING.md](./HOOK_TESTING.md)**: Guide for testing React hooks

### Project Component Documentation
- **[api/](./api/)**: API endpoints documentation
- **[seeding/](./seeding/)**: Data seeding scripts and procedures
- **[seo/](./seo/)**: SEO configuration and practices
- **[utilities/](./utilities/)**: Utility functions documentation

## Quick Links

- [Test Types](./TESTING.md#test-types)
- [Test Organization](./TESTING.md#test-organization)
- [Running Tests](./TESTING.md#running-tests)
- [Component Test Patterns](./COMPONENT_TESTING.md#common-testing-patterns)
- [API Test Structure](./API_TESTING.md#api-test-structure)
- [Integration Test Types](./INTEGRATION_TESTING.md#integration-test-types)
- [Test Helpers](./TEST_HELPERS.md#test-helpers)
- [Test Fixtures](./TEST_HELPERS.md#test-fixtures)

## Test Coverage

Our current test coverage targets:

- Unit tests: 70-80% coverage
- Integration tests: Coverage of all key user flows
- API tests: Coverage of all endpoints with various test cases
- Comprehensive coverage for critical components:
  - CategoryTable and related components: 100%
  - DomainManager: 76.47%
  - useDomains hook: 87.5%
  - SiteForm: 90%+
  - ZKPLogin: 98.38%
  - ActivityFeed: 100%
  - StatisticCards: 91.66%

To check current test coverage, run:

```bash
npm test -- --coverage
```

## Best Practices

- Use data-testid attributes for element selection
- Test behavior, not implementation details
- Ensure keyboard accessibility in interactive components
- Use appropriate mocks for external dependencies
- Verify error handling and loading states
- Test both happy paths and error cases
- Keep test files organized to mirror the component structure

Refer to the specific documentation files for detailed guidelines on each type of testing.
