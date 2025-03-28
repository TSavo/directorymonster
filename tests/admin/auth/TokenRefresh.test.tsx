import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionManager, useAuth } from '@/components/admin/auth';

// Mock the jsonwebtoken library for decoding tokens
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn()
}));

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

describe('Token Refresh Functionality', () => {
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
    
    // Mock fetch
    global.fetch = jest.fn();
  });
  
  it('handles token refresh for soon-to-expire tokens', async () => {
    // Mock fetch for token refresh
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'new-valid-token' }),
      })
    );
    
    // Mock a token that will expire soon (in 5 minutes)
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ 
      username: 'testuser', 
      role: 'admin',
      userId: 'user123',
      exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes from now
    });
    
    // Mock localStorage to return the almost expired token
    (window.localStorage.getItem as jest.Mock).mockReturnValue('almost-expired-token');
    
    // Test component that shows when refresh happens
    const RefreshTestComponent = () => {
      const { isRefreshing, isAuthenticated } = useAuth();
      return (
        <div>
          <div data-testid="refreshing">{isRefreshing ? 'Refreshing' : 'Not Refreshing'}</div>
          <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        </div>
      );
    };
    
    render(
      <SessionManager>
        <RefreshTestComponent />
      </SessionManager>
    );
    
    // Wait for token refresh to occur
    await waitFor(() => {
      // Should call the refresh endpoint
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer almost-expired-token'
        })
      }));
    });
    
    // Should update the token in localStorage
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'new-valid-token');
    });
    
    // Should be authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
  });
  
  it('handles failed token refresh', async () => {
    // Mock fetch for token refresh to fail
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid refresh token' }),
      })
    );
    
    // Mock a token that will expire soon
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ 
      username: 'testuser', 
      role: 'admin',
      userId: 'user123',
      exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes from now
    });
    
    // Mock localStorage to return the almost expired token
    (window.localStorage.getItem as jest.Mock).mockReturnValue('almost-expired-token');
    
    const AuthStatusComponent = () => {
      const { isAuthenticated } = useAuth();
      return <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>;
    };
    
    render(
      <SessionManager redirectToLogin={true}>
        <AuthStatusComponent />
      </SessionManager>
    );
    
    // Wait for token refresh to fail and redirect
    await waitFor(() => {
      // Should remove the token
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
    
    // Should redirect to login
    expect(mockPush).toHaveBeenCalledWith('/login');
    
    // Should show as not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });
  
  it('does not attempt refresh for valid tokens', async () => {
    // Mock a token that will expire far in the future
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ 
      username: 'testuser', 
      role: 'admin',
      userId: 'user123',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    });
    
    // Mock localStorage to return the valid token
    (window.localStorage.getItem as jest.Mock).mockReturnValue('valid-token');
    
    const AuthStatusComponent = () => {
      const { isAuthenticated } = useAuth();
      return <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>;
    };
    
    render(
      <SessionManager>
        <AuthStatusComponent />
      </SessionManager>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // No fetch calls should have been made
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
