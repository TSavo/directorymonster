# ACL Test Harness

This directory contains utilities for testing ACL (Access Control List) implementation across the application.

## Overview

The test harness provides a standardized way to test that API routes are properly protected with ACL checks. It follows the Red-Green-Refactor cycle of Test-Driven Development (TDD):

1. **Red**: Write a failing test that expects the route to use ACL protection
2. **Green**: Implement the ACL protection to make the test pass
3. **Refactor**: Improve the implementation while keeping tests passing

## Key Components

### `aclTestHarness.js`

Provides a simple function to create ACL tests for route handlers:

- Verifies that the route uses `withSecureTenantPermission`
- Checks that the correct resource type and permission are used
- Tests handling of permission denial

## Usage Examples

### Testing a Single Handler

```javascript
const { createAclTest } = require('../../utils/aclTestHarness');
const { POST } = require('@/app/api/admin/users/route');

createAclTest({
  name: 'POST /api/admin/users',
  handler: POST,
  method: 'POST',
  resourceType: 'user',
  permission: 'create',
  requestBody: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  }
});
```

### Testing Multiple Handlers

```javascript
const { createAclTest } = require('../../utils/aclTestHarness');
const { GET, POST } = require('@/app/api/tenants/route');

// Test GET endpoint
createAclTest({
  name: 'GET /api/tenants',
  handler: GET,
  method: 'GET',
  resourceType: 'tenant',
  permission: 'read'
});

// Test POST endpoint
createAclTest({
  name: 'POST /api/tenants',
  handler: POST,
  method: 'POST',
  resourceType: 'tenant',
  permission: 'create',
  requestBody: {
    name: 'New Tenant',
    slug: 'new-tenant',
    hostnames: ['new-tenant.example.com']
  }
});
```

## Best Practices

1. **Test One Thing at a Time**: Each test should focus on a single aspect of the implementation.

2. **Follow Red-Green-Refactor**: Write a failing test first, then implement the code to make it pass.

3. **Mock External Dependencies**: The test harness automatically mocks external dependencies.

4. **Test Edge Cases**: The test harness includes tests for permission denial.

5. **Keep Tests Fast**: The test harness is designed to be fast and efficient.

## Troubleshooting

### Mock Not Being Called

If your mock is not being called:

1. Make sure you're importing the handler after the test harness
2. Verify that the handler is using `withSecureTenantPermission`
3. Make sure you're calling the handler correctly in your test

### Standardized Route Exports

All route files should use direct exports for consistency:

```typescript
// Correct
export async function GET(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }

// Incorrect
const handlers = { GET, POST };
export { handlers as GET, handlers as POST };
```
