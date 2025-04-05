import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantSelector } from '../TenantSelector';
import { TenantSiteProvider } from '../../../../contexts/TenantSiteContext';

// Mock the useTenantSite hook
jest.mock('../../../../contexts/TenantSiteContext', () => ({
  TenantSiteProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTenantSite: jest.fn()
}));

// Import the mocked hook
import { useTenantSite } from '../../../../contexts/TenantSiteContext';

describe('TenantSelector', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when user has access to only one tenant', () => {
    // Mock the hook to return a single tenant
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleTenants: false,
      tenants: [{ id: 'tenant-1', name: 'Tenant 1' }],
      currentTenantId: 'tenant-1',
      setCurrentTenantId: jest.fn(),
      loading: false
    });

    render(<TenantSelector />);

    // The component should not render anything
    expect(screen.queryByTestId('tenant-selector')).not.toBeInTheDocument();
  });

  it('should render a dropdown when user has access to multiple tenants', () => {
    // Mock the hook to return multiple tenants
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleTenants: true,
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' }
      ],
      currentTenantId: 'tenant-1',
      setCurrentTenantId: jest.fn(),
      loading: false
    });

    render(<TenantSelector />);

    // The component should render a dropdown
    expect(screen.getByTestId('tenant-selector')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-selector-current')).toHaveTextContent('Tenant 1');
  });

  it('should not include the public tenant in the dropdown', () => {
    // Mock the hook to return multiple tenants including public
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleTenants: true,
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
        { id: 'public', name: 'Public Tenant' }
      ],
      currentTenantId: 'tenant-1',
      setCurrentTenantId: jest.fn(),
      loading: false
    });

    render(<TenantSelector />);

    // Open the dropdown
    fireEvent.click(screen.getByTestId('tenant-selector-button'));

    // Dropdown should be visible
    expect(screen.getByTestId('tenant-selector-dropdown')).toBeInTheDocument();

    // Public tenant should not be in the dropdown
    expect(screen.queryByTestId('tenant-option-public')).not.toBeInTheDocument();
  });

  it('should call setCurrentTenantId when a tenant is selected', () => {
    // Mock the hook with a mock function for setCurrentTenantId
    const mockSetCurrentTenantId = jest.fn();
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleTenants: true,
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' }
      ],
      currentTenantId: 'tenant-1',
      setCurrentTenantId: mockSetCurrentTenantId,
      loading: false
    });

    render(<TenantSelector />);

    // Open the dropdown
    fireEvent.click(screen.getByTestId('tenant-selector-button'));

    // Select the second tenant
    fireEvent.click(screen.getByTestId('tenant-option-tenant-2'));

    // Check if setCurrentTenantId was called with the correct tenant ID
    expect(mockSetCurrentTenantId).toHaveBeenCalledWith('tenant-2');
  });

  it('should show loading state when tenants are being loaded', () => {
    // Mock the hook to indicate loading
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleTenants: true,
      tenants: [],
      currentTenantId: null,
      setCurrentTenantId: jest.fn(),
      loading: true
    });

    render(<TenantSelector />);

    // Should show loading indicator
    expect(screen.getByTestId('tenant-selector-loading')).toBeInTheDocument();
  });
});
