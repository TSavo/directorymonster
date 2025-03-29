# Authentication Testing Guide

This document outlines the approach to testing authentication and authorization functionality in the DirectoryMonster application.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Test Setup](#test-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [API Endpoint Testing](#api-endpoint-testing)
6. [Middleware Testing](#middleware-testing)
7. [Test Examples](#test-examples)

## Authentication Flow

DirectoryMonster uses a token-based authentication system with the following components:

1. **Authentication Provider**: A React context that manages authentication state
2. **Auth API Endpoints**: Server endpoints that handle login, logout, and session management
3. **Protected Routes**: Routes that require authentication
4. **withAuth Middleware**: API route middleware that verifies authentication

## Test Setup

### Authentication Mocking

For testing components that depend on authentication state:

```tsx
// Mock authentication context
jest.mock('@/contexts/auth', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require('@/contexts/auth');

// Configure mock for each test
useAuth.mockReturnValue({
  user: { id: 'user-123', name: 'Test User', role: 'admin' },
  loading: false,
  error: null,
  signIn: jest.fn(),
  signOut: jest.fn(),
});
```

### Test Helper for Auth Components

```tsx
// src/test-utils/render-with-auth.tsx
import { render } from '@testing-library/react';
import { AuthContext } from '@/contexts/auth';

export const renderWithAuth = (ui, authProps = {}) => {
  const defaultAuthProps = {
    user: null,
    loading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    ...authProps
  };
  
  return {
    ...render(
      <AuthContext.Provider value={defaultAuthProps}>
        {ui}
      </AuthContext.Provider>
    ),
    authProps: defaultAuthProps
  };
};
```

## Unit Testing

### Testing Auth Hooks

```tsx
describe('useAuth Hook', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = jest.fn();
  });
  
  it('handles successful login', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 'user-123', name: 'Test User' }, token: 'valid-token' })
    });
    
    const { result } = renderHook(() => useAuth());
    
    // Initial state
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Call sign in
    let signInResult;
    await act(async () => {
      signInResult = await result.current.signIn({ email: 'user@example.com', password: 'password' });
    });
    
    // Check API was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', password: 'password' })
      })
    );
    
    // Check state was updated
    expect(result.current.user).toEqual({ id: 'user-123', name: 'Test User' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(signInResult.success).toBe(true);
  });
  
  it('handles failed login', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' })
    });
    
    const { result } = renderHook(() => useAuth());
    
    // Call sign in
    let signInResult;
    await act(async () => {
      signInResult = await result.current.signIn({ email: 'wrong@example.com', password: 'wrong' });
    });
    
    // Check state was updated with error
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
    expect(signInResult.success).toBe(false);
  });
});
```

### Testing Protected Components

```tsx
describe('AdminDashboard Component', () => {
  it('renders dashboard for authenticated admin users', () => {
    // Render with auth context
    renderWithAuth(<AdminDashboard />, {
      user: { id: 'user-123', role: 'admin' }
    });
    
    // Check dashboard content is rendered
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Site Management')).toBeInTheDocument();
  });
  
  it('redirects non-admin users', () => {
    // Mock router
    const mockRouter = {
      push: jest.fn()
    };
    useRouter.mockReturnValue(mockRouter);
    
    // Render with non-admin user
    renderWithAuth(<AdminDashboard />, {
      user: { id: 'user-123', role: 'user' }
    });
    
    // Check redirection
    expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
  });
  
  it('redirects unauthenticated users to login', () => {
    // Mock router
    const mockRouter = {
      push: jest.fn()
    };
    useRouter.mockReturnValue(mockRouter);
    
    // Render with no user (unauthenticated)
    renderWithAuth(<AdminDashboard />, {
      user: null
    });
    
    // Check redirection to login
    expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=/admin');
  });
});
```

## Integration Testing

```tsx
describe('Authentication Flow', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = jest.fn();
    
    // Mock router
    const mockRouter = {
      push: jest.fn(),
      query: {}
    };
    useRouter.mockReturnValue(mockRouter);
  });
  
  it('completes the full login flow', async () => {
    const user = userEvent.setup();
    
    // Mock successful login response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        user: { id: 'user-123', name: 'Test User', role: 'admin' }, 
        token: 'valid-token' 
      })
    });
    
    // Initial auth state
    const authState = {
      user: null,
      loading: false,
      error: null,
      signIn: jest.fn().mockResolvedValue({ success: true }),
      signOut: jest.fn()
    };
    
    // Render login page
    renderWithAuth(<LoginPage />, authState);
    
    // Fill in login form
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Verify signIn was called with correct credentials
    expect(authState.signIn).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password123'
    });
    
    // Verify redirection to dashboard
    expect(useRouter().push).toHaveBeenCalledWith('/admin');
  });
  
  it('handles login errors', async () => {
    const user = userEvent.setup();
    
    // Mock failed login
    const authState = {
      user: null,
      loading: false,
      error: 'Invalid credentials',
      signIn: jest.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' }),
      signOut: jest.fn()
    };
    
    // Render login page
    renderWithAuth(<LoginPage />, authState);
    
    // Fill in login form
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Verify error message is displayed
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    
    // Verify no redirection occurred
    expect(useRouter().push).not.toHaveBeenCalled();
  });
});
```

## API Endpoint Testing

```typescript
describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('/api/auth/login', () => {
    it('authenticates valid credentials', async () => {
      // Mock database/Redis to return user
      const redisClient = require('@/lib/redis-client').getClient();
      redisClient.get.mockImplementation((key) => {
        if (key === 'user:email:valid@example.com') {
          return Promise.resolve(JSON.stringify({
            id: 'user-123',
            email: 'valid@example.com',
            password: 'hashed-password',
            name: 'Test User',
            role: 'admin'
          }));
        }
        return Promise.resolve(null);
      });
      
      // Mock password verification
      require('@/lib/auth').verifyPassword.mockResolvedValue(true);
      
      // Create request
      const req = createRequest({
        method: 'POST',
        body: {
          email: 'valid@example.com',
          password: 'correct-password'
        }
      });
      
      const res = createResponse();
      
      // Call handler
      await loginHandler(req, res);
      
      // Verify response
      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('valid@example.com');
      expect(data.token).toBeDefined();
      
      // Password should not be included in response
      expect(data.user.password).toBeUndefined();
    });
    
    it('rejects invalid credentials', async () => {
      // Mock database/Redis to return user
      const redisClient = require('@/lib/redis-client').getClient();
      redisClient.get.mockResolvedValue(JSON.stringify({
        id: 'user-123',
        email: 'valid@example.com',
        password: 'hashed-password'
      }));
      
      // Mock password verification to fail
      require('@/lib/auth').verifyPassword.mockResolvedValue(false);
      
      // Create request
      const req = createRequest({
        method: 'POST',
        body: {
          email: 'valid@example.com',
          password: 'wrong-password'
        }
      });
      
      const res = createResponse();
      
      // Call handler
      await loginHandler(req, res);
      
      // Verify response
      expect(res._getStatusCode()).toBe(401);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });
  });
});
```

## Middleware Testing

```typescript
describe('withAuth Middleware', () => {
  // Mock API handler that the middleware will wrap
  const mockHandler = jest.fn((req, res) => {
    res.status(200).json({ success: true });
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('allows requests with valid tokens', async () => {
    // Mock verifyToken to return a valid user
    require('@/lib/auth').verifyToken.mockResolvedValue({
      id: 'user-123',
      role: 'admin'
    });
    
    // Create wrapped handler
    const wrappedHandler = withAuth(mockHandler);
    
    // Create request with Authorization header
    const req = createRequest({
      headers: {
        Authorization: 'Bearer valid-token'
      }
    });
    
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify the handler was called with the user in the request
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler.mock.calls[0][0].user).toEqual({
      id: 'user-123',
      role: 'admin'
    });
    
    // Verify the response is as expected
    expect(res._getStatusCode()).toBe(200);
  });
  
  it('rejects requests with invalid tokens', async () => {
    // Mock verifyToken to return null (invalid token)
    require('@/lib/auth').verifyToken.mockResolvedValue(null);
    
    // Create wrapped handler
    const wrappedHandler = withAuth(mockHandler);
    
    // Create request with invalid Authorization header
    const req = createRequest({
      headers: {
        Authorization: 'Bearer invalid-token'
      }
    });
    
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Verify the response is unauthorized
    expect(res._getStatusCode()).toBe(401);
    
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Unauthorized');
  });
  
  it('rejects requests without tokens', async () => {
    // Create wrapped handler
    const wrappedHandler = withAuth(mockHandler);
    
    // Create request without Authorization header
    const req = createRequest();
    const res = createResponse();
    
    // Call the wrapped handler
    await wrappedHandler(req, res);
    
    // Verify the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Verify the response is unauthorized
    expect(res._getStatusCode()).toBe(401);
  });
  
  it('handles role-based authorization', async () => {
    // Create wrapped handler with admin role requirement
    const wrappedHandler = withAuth(mockHandler, { requiredRole: 'admin' });
    
    // Test with admin role
    require('@/lib/auth').verifyToken.mockResolvedValueOnce({
      id: 'admin-123',
      role: 'admin'
    });
    
    const adminReq = createRequest({
      headers: { Authorization: 'Bearer admin-token' }
    });
    const adminRes = createResponse();
    
    await wrappedHandler(adminReq, adminRes);
    
    // Should allow admin
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(adminRes._getStatusCode()).toBe(200);
    
    mockHandler.mockClear();
    
    // Test with non-admin role
    require('@/lib/auth').verifyToken.mockResolvedValueOnce({
      id: 'user-123',
      role: 'user'
    });
    
    const userReq = createRequest({
      headers: { Authorization: 'Bearer user-token' }
    });
    const userRes = createResponse();
    
    await wrappedHandler(userReq, userRes);
    
    // Should reject non-admin
    expect(mockHandler).not.toHaveBeenCalled();
    expect(userRes._getStatusCode()).toBe(403); // Forbidden
  });
});
```

## Test Examples

### Testing Login Component

```tsx
describe('Login Component', () => {
  const user = userEvent.setup();
  
  // Mock authentication hook
  const mockSignIn = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signIn: mockSignIn
    });
  });
  
  it('submits login credentials', async () => {
    // Mock successful sign in
    mockSignIn.mockResolvedValueOnce({ success: true });
    
    render(<Login />);
    
    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify sign in was called with correct credentials
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  it('displays validation errors', async () => {
    render(<Login />);
    
    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check validation errors
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    
    // Sign in should not be called
    expect(mockSignIn).not.toHaveBeenCalled();
  });
  
  it('shows loading state during authentication', async () => {
    // Mock sign in that doesn't resolve immediately
    mockSignIn.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 100);
    }));
    
    render(<Login />);
    
    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
  
  it('displays authentication errors', async () => {
    // Mock failed sign in
    mockSignIn.mockResolvedValueOnce({ 
      success: false, 
      error: 'Invalid credentials' 
    });
    
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      error: 'Invalid credentials',
      signIn: mockSignIn
    });
    
    render(<Login />);
    
    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check error message
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
```
