import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantSelector } from '../../../../src/components/admin/tenant/TenantSelector';
import { useTenantSite } from '../../../../src/hooks/useTenantSite';

// Mock the useTenantSite hook
jest.mock('../../../../src/hooks/useTenantSite');

describe('TenantSelector Component', () => {
  // Default mock data
  const mockTenants = [
    { id: 'tenant-1', name: 'Tenant 1' },
    { id: 'tenant-2', name: 'Tenant 2' },
    { id: 'tenant-3', name: 'Tenant 3' }
  ];

  const mockSetCurrentTenantId = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (useTenantSite as jest.Mock).mockReturnValue({
      tenants: mockTenants,
      currentTenantId: 'tenant-1',
      setCurrentTenantId: mockSetCurrentTenantId,
      loading: false,
      hasMultipleTenants: true
    });
  });

  test('renders tenant selector dropdown when user has multiple tenants', () => {
    render(<TenantSelector />);

    // Verify the component renders with the correct label
    expect(screen.getByText(/tenant/i)).toBeInTheDocument();

    // Verify the button is rendered with the current tenant name
    const button = screen.getByTestId('tenant-selector-button');
    expect(button).toBeInTheDocument();

    // Verify the current tenant is displayed
    const currentTenant = screen.getByTestId('tenant-selector-current');
    expect(currentTenant).toHaveTextContent('Tenant 1');
  });

  test('does not render when user has only one tenant', () => {
    // Mock single tenant scenario
    (useTenantSite as jest.Mock).mockReturnValue({
      tenants: [mockTenants[0]],
      currentTenantId: 'tenant-1',
      setCurrentTenantId: mockSetCurrentTenantId,
      loading: false,
      hasMultipleTenants: false
    });

    render(<TenantSelector />);

    // Verify the component doesn't render the dropdown
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  test('shows loading state when tenants are being fetched', () => {
    // Mock loading state
    (useTenantSite as jest.Mock).mockReturnValue({
      tenants: [],
      currentTenantId: null,
      setCurrentTenantId: mockSetCurrentTenantId,
      loading: true,
      hasMultipleTenants: true // Set to true so the component renders
    });

    render(<TenantSelector />);

    // Verify loading indicator is shown
    expect(screen.getByText(/loading tenants/i)).toBeInTheDocument();
  });

  test('calls setCurrentTenantId when tenant selection changes', () => {
    render(<TenantSelector />);

    // Get the button and click it to open the dropdown
    const button = screen.getByTestId('tenant-selector-button');
    fireEvent.click(button);

    // Get the tenant option and click it
    const tenantOption = screen.getByTestId('tenant-option-tenant-2');
    fireEvent.click(tenantOption);

    // Verify setCurrentTenantId was called with the new tenant ID
    expect(mockSetCurrentTenantId).toHaveBeenCalledWith('tenant-2');
  });

  test('displays tenant names in the dropdown', () => {
    render(<TenantSelector />);

    // Get the button and click it to open the dropdown
    const button = screen.getByTestId('tenant-selector-button');
    fireEvent.click(button);

    // Verify all tenant names are displayed
    mockTenants.forEach(tenant => {
      // Skip the public tenant which is filtered out
      if (tenant.id !== 'public') {
        expect(screen.getByText(tenant.name)).toBeInTheDocument();
      }
    });
  });
});
