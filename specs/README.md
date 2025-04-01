# DirectoryMonster Specifications

This directory contains specifications and design documents for the DirectoryMonster project. These documents define how components should work and serve as references for implementation.

## Document Types

- **Feature Specifications**: Define requirements and architecture for features
- **Testing Specifications**: Define testing requirements and standards
- **Security Specifications**: Define security requirements and implementation details
- **Design Specifications**: Define UI/UX design requirements

## Naming Convention

Documents in this directory follow these naming conventions:
- `*_SPEC.md`: Specifications for specific features or components
- `*.md`: General reference documentation

## Directory Structure

### Core Specifications
- **[TESTING_SPEC.md](./TESTING_SPEC.md)**: Main testing specification with requirements
- **[CROSS_TENANT_SECURITY_SPEC.md](./CROSS_TENANT_SECURITY_SPEC.md)**: Security specification for tenant isolation
- **[MULTI_TENANT_ACL_SPEC.md](./MULTI_TENANT_ACL_SPEC.md)**: ACL system specification for multi-tenancy

### Testing Specifications
- **[COMPONENT_TESTING.md](./COMPONENT_TESTING.md)**: Standards for component testing
- **[API_TESTING.md](./API_TESTING.md)**: Standards for API endpoint testing
- **[INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md)**: Standards for integration testing
- **[TEST_HELPERS.md](./TEST_HELPERS.md)**: Specifications for test helpers
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)**: Standards for accessibility testing
- **[AUTH_TESTING.md](./AUTH_TESTING.md)**: Standards for auth testing
- **[HOOK_TESTING.md](./HOOK_TESTING.md)**: Standards for hook testing

### Component Specification Directories
- **[api/](./api/)**: API endpoint specifications
- **[seeding/](./seeding/)**: Data seeding specifications
- **[seo/](./seo/)**: SEO specifications
- **[utilities/](./utilities/)**: Utility function specifications

## Quick Links

- [Test Types](./TESTING_SPEC.md#test-types)
- [Test Organization](./TESTING_SPEC.md#test-organization)
- [Security Architecture](./CROSS_TENANT_SECURITY_SPEC.md#security-measures)
- [ACL Model](./MULTI_TENANT_ACL_SPEC.md#core-concepts)

## Related Resources

- [Implementation Documentation](/docs) - Implementation guides and how-to documentation
- [Archived Specifications](./docs-archive) - Historical specification documents

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
