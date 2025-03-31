# Standardizing Mocking Patterns - Specification

## Overview

This document outlines the standardization of mocking patterns across the DirectoryMonster project with a focus on Next.js components, Redis clients, security middleware, and other commonly mocked dependencies. The goal is to eliminate inconsistencies, reduce code duplication, and improve test maintainability.

## Current State

### Identified Issues

1. **Inconsistent Next.js Mocking**: 
   - Multiple implementations of NextRequest/NextResponse mocks across test files
   - Duplicate code for creating mock objects
   - Inconsistent handling of response bodies (Buffer vs. JSON)

2. **Inconsistent Redis Mocking**: 
   - Different Redis mock implementations between tests
   - Duplicated mock store implementations
   - Varying levels of functionality coverage

3. **Inconsistent Security Middleware Mocking**: 
   - Redundant implementations of authentication/authorization mocks
   - Varying approaches to mocking context validation and permission checks
   - Limited reuse of middleware mock logic

4. **Test Setup Fragmentation**: 
   - Each test file configures its own mocks
   - No consistent pattern for mock initialization
   - Redundant mock reset/cleanup logic

### Existing Standard Mocks

The project has established standardized mocks in several directories:

1. **Next.js Mocks** (`tests/mocks/next/`):
   - `request.ts`: Standard NextRequest mock factory
   - `response.ts`: Standard NextResponse mock with JSON handling
   - `security-middleware.ts`: TenantContext and security middleware mocks

2. **UI Component Mocks** (`tests/mocks/ui/`):
   - Standardized React component mocks for UI testing

3. **Redis Client Mocks** (`tests/mocks/lib/redis-client.ts`):
   - In-memory Redis implementation for testing

4. **Setup Utilities**:
   - `setup-next-test.js`: Configures Next.js mocks for tests
   - `ui-setup.js`: Configures UI component mocks

## Requirements

### 1. Standardized Mocking System

Create a comprehensive standardized mocking system with:

- **Centralized Mock Definitions**: Single source of truth for each mock type
- **Consistent API**: Standardized function signatures and return values
- **Comprehensive Coverage**: Support for all commonly mocked dependencies
- **Documentation**: Clear guidelines for using each mock type

### 2. Migration Path

Establish a clear migration path for existing tests:

- **Identification**: Method to identify non-standard mock usage
- **Conversion Guidelines**: Step-by-step process to migrate to standard mocks
- **Validation**: Approach to verify mock standardization

### 3. Test Helper Functions

Develop test helper functions to simplify mock usage:

- **Setup Functions**: Configure standard mocks for specific test scenarios
- **Mock Control**: Functions to manipulate mock behavior
- **Assertion Helpers**: Simplify verification of mock interactions

## Implementation Plan

### Phase 1: Standardization of Core Mocks

#### 1.1 Next.js Mocks

1. **Review and enhance existing Next.js mocks**:
   - Update `createMockNextRequest` to handle all Next.js request properties
   - Enhance `mockNextResponseJson` to match production behavior
   - Extend security middleware mocks for all common scenarios
   - Create consistent patterns for error responses

2. **Add missing Next.js mock functionality**:
   - Mock implementation for server-side cookies
   - Support for file uploads and multipart forms
   - Enhanced URL parsing and query parameter handling
   - Integration with headers() and cookies() functions

#### 1.2 Redis Mocks

1. **Consolidate Redis mock implementations**:
   - Create a single, comprehensive Redis mock
   - Support all Redis operations used in the application
   - Implement proper mock cleanup between tests
   - Provide helper functions for test data setup

2. **Enhance Redis mock functionality**:
   - Add support for Redis transactions
   - Implement proper expiration simulation
   - Support Redis error scenarios
   - Add tenant isolation testing capabilities

#### 1.3 Security Middleware Mocks

1. **Standardize security middleware mocks**:
   - Implement consistent TenantContext mock
   - Create standardized permission checking mock
   - Develop utility functions for security scenarios
   - Support cross-tenant security testing

### Phase 2: Test Refactoring

#### 2.1 Create Mock Registration System

1. **Develop a centralized mock registration system**:
   - Create a registry for all mock configurations
   - Implement automatic mock setup/teardown
   - Support test-specific mock overrides
   - Provide mock state isolation between tests

