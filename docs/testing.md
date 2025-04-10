# Testing Infrastructure Documentation

This document provides an overview of the testing infrastructure for the DirectoryMonster application.

## Table of Contents

1. [Introduction](#introduction)
2. [Directory Structure](#directory-structure)
3. [Testing Utilities](#testing-utilities)
4. [Mock Repository](#mock-repository)
5. [Jest Configuration](#jest-configuration)
6. [Writing Tests](#writing-tests)
7. [Running Tests](#running-tests)
8. [Best Practices](#best-practices)

## Introduction

The testing infrastructure is designed to provide a consistent, maintainable, and reliable way to test the application. It includes utilities for rendering components, testing hooks, mocking API calls, and more.

## Directory Structure

```
tests/
├── utils/                  # Testing utilities
│   ├── index.ts            # Main entry point for utilities
│   ├── render.tsx          # Utilities for rendering components
│   ├── hook.tsx            # Utilities for testing hooks
│   ├── api.ts              # Utilities for testing API routes
│   ├── mock.ts             # Utilities for creating mocks
│   └── assertions.ts       # Custom assertions
├── mocks/                  # Mock implementations
│   ├── index.ts            # Main entry point for mocks
│   ├── components/         # Component mocks
│   │   ├── index.ts        # Main entry point for component mocks
│   │   ├── ui/             # UI component mocks
│   │   ├── admin/          # Admin component mocks
│   │   └── public/         # Public component mocks
│   ├── hooks/              # Hook mocks
│   ├── services/           # Service mocks
│   ├── utils/              # Utility mocks
│   └── next/               # Next.js mocks
└── __mocks__/              # Jest automatic mocks
```

## Testing Utilities

### Render Utilities

The `render.tsx` file provides utilities for rendering components in tests:

```typescript
import { render, screen } from '@/tests/utils/render';

// Render a component with providers
render(<MyComponent />, { withAuth: true, withTheme: true });

// Access rendered elements
const element = screen.getByText('Hello, World!');
```

### Form Testing Utilities

The `form-testing.ts` file provides utilities for testing forms:

```typescript
import { fillFieldByLabel, fillFieldByTestId, selectOptionByLabel, submitForm } from '@/tests/utils/form-testing';

// Fill a field by label
await fillFieldByLabel('Name', 'John Doe');

// Fill a field by test ID
await fillFieldByTestId('input-email', 'john@example.com');

// Select an option in a select field
await selectOptionByLabel('Category', 'Technology');

// Submit a form
await submitForm();
```

### Hook Testing Utilities

The `hook.tsx` file provides utilities for testing hooks:

```typescript
import { renderHook, act } from '@/tests/utils/hook';

// Render a hook with providers
const { result } = renderHook(() => useMyHook(), { withAuth: true });

// Update the hook state
act(() => {
  result.current.setValue('new value');
});

// Assert the result
expect(result.current.value).toBe('new value');
```

### API Testing Utilities

The `api.ts` file provides utilities for testing API routes:

```typescript
import { createMockRequest, parseResponseBody } from '@/tests/utils/api';

// Create a mock request
const request = createMockRequest({
  method: 'POST',
  url: 'http://localhost:3000/api/users',
  body: { name: 'Test User' },
});

// Call the API route handler
const response = await handler(request);

// Parse the response body
const body = await parseResponseBody(response);
expect(body).toEqual({ success: true });
```

### Mock Utilities

The `mock.ts` file provides utilities for creating mocks:

```typescript
import { createChainableMock, createMockEvent } from '@/tests/utils/mock';

// Create a chainable mock function
const mockFn = createChainableMock();
mockFn.mockResolvedValue({ success: true });

// Create a mock event
const mockEvent = createMockEvent({ target: { value: 'test' } });
```

### Assertion Utilities

The `assertions.ts` file provides custom assertions:

```typescript
import { assertTextVisible, assertButtonEnabled } from '@/tests/utils/assertions';

// Assert that text is visible
assertTextVisible('Hello, World!');

// Assert that a button is enabled
assertButtonEnabled('Submit');
```

### Form Polyfills

The `form-polyfills.js` file provides polyfills for form methods that are not implemented in JSDOM:

```typescript
// Import the form polyfills in your test file or in jest.setup.js
import '@/tests/utils/form-polyfills';

// Now you can use HTMLFormElement.prototype.requestSubmit in your tests
const form = screen.getByTestId('form');
form.requestSubmit();
```

## Mock Repository

### Component Mocks

The `components` directory contains mocks for UI components:

```typescript
import { Button } from '@/tests/mocks/components/ui';

// Use a mocked button component
<Button>Click Me</Button>
```

### Hook Mocks

The `hooks` directory contains mocks for hooks:

```typescript
import { createUseAuthMock } from '@/tests/mocks/hooks';

// Create a mock for the useAuth hook
const useAuthMock = createUseAuthMock({
  isAuthenticated: true,
  user: { id: 'user-1', name: 'Test User' },
});

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: useAuthMock,
}));
```

### Service Mocks

The `services` directory contains mocks for services:

```typescript
import { createUserServiceMock } from '@/tests/mocks/services';

// Create a mock for the userService
const userServiceMock = createUserServiceMock({
  users: [{ id: 'user-1', name: 'Test User' }],
});

// Mock the userService
jest.mock('@/services/userService', () => ({
  userService: userServiceMock,
}));
```

### Next.js Mocks

The `next` directory contains mocks for Next.js:

```typescript
import { createMockRouter } from '@/tests/mocks/next';

// Create a mock router
const mockRouter = createMockRouter({
  pathname: '/users/[id]',
  query: { id: 'user-1' },
});

// Mock the useRouter hook
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));
```

## Jest Configuration

The Jest configuration is split into multiple files:

- `jest.config.base.js`: Base configuration for all test types
- `jest.config.js`: Main configuration that extends the base configuration
- `jest.detailed.config.js`: Configuration for the detailed failure reporter

### Running Different Test Types

The Jest configuration includes projects for different test types:

- `unit`: Unit tests
- `integration`: Integration tests
- `component`: Component tests
- `hook`: Hook tests
- `api`: API tests
- `failures`: Tests that failed in the last run

## Writing Tests

### Component Tests

```typescript
import React from 'react';
import { render, screen } from '@/tests/utils/render';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    screen.getByText('Click Me').click();
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Hook Tests

```typescript
import { renderHook, act } from '@/tests/utils/hook';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('increments the counter', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });
});
```

### API Tests

```typescript
import { createMockRequest, parseResponseBody } from '@/tests/utils/api';
import { GET, POST } from '@/app/api/users/route';

describe('Users API', () => {
  it('returns users', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/users',
    });

    const response = await GET(request);
    const body = await parseResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.users).toBeDefined();
  });

  it('creates a user', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/users',
      body: { name: 'Test User' },
    });

    const response = await POST(request);
    const body = await parseResponseBody(response);

    expect(response.status).toBe(201);
    expect(body.user).toBeDefined();
    expect(body.user.name).toBe('Test User');
  });
});
```

## Running Tests

The following npm scripts are available for running tests:

- `npm test`: Run all tests
- `npm run test:unit`: Run unit tests
- `npm run test:integration`: Run integration tests
- `npm run test:component`: Run component tests
- `npm run test:hook`: Run hook tests
- `npm run test:api`: Run API tests
- `npm run test:failures`: Run tests with detailed failure reporting to help identify and fix failing tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage

## Best Practices

### Testing Components

1. **Test behavior, not implementation**: Focus on what the component does, not how it does it.
2. **Use user-centric selectors**: Use `getByRole`, `getByLabelText`, etc. instead of `getByTestId`.
3. **Test accessibility**: Ensure that components are accessible by using the correct ARIA roles.
4. **Test edge cases**: Test empty states, loading states, error states, etc.
5. **Keep tests simple**: Each test should test one thing.

### Testing Hooks

1. **Test the initial state**: Ensure that the hook initializes with the correct state.
2. **Test state updates**: Ensure that the hook updates its state correctly.
3. **Test side effects**: Ensure that the hook performs side effects correctly.
4. **Test error handling**: Ensure that the hook handles errors correctly.

### Testing API Routes

1. **Test success cases**: Ensure that the API route returns the correct response for valid requests.
2. **Test error cases**: Ensure that the API route returns the correct error response for invalid requests.
3. **Test edge cases**: Test empty requests, malformed requests, etc.

### General Best Practices

1. **Keep tests isolated**: Each test should be independent of other tests.
2. **Use mocks judiciously**: Only mock what you need to.
3. **Test the public API**: Test the public interface of your components, hooks, and services.
4. **Write readable tests**: Use descriptive test names and assertions.
5. **Keep tests fast**: Tests should run quickly to provide fast feedback.
6. **Use test utilities**: Use the provided test utilities to make tests more readable and maintainable.
7. **Follow the container/presentation pattern**: Separate business logic from presentation to make testing easier.
8. **Use form testing utilities**: Use the form testing utilities to test forms more easily.
9. **Use form polyfills**: Use the form polyfills to test forms that use methods not implemented in JSDOM.
10. **Run failing tests first**: Use the `test:failures` script to identify and fix failing tests.
