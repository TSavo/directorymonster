# Using the JWT Mock Implementation

This guide explains how to use the standardized JWT mock implementation for testing in the DirectoryMonster project.

## Overview

The JWT mock implementation provides a consistent way to simulate JWT token behavior in tests. It includes:

- Standard token constants (valid, invalid, expired)
- Mock implementations of `decode`, `verify`, and `sign` functions
- Helper functions for setup and reset

## Installation

The JWT mock is available at `@/tests/mocks/lib/auth/jwt.ts`.

## Basic Usage

1. Import the necessary functions and constants:

```typescript
import { 
  VALID_TOKEN, 
  INVALID_TOKEN, 
  EXPIRED_TOKEN, 
  setupJwtMock, 
  decode, 
  verify 
} from '@/tests/mocks/lib/auth/jwt';
```

2. Set up the JWT mock in your test file:

```typescript
// This will mock the 'jsonwebtoken' module
setupJwtMock();
```

3. Use the predefined tokens in your tests:

```typescript
it('should accept valid tokens', async () => {
  const req = createMockNextRequest({
    headers: {
      'authorization': `Bearer ${VALID_TOKEN}`
    }
  });
  
  // Test with valid token...
});

it('should reject invalid tokens', async () => {
  const req = createMockNextRequest({
    headers: {
      'authorization': `Bearer ${INVALID_TOKEN}`
    }
  });
  
  // Test with invalid token...
});
```

## Customizing Token Behavior

You can customize the behavior of the mock JWT functions for specific tests:

```typescript
// Override decode behavior for a specific test
decode.mockReturnValueOnce({ userId: 'custom-user' });

// Override verify behavior
verify.mockImplementationOnce((token) => {
  if (token === 'custom-token') {
    return { userId: 'custom-user' };
  }
  throw new Error('Custom error');
});
```

## Available Constants

- `VALID_TOKEN`: A token that will pass verification
- `INVALID_TOKEN`: A token that will fail verification
- `EXPIRED_TOKEN`: A token that will throw an expired error
- `VALID_PAYLOAD`: The default payload for valid tokens
- `DEFAULT_USER_ID`: The default user ID in valid tokens

## Mock Reset

To reset the mock behavior between tests:

```typescript
import { resetJwtMock } from '@/tests/mocks/lib/auth/jwt';

beforeEach(() => {
  resetJwtMock();
});
```

## Integration with Other Mocks

The JWT mock works seamlessly with other standard mocks:

```typescript
import { createMockNextRequest } from '@/tests/mocks/next/request';
import { mockNextResponseJson, setupNextResponseMock } from '@/tests/mocks/next/response';
import { VALID_TOKEN, setupJwtMock } from '@/tests/mocks/lib/auth/jwt';

// Setup mocks
setupNextResponseMock();
setupJwtMock();

it('should work with secure middleware', async () => {
  const req = createMockNextRequest({
    headers: {
      'x-tenant-id': 'tenant-123',
      'authorization': `Bearer ${VALID_TOKEN}`
    }
  });
  
  // Test implementation...
});
```

## Best Practices

1. Always use `setupJwtMock()` at the top level of your test file
2. Use the predefined constants for consistency
3. Reset mocks between tests using `resetJwtMock()`
4. Minimize custom implementations to maintain consistency
