import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PublicTenantSiteProvider, usePublicTenantSite } from '../PublicTenantSiteContext';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock window.location
const mockLocation = {
  href: '',
  reload: jest.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Create a test component that uses the context
function TestComponent() {
  const context = usePublicTenantSite();
  return (
    <div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="current-tenant-id">{context.currentTenantId || 'none'}</div>
      <div data-testid="current-site-id">{context.currentSiteId || 'none'}</div>
      <div data-testid="tenant-count">{context.tenants.length}</div>
      <div data-testid="site-count">{context.sites.length}</div>
      <button
        data-testid="change-tenant-button"
        onClick={() => context.setCurrentTenantId('tenant-2')}
      >
        Change Tenant
      </button>
      <button
        data-testid="change-site-button"
        onClick={() => context.setCurrentSiteId('site-2')}
      >
        Change Site
      </button>
    </div>
  );
}

describe('PublicTenantSiteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockLocation.href = '';

    // Mock the useAuth hook to return an authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('should load tenant and site context from localStorage', async () => {
    // Mock the useAuth hook to return an authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
    });

    // Set up localStorage with tenant and site selections
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'currentTenantId') return 'tenant-1';
      if (key === 'tenant-1_currentSiteId') return 'site-1';
      return null;
    });

    // Set process.env.NODE_ENV to 'test'
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      // Render the provider with a test component
      await act(async () => {
        render(
          <PublicTenantSiteProvider>
            <TestComponent />
          </PublicTenantSiteProvider>
        );
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Check that the context values are set correctly
      expect(screen.getByTestId('current-tenant-id')).toHaveTextContent('tenant-1');
      expect(screen.getByTestId('current-site-id')).toHaveTextContent('site-1');
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('should redirect to tenant page when changing tenant', async () => {
    // Mock the useAuth hook to return an authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
    });

    // Set process.env.NODE_ENV to 'test'
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      // Render the provider with a test component
      await act(async () => {
        render(
          <PublicTenantSiteProvider>
            <TestComponent />
          </PublicTenantSiteProvider>
        );
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Reset mock calls before the action we want to test
      localStorageMock.setItem.mockClear();

      // Click the change tenant button
      await act(async () => {
        fireEvent.click(screen.getByTestId('change-tenant-button'));
      });

      // Check that localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith('currentTenantId', 'tenant-2');

      // Check that the page was redirected
      expect(mockLocation.href).toBe('/tenant/tenant-2');
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('should redirect to site page when changing site', async () => {
    // Mock the useAuth hook to return an authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
    });

    // Set up localStorage with tenant selection
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'currentTenantId') return 'tenant-1';
      return null;
    });

    // Set process.env.NODE_ENV to 'test'
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      // Render the provider with a test component
      await act(async () => {
        render(
          <PublicTenantSiteProvider>
            <TestComponent />
          </PublicTenantSiteProvider>
        );
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Reset mock calls before the action we want to test
      localStorageMock.setItem.mockClear();

      // Click the change site button
      await act(async () => {
        fireEvent.click(screen.getByTestId('change-site-button'));
      });

      // Check that localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tenant-1_currentSiteId', 'site-2');

      // Check that the page was redirected
      expect(mockLocation.href).toBe('/site/site-2');
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('should not load tenant context for unauthenticated users', async () => {
    // Mock the useAuth hook to return an unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Set process.env.NODE_ENV to 'test'
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      // Render the provider with a test component
      await act(async () => {
        render(
          <PublicTenantSiteProvider>
            <TestComponent />
          </PublicTenantSiteProvider>
        );
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Check that the context values are not set
      expect(screen.getByTestId('current-tenant-id')).toHaveTextContent('none');
      expect(screen.getByTestId('current-site-id')).toHaveTextContent('none');
      expect(screen.getByTestId('tenant-count')).toHaveTextContent('0');
      expect(screen.getByTestId('site-count')).toHaveTextContent('0');
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
