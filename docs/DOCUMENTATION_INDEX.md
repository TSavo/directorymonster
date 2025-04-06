# DirectoryMonster Documentation Index

This document provides a comprehensive overview of all documentation and specifications for the DirectoryMonster project.

## Directory Structure

- `/docs` - Implementation guides and how-to documentation
- `/specs` - Specifications and design documents
- `/specs/archived` - Archived specifications
- `/specs/docs-archive` - Archived documentation

## Documentation By Category

### Security Documentation

| Document | Type | Description |
|----------|------|-------------|
| [TENANT_SECURITY_GUIDE.md](/docs/TENANT_SECURITY_GUIDE.md) | Guide | Implementation guide for tenant security |
| [UNIFIED_LISTING_TYPE.md](/docs/UNIFIED_LISTING_TYPE.md) | Guide | Documentation for the unified Listing type |
| [CROSS_TENANT_SECURITY_SPEC.md](/specs/CROSS_TENANT_SECURITY_SPEC.md) | Spec | Specification for preventing cross-tenant attacks |
| [MULTI_TENANT_ACL_SPEC.md](/specs/MULTI_TENANT_ACL_SPEC.md) | Spec | Specification for multi-tenant access control |

### Testing Documentation

| Document | Type | Description |
|----------|------|-------------|
| [TESTING_GUIDE.md](/docs/TESTING_GUIDE.md) | Guide | Implementation guide for writing tests |
| [TESTING_SPEC.md](/specs/TESTING_SPEC.md) | Spec | Testing standards and requirements |
| [MOCKING_GUIDE.md](/docs/MOCKING_GUIDE.md) | Guide | Guide for mocking dependencies in tests |
| [COMPONENT_TESTING.md](/specs/COMPONENT_TESTING.md) | Spec | Standards for component testing |
| [API_TESTING.md](/specs/API_TESTING.md) | Spec | Standards for API testing |
| [INTEGRATION_TESTING.md](/specs/INTEGRATION_TESTING.md) | Spec | Standards for integration testing |
| [HOOK_TESTING.md](/specs/HOOK_TESTING.md) | Spec | Standards for React hook testing |
| [AUTH_TESTING.md](/specs/AUTH_TESTING.md) | Spec | Standards for authentication testing |

### Features and Implementation

| Document | Type | Description |
|----------|------|-------------|
| [IMPLEMENTATION_SUMMARY.md](/IMPLEMENTATION_SUMMARY.md) | Summary | Overview of implementation details |
| [admin-mvp.md](/docs/admin-mvp.md) | Doc | Admin interface MVP documentation |
| [global-roles.md](/docs/global-roles.md) | Doc | Global roles implementation documentation |

## Document Naming Conventions

- `*_GUIDE.md` - Implementation guides in `/docs`
- `*_SPEC.md` - Specifications in `/specs`
- `*.md` - General documentation

## Recent Updates

The documentation structure has been reorganized to provide a clearer distinction between specifications (design requirements) and implementation documentation (how-to guides).

## Contributing to Documentation

When adding new documentation:

1. Follow the established naming conventions
2. Place specifications in `/specs` and implementation guides in `/docs`
3. Update this index when adding significant new documentation
4. Create links between related documents
