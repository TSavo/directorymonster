import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionManager, useAuth } from '@/components/admin/auth';

// Mock the jsonwebtoken library for decoding tokens
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn().mockImplementation((token) => {
    if (token === 'valid-token') {
      return { 
        username: 'testuser', 
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
    } else if (token === 'expired-token') {
      return { 
        username: 'testuser', 
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
    }
    return null;
  })
}));

// Mock next/router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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
    render(
      <SessionManager>
        <TestAuthConsumer />
      </SessionManager>
    );
    
    // Initially not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // Simulate a token in localStorage
    (window.localStorage.getItem as jest.Mock).mockReturnValue('valid-token');
    
    // Trigger a check
    act(() => {
      // Simulate session check
      window.dispatchEvent(new Event('storage'));
    });
    
    // Wait for authentication to update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // User info should be available
    expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    expect(screen.getByTestId('role')).toHaveTextContent('admin');
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
});
