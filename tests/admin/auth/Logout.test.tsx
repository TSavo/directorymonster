import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionManager, useAuth } from '@/components/admin/auth';

// Mock the jsonwebtoken library for decoding tokens
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn().mockReturnValue({ 
    username: 'testuser', 
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  })
}));

// Mock next/router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Create a test component that uses the logout function
const LogoutTestComponent = () => {
  const { logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <p data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('Logout Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue('valid-token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });
  
  it('correctly handles logout action', async () => {
    render(
      <SessionManager>
        <LogoutTestComponent />
      </SessionManager>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);
    
    // Token should be removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken');
    
    // Should redirect to login page
    expect(mockPush).toHaveBeenCalledWith('/login');
    
    // Should update context to not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
  });
  
  it('automatically redirects to login when token is missing', async () => {
    // Mock no token in localStorage
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    render(
      <SessionManager redirectToLogin={true}>
        <LogoutTestComponent />
      </SessionManager>
    );
    
    // Should redirect to login page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
