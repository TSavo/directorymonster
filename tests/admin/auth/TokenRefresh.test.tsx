import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionManager, useAuth } from '@/components/admin/auth';

// Mock the jsonwebtoken library for decoding tokens
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn()
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
      exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes from now
    });
    
    // Mock localStorage to return the almost expired token
    (window.localStorage.getItem as jest.Mock).mockReturnValue('almost-expired-token');
    
    // Test component that shows when refresh happens
    const RefreshTestComponent = () => {
      const { isRefreshing } = useAuth();
      return <div data-testid="refreshing">{isRefreshing ? 'Refreshing' : 'Not Refreshing'}</div>;
    };
    
    render(
      <SessionManager>
        <RefreshTestComponent />
      </SessionManager>
    );
    
    // Wait for token refresh to occur
    await waitFor(() => {
      // Should call the refresh endpoint
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.any(Object));
      
      // Should update the token in localStorage
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'new-valid-token');
    });
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
      exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes from now
    });
    
    // Mock localStorage to return the almost expired token
    (window.localStorage.getItem as jest.Mock).mockReturnValue('almost-expired-token');
    
    // Mock router for redirect check
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
    }));
    
    render(
      <SessionManager redirectToLogin={true}>
        <div>Test Content</div>
      </SessionManager>
    );
    
    // Wait for token refresh to fail and redirect
    await waitFor(() => {
      // Should remove the token
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });
  
  it('does not attempt refresh for valid tokens', async () => {
    // Mock a token that will expire far in the future
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ 
      username: 'testuser', 
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    });
    
    // Mock localStorage to return the valid token
    (window.localStorage.getItem as jest.Mock).mockReturnValue('valid-token');
    
    render(
      <SessionManager>
        <div>Test Content</div>
      </SessionManager>
    );
    
    // Wait some time for any potential refresh
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // No fetch calls should have been made
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
