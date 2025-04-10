import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';
import * as tokenUtils from '@/utils/token-utils';

// Mock the token-utils module
jest.mock('@/utils/token-utils');

// Mock the fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  })
}));

// Test component that consumes the auth context
const TestAuthConsumer = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading-status">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-info">{user ? JSON.stringify(user) : 'No User'}</div>
      <button data-testid="login-button" onClick={() => login('test-token')}>Login</button>
      <button data-testid="logout-button" onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthProvider with token-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should use decodeToken utility when checking authentication', async () => {
    // Mock localStorage to return a token
    (localStorageMock.getItem as jest.Mock).mockReturnValue('test-token');
    
    // Mock fetch to return a successful response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: '123', name: 'Test User', email: 'test@example.com', role: 'admin' } })
    });
    
    // Mock decodeToken to return a user payload
    (tokenUtils.decodeToken as jest.Mock).mockReturnValue({
      user: { id: '456', name: 'Decoded User', email: 'decoded@example.com', role: 'user' }
    });
    
    // Render the component
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Verify decodeToken was called with the token
    expect(tokenUtils.decodeToken).toHaveBeenCalledWith('test-token');
    
    // Verify the user from the API response is used (not the decoded token)
    expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
  });
  
  it('should use decodeToken utility when API response has no user', async () => {
    // Mock localStorage to return a token
    (localStorageMock.getItem as jest.Mock).mockReturnValue('test-token');
    
    // Mock fetch to return a successful response but without user data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    
    // Mock decodeToken to return a user payload
    (tokenUtils.decodeToken as jest.Mock).mockReturnValue({
      user: { id: '456', name: 'Decoded User', email: 'decoded@example.com', role: 'user' }
    });
    
    // Render the component
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Verify decodeToken was called with the token
    expect(tokenUtils.decodeToken).toHaveBeenCalledWith('test-token');
    
    // Verify the user from the decoded token is used when API response has no user
    expect(screen.getByTestId('user-info')).toHaveTextContent('Decoded User');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
  });
  
  it('should use decodeToken utility when logging in', async () => {
    // Mock decodeToken to return a user payload
    (tokenUtils.decodeToken as jest.Mock).mockReturnValue({
      user: { id: '789', name: 'Login User', email: 'login@example.com', role: 'editor' }
    });
    
    // Render the component
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Click the login button
    screen.getByTestId('login-button').click();
    
    // Verify decodeToken was called with the token
    expect(tokenUtils.decodeToken).toHaveBeenCalledWith('test-token');
    
    // Verify localStorage.setItem was called with the token
    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'test-token');
    
    // Verify the user from the decoded token is used
    expect(screen.getByTestId('user-info')).toHaveTextContent('Login User');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
  });
  
  it('should handle decodeToken returning null', async () => {
    // Mock localStorage to return a token
    (localStorageMock.getItem as jest.Mock).mockReturnValue('invalid-token');
    
    // Mock fetch to return a successful response but without user data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    
    // Mock decodeToken to return null (invalid token)
    (tokenUtils.decodeToken as jest.Mock).mockReturnValue(null);
    
    // Render the component
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
    });
    
    // Verify decodeToken was called with the token
    expect(tokenUtils.decodeToken).toHaveBeenCalledWith('invalid-token');
    
    // Verify the user is not authenticated when decodeToken returns null
    expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });
});