#### 2.2 Refactor Existing Tests

1. **Identify tests requiring refactoring**:
   - Scan for non-standard mock implementations
   - Prioritize tests with the most duplication
   - Create migration plan for each test suite

2. **Apply standardized mocks to existing tests**:
   - Replace custom NextRequest/NextResponse mocks
   - Convert to standard Redis mocks
   - Update security middleware mocks
   - Verify test functionality after migration

### Phase 3: Documentation and Tooling

#### 3.1 Update Documentation

1. **Enhance mocking documentation**:
   - Update `MOCKING_GUIDE.md` with new standards
   - Create examples for common mocking scenarios
   - Document migration patterns for future reference
   - Include troubleshooting information

#### 3.2 Create Mocking Utilities

1. **Develop tooling to support standardization**:
   - Create Jest configuration for automatic mock loading
   - Implement lint rules for mocking patterns
   - Develop code generation utilities for common mock scenarios

## Acceptance Criteria

- All tests use standardized mocks from central locations
- No duplication of mock implementations across test files
- Comprehensive documentation for mock usage
- Automated testing of mock implementations
- Simplified test setup with consistent patterns
- Improved test reliability and maintainability

## Implementation Schedule

### Week 1: Framework Enhancement
- Review and update existing mock implementations
- Create missing mock functionality
- Develop mock registration system

### Week 2: Migration and Testing
- Identify and refactor highest priority tests
- Verify test functionality with standardized mocks
- Update documentation with new patterns

### Week 3: Tooling and Completion
- Create automated tools for mocking
- Complete migration of all tests
- Finalize documentation and examples

## Risk Management

### Potential Risks

1. **Test Breakage**: Tests might fail after migration to standardized mocks
   - Mitigation: Thorough testing of each migration, incremental approach

2. **Missing Mock Functionality**: Standard mocks might not cover all use cases
   - Mitigation: Comprehensive inventory of current mock usage, extensible design

3. **Developer Adoption**: Developers might continue using old patterns
   - Mitigation: Clear documentation, lint rules, code reviews

## Appendix A: Mock Implementation Guidelines

### NextRequest Mock Guidelines

```typescript
// Standard NextRequest mock factory
export function createMockNextRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cookies?: Record<string, string>;
  searchParams?: Record<string, string>;
} = {}): NextRequest {
  // Implementation guidelines...
}
```

### Redis Mock Guidelines

```typescript
// Standard Redis mock
export const redis = {
  get: jest.fn().mockImplementation((key: string) => { /* ... */ }),
  set: jest.fn().mockImplementation((key: string, value: any, options?: any) => { /* ... */ }),
  // Additional operations...
  
  // Test utilities
  _getMockState: () => { /* ... */ },
  _reset: () => { /* ... */ },
  _populate: (data: Record<string, any>) => { /* ... */ }
};
```

### Security Middleware Mock Guidelines

```typescript
// Standard security middleware setup
export function setupSecurityMocks(options: {
  tenantId?: string;
  userId?: string;
  permissions?: Record<string, string[]>;
  shouldSucceed?: boolean;
} = {}): void {
  // Implementation guidelines...
}
```

## Appendix B: Migration Examples

### Migrating NextRequest/NextResponse Mocks

**Before:**
```typescript
// Custom implementation
const req = {
  headers: {
    get: jest.fn().mockImplementation((name) => headers[name] || null),
  },
  url: 'http://localhost:3000/api/test'
} as unknown as NextRequest;
```

**After:**
```typescript
// Standardized implementation
import { createMockNextRequest } from '@/tests/mocks/next';

const req = createMockNextRequest({
  url: 'http://localhost:3000/api/test',
  headers: { 'x-tenant-id': 'tenant-123' }
});
```

### Migrating Redis Mocks

**Before:**
```typescript
// Custom Redis mock
jest.mock('@/lib/redis-client', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    // Other operations...
  }
}));
```

**After:**
```typescript
// Standardized Redis mock
import { setupRedisMock } from '@/tests/mocks/lib';

setupRedisMock({
  initialData: {
    'user:123': JSON.stringify({ name: 'Test User' })
  }
});
```
