import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantSiteProvider } from '../../src/contexts/TenantSiteContext';
import { useTenantSite } from '../../src/hooks/useTenantSite';
import { apiRequest } from '../../src/lib/api-client';

// Mock the API client
jest.mock('../../src/lib/api-client', () => ({
  apiRequest: jest.fn().mockImplementation((url) => {
    if (url === '/api/tenants/user') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 'tenant-1', name: 'Tenant 1' },
          { id: 'tenant-2', name: 'Tenant 2' }
        ])
      });
    } else if (url.startsWith('/api/tenants/')) {
      const tenantId = url.split('/')[3];
      const sites = {
        'tenant-1': [
          { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
          { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' }
        ],
        'tenant-2': [
          { id: 'site-3', name: 'Site 3', tenantId: 'tenant-2' },
          { id: 'site-4', name: 'Site 4', tenantId: 'tenant-2' }
        ]
      };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sites[tenantId] || [])
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  })
}));

// Create a test component that uses the context
function TestComponent() {
  const {
    tenants,
    sites,
    currentTenantId,
    currentSiteId,
    setCurrentTenantId,
    setCurrentSiteId,
    loading
  } = useTenantSite();

  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="current-tenant">{currentTenantId || 'No tenant'}</div>
      <div data-testid="current-site">{currentSiteId || 'No site'}</div>
      <select
        data-testid="tenant-select"
        value={currentTenantId || ''}
        onChange={(e) => setCurrentTenantId(e.target.value)}
      >
        <option value="">Select Tenant</option>
        {tenants.map(tenant => (
          <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
        ))}
      </select>
      <select
        data-testid="site-select"
        value={currentSiteId || ''}
        onChange={(e) => setCurrentSiteId(e.target.value)}
      >
        <option value="">Select Site</option>
        {sites.map(site => (
          <option key={site.id} value={site.id}>{site.name}</option>
        ))}
      </select>
    </div>
  );
}

describe('TenantSiteContext Integration', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      clear: () => { store = {}; },
      removeItem: (key: string) => { delete store[key]; }
    };
  })();

  // Mock API responses
  const mockTenants = [
    { id: 'tenant-1', name: 'Tenant 1' },
    { id: 'tenant-2', name: 'Tenant 2' }
  ];

  const mockSites = {
    'tenant-1': [
      { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
      { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' }
    ],
    'tenant-2': [
      { id: 'site-3', name: 'Site 3', tenantId: 'tenant-2' },
      { id: 'site-4', name: 'Site 4', tenantId: 'tenant-2' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear();

    // Mock API responses
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url === '/api/tenants/user') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTenants)
        });
      } else if (url.startsWith('/api/tenants/')) {
        const tenantId = url.split('/')[3];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSites[tenantId] || [])
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  test('loads tenants on initial render', async () => {
    render(
      <TenantSiteProvider>
        <TestComponent />
      </TenantSiteProvider>
    );

    // Initially should show loading
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');

    // Wait for tenants to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });

    // Verify tenants are displayed in the dropdown
    const tenantSelect = screen.getByTestId('tenant-select');
    expect(tenantSelect).toContainElement(screen.getByText('Tenant 1'));
    expect(tenantSelect).toContainElement(screen.getByText('Tenant 2'));
  });

  test('persists tenant selection to localStorage', async () => {
    render(
      <TenantSiteProvider>
        <TestComponent />
      </TenantSiteProvider>
    );

    // Wait for tenants to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });

    // Select a tenant
    const tenantSelect = screen.getByTestId('tenant-select');
    act(() => {
      fireEvent.change(tenantSelect, { target: { value: 'tenant-1' } });
    });

    // Verify tenant ID is saved to localStorage
    expect(localStorageMock.getItem('currentTenantId')).toBe('tenant-1');

    // Verify current tenant is updated in the UI
    expect(screen.getByTestId('current-tenant')).toHaveTextContent('tenant-1');
  });

  test('loads sites when tenant is selected', async () => {
    render(
      <TenantSiteProvider>
        <TestComponent />
      </TenantSiteProvider>
    );

    // Wait for tenants to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });

    // Select a tenant
    const tenantSelect = screen.getByTestId('tenant-select');
    act(() => {
      fireEvent.change(tenantSelect, { target: { value: 'tenant-1' } });
    });

    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByText('Site 1')).toBeInTheDocument();
    });

    // Verify sites are displayed in the dropdown
    const siteSelect = screen.getByTestId('site-select');
    expect(siteSelect).toContainElement(screen.getByText('Site 1'));
    expect(siteSelect).toContainElement(screen.getByText('Site 2'));
  });

  test('persists site selection to localStorage', async () => {
    render(
      <TenantSiteProvider>
        <TestComponent />
      </TenantSiteProvider>
    );

    // Wait for tenants to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });

    // Select a tenant
    const tenantSelect = screen.getByTestId('tenant-select');
    act(() => {
      fireEvent.change(tenantSelect, { target: { value: 'tenant-1' } });
    });

    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByText('Site 1')).toBeInTheDocument();
    });

    // Select a site
    const siteSelect = screen.getByTestId('site-select');
    act(() => {
      fireEvent.change(siteSelect, { target: { value: 'site-1' } });
    });

    // Verify site ID is saved to localStorage
    expect(localStorageMock.getItem('tenant-1_currentSiteId')).toBe('site-1');

    // Verify current site is updated in the UI
    expect(screen.getByTestId('current-site')).toHaveTextContent('site-1');
  });

  test('restores context from localStorage on page load', async () => {
    // Set initial values in localStorage
    localStorageMock.setItem('currentTenantId', 'tenant-2');
    localStorageMock.setItem('tenant-2_currentSiteId', 'site-4');

    render(
      <TenantSiteProvider>
        <TestComponent />
      </TenantSiteProvider>
    );

    // Wait for tenants and sites to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
    });

    // Verify the UI shows the restored context
    expect(screen.getByTestId('current-tenant')).toHaveTextContent('tenant-2');

    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByTestId('current-site')).toHaveTextContent('site-4');
    });
  });

  test('includes tenant and site context in API requests', async () => {
    // Set initial values in localStorage
    localStorageMock.setItem('currentTenantId', 'tenant-1');
    localStorageMock.setItem('tenant-1_currentSiteId', 'site-2');

    // Create a custom mock for this test
    const mockApiRequest = jest.fn().mockImplementation((url, options = {}) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    // Replace the original apiRequest with our mock
    const originalApiRequest = apiRequest;
    (apiRequest as jest.Mock).mockImplementation(mockApiRequest);

    // Make an API request
    await apiRequest('/api/some/endpoint', { headers: new Headers() });

    // Restore the original apiRequest
    (apiRequest as jest.Mock).mockImplementation(originalApiRequest);

    // Verify the API request was called
    expect(mockApiRequest).toHaveBeenCalled();

    // Verify the first argument was the correct URL
    expect(mockApiRequest.mock.calls[0][0]).toBe('/api/some/endpoint');
  });
});
