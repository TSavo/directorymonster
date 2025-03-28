import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionManager, useAuth } from '@/components/admin/auth';
import * as jwt from 'jsonwebtoken';

// Mock the jsonwebtoken library for decoding tokens
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn().mockImplementation((token) => {
    if (token === 'valid-token') {
      return { 
        username: 'testuser', 
        role: 'admin',
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
    } else if (token === 'expired-token') {
      return { 
        username: 'testuser', 
        role: 'admin',
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
    }
    return null;
  })
}));

// Mock fetch for token refresh
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ token: 'new-valid-token' })
  })
) as jest.Mock;

// Create a more complete mock for Next.js router
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

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Create a test component that uses the useAuth hook
const TestAuthConsumer = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <div>
      <p data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
      {user && (
        <div>
          <p data-testid="username">{user.username}</p>
          <p data-testid="role">{user.role}</p>
        </div>
      )}
    </div>
  );
};

describe('SessionManager Component', () => {
  // Before each test, clear mocks and local storage
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });
  
  it('provides authentication context to children', async () => {
    // Set up localStorage to return a valid token immediately
    (window.localStorage.getItem as jest.Mock).mockReturnValue('valid-token');
    
    render(
      <SessionManager>
        <TestAuthConsumer />
      </SessionManager>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    }, { timeout: 2000 });
    
    // User info should be available
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
      expect(screen.getByTestId('role')).toHaveTextContent('admin');
    });
  });
  
  it('handles token expiration correctly', async () => {
    // Mock localStorage to return an expired token
    (window.localStorage.getItem as jest.Mock).mockReturnValue('expired-token');
    
    render(
      <SessionManager>
        <TestAuthConsumer />
      </SessionManager>
    );
    
    // Wait for the component to check the token
    await waitFor(() => {
      // Should not be authenticated with an expired token
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // localStorage.removeItem should be called to remove the expired token
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken');
  });
  
  it('redirects to login page when configured', async () => {
    // Mock localStorage to return null (no token)
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    render(
      <SessionManager redirectToLogin={true} loginPath="/login">
        <TestAuthConsumer />
      </SessionManager>
    );
    
    // Wait for component to render and check auth
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
  
  it('refreshes token when it is about to expire', async () => {
    // Create a token that will expire soon (less than 10 minutes from now)
    const soonToExpireToken = 'soon-to-expire-token';
    (jwt.decode as jest.Mock).mockImplementationOnce(() => ({
      username: 'testuser',
      role: 'admin',
      userId: 'user123',
      exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes from now
    }));
    
    (window.localStorage.getItem as jest.Mock).mockReturnValue(soonToExpireToken);
    
    render(
      <SessionManager>
        <TestAuthConsumer />
      </SessionManager>
    );
    
    // Wait for refresh logic to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.any(Object));
    });
    
    // Should have stored the new token
    expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'new-valid-token');
  });
});
