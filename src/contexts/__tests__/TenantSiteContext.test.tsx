import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantSiteProvider } from '../TenantSiteContext';
import { useTenantSite } from '../../hooks/useTenantSite';

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
    })
  };
})();

// Mock window.location.reload
const locationMock = {
  reload: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true
});

// Create a test component that uses the context
function TestComponent() {
  const context = useTenantSite();
  return (
    <div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="has-multiple-tenants">{context.hasMultipleTenants.toString()}</div>
      <div data-testid="has-multiple-sites">{context.hasMultipleSites.toString()}</div>
      <div data-testid="current-tenant-id">{context.currentTenantId || 'none'}</div>
      <div data-testid="current-site-id">{context.currentSiteId || 'none'}</div>
      <div data-testid="tenant-count">{context.tenants.length}</div>
      <div data-testid="site-count">{context.sites.length}</div>

      {/* Buttons to change tenant and site */}
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

describe('TenantSiteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    locationMock.reload.mockClear();
  });

  it('should provide tenant and site context to components', async () => {
    // Render with act to handle async updates
    await act(async () => {
      render(
        <TenantSiteProvider>
          <TestComponent />
        </TenantSiteProvider>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Check that context has the expected properties
    expect(screen.getByTestId('has-multiple-tenants')).toBeInTheDocument();
    expect(screen.getByTestId('has-multiple-sites')).toBeInTheDocument();
    expect(screen.getByTestId('current-tenant-id')).toBeInTheDocument();
    expect(screen.getByTestId('current-site-id')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-count')).toBeInTheDocument();
    expect(screen.getByTestId('site-count')).toBeInTheDocument();

    // Check that localStorage was updated for tenant selection
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should refresh the page when tenant is changed', async () => {
    // Render with act to handle async updates
    await act(async () => {
      render(
        <TenantSiteProvider>
          <TestComponent />
        </TenantSiteProvider>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Click the change tenant button
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-tenant-button'));
    });

    // Check that localStorage was updated with the new tenant ID
    expect(localStorageMock.setItem).toHaveBeenCalledWith('currentTenantId', 'tenant-2');

    // Check that page reload was triggered
    expect(locationMock.reload).toHaveBeenCalled();
  });

  it('should refresh the page when site is changed', async () => {
    // Render with act to handle async updates
    await act(async () => {
      render(
        <TenantSiteProvider>
          <TestComponent />
        </TenantSiteProvider>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Set a current tenant ID first (needed for site changes)
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-tenant-button'));
    });

    // Reset mocks for the next test
    locationMock.reload.mockClear();

    // Click the change site button
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-site-button'));
    });

    // Check that localStorage was updated with the new site ID
    expect(localStorageMock.setItem).toHaveBeenCalledWith('tenant-2_currentSiteId', 'site-2');

    // Check that page reload was triggered
    expect(locationMock.reload).toHaveBeenCalled();
  });
});
