import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../AuthProvider';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock atob for token decoding
global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString('binary'));

// Create a test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user-name">{user?.name || 'No user'}</div>
      <button data-testid="login-button" onClick={() => login('test.token.123')}>
        Login
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (fetch as jest.Mock).mockClear();
  });

  it('should initialize with loading state and then complete', async () => {
    // Mock fetch to return unauthenticated
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Check that the user is not authenticated
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('should handle login and authentication', async () => {
    // Mock fetch for initial check (no token)
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Initially not authenticated
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');

    // Mock atob for token decoding
    (atob as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
        },
      })
    );

    // Click login button
    await act(async () => {
      screen.getByTestId('login-button').click();
    });

    // Check that localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'test.token.123');

    // Check that the user is authenticated
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
  });

  it('should handle logout', async () => {
    // Start with a component that's already logged in
    // Mock atob for token decoding
    (atob as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
        },
      })
    );

    // Render with initial state
    let testComponent: any;
    await act(async () => {
      testComponent = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Login first
    await act(async () => {
      screen.getByTestId('login-button').click();
    });

    // Check that the user is authenticated after login
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

    // Click logout button
    await act(async () => {
      screen.getByTestId('logout-button').click();
    });

    // Check that localStorage was updated
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');

    // Check that the user is not authenticated
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No user');
  });
});
