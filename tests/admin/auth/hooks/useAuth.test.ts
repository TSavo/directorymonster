import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import { hasPermission } from '@/components/admin/auth/utils/accessControl';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/admin',
  })),
  usePathname: jest.fn(() => '/admin'),
}));

// Mock the fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.hasPermission).toBe('function');
  });

  it('checks authentication status on mount', async () => {
    const mockUser = {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      acl: {
        userId: 'user1',
        entries: [
          {
            resource: { type: 'site', id: 'site1' },
            permission: 'read'
          }
        ]
      },
      siteIds: ['site1'],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          authenticated: true,
          user: mockUser
        }),
      })
    );

    const { result } = renderHook(() => useAuth());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be authenticated with user data
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/session');
  });

  it('handles authentication failure', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to fetch authentication status' }),
      })
    );

    const { result } = renderHook(() => useAuth());

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not be authenticated and have an error
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Failed to fetch authentication status');
  });

  it('handles login success', async () => {
    const mockUser = {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      acl: {
        userId: 'user1',
        entries: []
      },
      siteIds: ['site1'],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    // First fetch for initial auth check
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })
    );

    // Second fetch for login
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          user: mockUser
        }),
      })
    );

    const { result } = renderHook(() => useAuth());

    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Perform login
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password');
    });

    // Should be authenticated with user data
    expect(loginResult).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });
  });

  it('handles login failure', async () => {
    // First fetch for initial auth check
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })
    );

    // Second fetch for login
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      })
    );

    const { result } = renderHook(() => useAuth());

    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Perform login
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'wrong-password');
    });

    // Should not be authenticated and have an error
    expect(loginResult).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('handles logout success', async () => {
    const mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // First fetch for initial auth check (authenticated)
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          authenticated: true,
          user: {
            id: 'user1',
            acl: { userId: 'user1', entries: [] }
          } 
        }),
      })
    );

    // Second fetch for logout
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    const { result } = renderHook(() => useAuth());

    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Perform logout
    let logoutResult;
    await act(async () => {
      logoutResult = await result.current.logout();
    });

    // Should no longer be authenticated
    expect(logoutResult).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    });

    // Should redirect to login page
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('handles logout failure', async () => {
    // First fetch for initial auth check (authenticated)
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          authenticated: true,
          user: {
            id: 'user1',
            acl: { userId: 'user1', entries: [] }
          } 
        }),
      })
    );

    // Second fetch for logout (fails)
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Logout failed' }),
      })
    );

    const { result } = renderHook(() => useAuth());

    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Perform logout
    let logoutResult;
    await act(async () => {
      logoutResult = await result.current.logout();
    });

    // Should still show error but not redirect
    expect(logoutResult).toBe(false);
    expect(result.current.error).toBe('Logout failed');
  });

  it('checks permission correctly', async () => {
    const mockUser = {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      acl: {
        userId: 'user1',
        entries: [
          {
            resource: { type: 'site', id: 'site1' },
            permission: 'read'
          }
        ]
      },
      siteIds: ['site1'],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          authenticated: true,
          user: mockUser
        }),
      })
    );

    const { result } = renderHook(() => useAuth());

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have permission for site1
    expect(result.current.hasPermission('site', 'read', 'site1')).toBe(true);
    
    // Should not have permission for other resources
    expect(result.current.hasPermission('site', 'update', 'site1')).toBe(false);
    expect(result.current.hasPermission('site', 'read', 'site2')).toBe(false);
    expect(result.current.hasPermission('category', 'read')).toBe(false);
  });

  it('returns false for permission check when not authenticated', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })
    );

    const { result } = renderHook(() => useAuth());

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not have any permission when not authenticated
    expect(result.current.hasPermission('site', 'read', 'site1')).toBe(false);
  });
});
