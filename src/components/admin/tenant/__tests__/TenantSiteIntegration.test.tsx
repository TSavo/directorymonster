import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantSelector } from '../TenantSelector';
import { SiteSelector } from '../SiteSelector';
import { TenantSiteProvider } from '../../../../contexts/TenantSiteContext';

// Mock the fetch functions
jest.mock('../../../../contexts/TenantSiteContext', () => {
  const originalModule = jest.requireActual('../../../../contexts/TenantSiteContext');

  // Mock implementation of fetchUserTenants
  const fetchUserTenants = async () => [
    { id: 'tenant-1', name: 'Tenant 1' },
    { id: 'tenant-2', name: 'Tenant 2' },
    { id: 'public', name: 'Public Tenant' }
  ];

  // Mock implementation of fetchTenantSites
  const fetchTenantSites = async (tenantId: string) => {
    if (tenantId === 'tenant-1') {
      return [
        { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
        { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' }
      ];
    } else if (tenantId === 'tenant-2') {
      return [
        { id: 'site-3', name: 'Site 3', tenantId: 'tenant-2' },
        { id: 'site-4', name: 'Site 4', tenantId: 'tenant-2' }
      ];
    }
    return [];
  };

  return {
    ...originalModule,
    fetchUserTenants,
    fetchTenantSites
  };
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
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Tenant and Site Selector Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('should render both selectors and allow switching between tenants and sites', async () => {
    await act(async () => {
      render(
        <TenantSiteProvider>
          <div>
            <TenantSelector />
            <SiteSelector />
          </div>
        </TenantSiteProvider>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('tenant-selector-loading')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.queryByTestId('site-selector-loading')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Both selectors should be visible
    expect(screen.getByTestId('tenant-selector')).toBeInTheDocument();
    expect(screen.getByTestId('site-selector')).toBeInTheDocument();

    // Tenant selector should show Tenant 1
    expect(screen.getByTestId('tenant-selector-current')).toHaveTextContent('Tenant 1');

    // Site selector should show Site 1
    expect(screen.getByTestId('site-selector-current')).toHaveTextContent('Site 1');

    // Open tenant dropdown
    await act(async () => {
      fireEvent.click(screen.getByTestId('tenant-selector-button'));
    });

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByTestId('tenant-selector-dropdown')).toBeInTheDocument();
    });

    // Select Tenant 2
    await act(async () => {
      fireEvent.click(screen.getByTestId('tenant-option-tenant-2'));
    });

    // Wait for site data to load for the new tenant
    await waitFor(() => {
      expect(screen.queryByTestId('site-selector-loading')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Tenant selector should now show Tenant 2
    await waitFor(() => {
      expect(screen.getByTestId('tenant-selector-current')).toHaveTextContent('Tenant 2');
    });

    // Site selector should now show Site 3 (first site of Tenant 2)
    await waitFor(() => {
      expect(screen.getByTestId('site-selector-current')).toHaveTextContent('Site 3');
    });

    // Open site dropdown
    await act(async () => {
      fireEvent.click(screen.getByTestId('site-selector-button'));
    });

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByTestId('site-selector-dropdown')).toBeInTheDocument();
    });

    // Select Site 4
    await act(async () => {
      fireEvent.click(screen.getByTestId('site-option-site-4'));
    });

    // Site selector should now show Site 4
    await waitFor(() => {
      expect(screen.getByTestId('site-selector-current')).toHaveTextContent('Site 4');
    });

    // Check that localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('currentTenantId', 'tenant-2');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('tenant-2_currentSiteId', 'site-4');
  });
});
