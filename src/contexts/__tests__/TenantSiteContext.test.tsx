import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantSiteProvider, useTenantSite } from '../TenantSiteContext';

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
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
    </div>
  );
}

describe('TenantSiteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
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
});
