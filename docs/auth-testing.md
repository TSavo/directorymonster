# Testing Zero-Knowledge Proof Authentication

This document provides guidelines for testing the Zero-Knowledge Proof (ZKP) authentication components in DirectoryMonster.

## Overview

The ZKP authentication system consists of several key components:

1. **ZKPLogin**: Client-side component for user login with ZKP
2. **SessionManager**: Handles authentication state, token management, and refresh
3. **RoleGuard**: Component for role-based access control
4. **API Endpoints**: Backend routes for authentication verification and token refresh

## Test Structure

Tests for the ZKP authentication system are located in:
- `tests/admin/auth/ZKPLogin.test.tsx`
- `tests/admin/auth/SessionManager.test.tsx`
- `tests/admin/auth/TokenRefresh.test.tsx`
- `tests/admin/auth/RoleAuthorization.test.tsx`
- `tests/admin/auth/PasswordReset.test.tsx`
- `tests/admin/auth/Logout.test.tsx`

## Mocking Strategy

When testing components that use Next.js features, proper mocking is essential:

```javascript
// Mock the Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/admin',
};

// Add the router mock before the tests run
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));
```

### CSRF Token Handling

For components that use CSRF tokens:

```javascript
// Mock document.cookie to provide a CSRF token
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'csrf_token=test-csrf-token',
});
```

### LocalStorage Mocking

```javascript
// Mock localStorage methods
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

## Testing Authentication Flow

The ZKP authentication testing covers the following flows:

1. **Login Process**
   - ZKP generation
   - Form validation
   - API interaction
   - Token storage
   - Redirect after successful login

2. **Session Management**
   - Authentication state persistence
   - Token expiration detection
   - Automatic token refresh
   - Logout functionality

3. **Role-Based Authorization**
   - Permission checking
   - Access control for protected routes
   - Role hierarchy enforcement

## Common Testing Issues

### Next.js Router

When testing components that use the Next.js App Router, you may encounter this error:
```
Error: invariant expected app router to be mounted
```

Solution: Always mock the Next.js router as shown above.

### Accessibility Testing

For spinner/loading state testing, prefer checking for text content rather than roles when ARIA roles are not properly exposed:

```javascript
// Instead of:
expect(screen.getByRole('progressbar')).toBeInTheDocument();

// Use:
expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
```

### Asynchronous Testing

For components with asynchronous behavior, use `waitFor` with appropriate timeouts:

```javascript
await waitFor(() => {
  expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
}, { timeout: 2000 });
```

## Best Practices

1. **Mock Dependencies**: Always mock external dependencies like ZKP libraries, fetch, localStorage, etc.
2. **Test Component Isolation**: Test each component in isolation with appropriate mocks.
3. **Handle Timeouts**: Use appropriate timeouts for async operations like token refresh.
4. **Test Error Scenarios**: Include tests for error handling, failed authentication, network errors, etc.
5. **Test UI Feedback**: Verify loading states, error messages, and success indicators.

## Current Test Status

- **ZKPLogin.test.tsx**: 14/14 tests passing - 100% line coverage
- **SessionManager.test.tsx**: 2/4 tests passing - 75% line coverage
- **TokenRefresh.test.tsx**: Tests need updating to match component implementation

## Known Issues

1. SessionManager tests have issues with authentication context propagation.
2. Token refresh tests need improvements for async behavior handling.
3. Additional tests needed for edge cases in token validation.
