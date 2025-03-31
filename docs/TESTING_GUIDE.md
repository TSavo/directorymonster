# DirectoryMonster Testing Guide

## Overview

This document provides guidelines and best practices for testing in the DirectoryMonster project, with a focus on properly mocking dependencies and ensuring effective test isolation.

## Testing Approach

DirectoryMonster follows a multi-layered testing approach:

1. **Unit Tests**: Test individual components and functions in isolation
2. **Integration Tests**: Test interaction between components
3. **End-to-End Tests**: Test complete user workflows

## Mocking Best Practices

Proper mocking is crucial for effective testing, especially for middleware and services with complex dependencies. Based on our experience with security middleware testing, here are key lessons learned:

### 1. Mock Order and Variable Initialization

**Problem**: Variables defined after their use in mocks lead to "Cannot access X before initialization" errors.

**Solution**:
- Define all constants and variables **before** using them in jest.mock() calls
- Never reference variables in mock definitions that haven't been initialized yet

```typescript
// ❌ INCORRECT: Using TEST_ID before initialization
jest.mock('uuid', () => ({
  v4: () => TEST_ID // Error: Cannot access TEST_ID before initialization
}));
const TEST_ID = '123';

// ✅ CORRECT: Define constants first, then use in mocks
const TEST_ID = '123';
jest.mock('uuid', () => ({
  v4: () => TEST_ID // Works correctly
}));
```

### 2. Function Mock Implementation

**Problem**: Using `.mockReturnValue()` or `.mockImplementation()` on undefined mocks causes errors.

**Solution**:
- Initialize mock functions independently before using mock methods
- Use jest.fn() with simple function implementation in jest.mock()

```typescript
// ❌ INCORRECT: Trying to use mockReturnValue on a non-existent mock
jest.mock('uuid', () => ({
  validate: jest.fn() // Mock is defined but methods aren't chained yet
}));
// This fails because the validate mock isn't directly accessible
(validate as jest.Mock).mockReturnValue(true);

// ✅ CORRECT: Define mock implementations directly in jest.mock
jest.mock('uuid', () => ({
  validate: jest.fn(() => true) // Implementation is defined directly
}));
// Later, we can modify the mock behavior if needed
import { validate } from 'uuid';
(validate as jest.Mock).mockReturnValueOnce(false);
```

### 3. Buffer Response Handling

**Problem**: NextResponse.json() returns bodies as Buffer objects in tests, but assertions expect plain objects.

**Solution**:
- Parse Buffer responses before assertions
- Create helper functions for consistent Buffer handling

```typescript
// ❌ INCORRECT: Directly asserting on Buffer response body
expect(response.body).toEqual({ error: 'Unauthorized' }); // Fails

// ✅ CORRECT: Parse Buffer response before assertion
const bodyContent = response.body instanceof Buffer 
  ? JSON.parse(Buffer.from(response.body).toString('utf8'))
  : response.body;
expect(bodyContent).toEqual({ error: 'Unauthorized' });
```

### 4. Module Mocking Strategy

**Problem**: Mixing import statements and jest.mock() can cause inconsistent behavior.

**Solution**:
- Always place jest.mock() calls before imports
- Use a consistent pattern for mocking entire modules

```typescript
// ✅ CORRECT: Mock modules first, import after
jest.mock('@/lib/tenant-membership-service', () => ({
  __esModule: true, // Important for ES modules
  default: {
    isTenantMember: jest.fn(() => Promise.resolve(true))
  }
}));

// Then import the mocked module
import TenantMembershipService from '@/lib/tenant-membership-service';

// Use the mock in tests
(TenantMembershipService.isTenantMember as jest.Mock).mockResolvedValueOnce(false);
```

### 5. Complex Middleware Mocking

**Problem**: Middleware functions with complex behaviors are difficult to mock reliably.

**Solution**:
- Create complete mock implementations for middleware functions
- Control middleware behavior with test-specific variables

```typescript
// ✅ RECOMMENDED: Control middleware behavior with variables
let mockResponseStatus = 200;
let mockResponseBody = { success: true };

jest.mock('@/app/api/middleware/secureTenantContext', () => ({
  withSecureTenantContext: jest.fn().mockImplementation(
    async (req, handler) => {
      // Use the control variables to determine middleware behavior
      if (mockResponseStatus !== 200) {
        return NextResponse.json(
          mockResponseBody,
          { status: mockResponseStatus }
        );
      }
      
      return handler(req, { tenantId: 'test-tenant', userId: 'test-user' });
    }
  )
}));

// Then in tests, control middleware behavior:
it('should handle middleware failure', async () => {
  // Set up middleware to fail with 403
  mockResponseStatus = 403;
  mockResponseBody = { error: 'Access denied' };
  
  // Test with the configured mock behavior
  const result = await someFunction();
  expect(result.status).toBe(403);
  
  // Reset for other tests
  mockResponseStatus = 200;
});
```

## Testing the Security Middleware

When testing tenant security middleware, follow these specific guidelines:

### 1. Testing Context Validation

- Mock TenantContext.fromRequest() for consistent test behavior
- Test both successful and failed context validation
- Verify audit logging for security events

### 2. Testing Permission Checks

- Mock RoleService.hasPermission() with different return values
- Verify proper handler execution based on permissions
- Test that 403 responses include proper error details

### 3. Testing Cross-Tenant Detection

- Create requests with cross-tenant references in different locations:
  - URL parameters
  - Request body (nested objects)
  - Path segments
- Verify all cross-tenant attempts are blocked with 403
- Check that audit events are logged for detected attempts

## Test Structure Best Practices

Organize security middleware tests following this structure:

```typescript
describe('Middleware Component', () => {
  // Setup and teardown
  beforeAll(() => {
    // Global test setup
  });
  
  afterAll(() => {
    // Cleanup
  });
  
  beforeEach(() => {
    // Reset mocks for each test
    jest.clearAllMocks();
  });
  
  describe('Success Scenarios', () => {
    // Tests for successful middleware execution
  });
  
  describe('Validation Failures', () => {
    // Tests for various validation failures
  });
  
  describe('Security Violation Detection', () => {
    // Tests for security violation scenarios
  });
  
  describe('Error Handling', () => {
    // Tests for error handling in the middleware
  });
});
```

## Common Testing Pitfalls

1. **Stateful Mocks**: Mocks retaining state between tests. Always reset mocks in beforeEach().

2. **Module Import Order**: Importing modules before mocking them. Always mock first, then import.

3. **Assuming Response Structure**: Assuming response body structure without parsing. Always handle Buffer responses.

4. **Improper Assertions**: Testing implementation details instead of behavior. Focus on inputs and outputs.

5. **Missing Edge Cases**: Not testing all security edge cases. Include tests for all potential security bypasses.

## Additional Resources

- [Jest Mocking Documentation](https://jestjs.io/docs/mock-functions)
- [Testing Next.js Applications](https://nextjs.org/docs/testing)
- [Tenant Security Guide](./TENANT_SECURITY_GUIDE.md)
