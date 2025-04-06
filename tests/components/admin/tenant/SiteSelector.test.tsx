import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SiteSelector } from '../../../../src/components/admin/tenant/SiteSelector';
import { useTenantSite } from '../../../../src/hooks/useTenantSite';

// Mock the useTenantSite hook
jest.mock('../../../../src/hooks/useTenantSite');

describe('SiteSelector Component', () => {
  // Default mock data
  const mockSites = [
    { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
    { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' },
    { id: 'site-3', name: 'Site 3', tenantId: 'tenant-1' }
  ];

  const mockSetCurrentSiteId = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (useTenantSite as jest.Mock).mockReturnValue({
      sites: mockSites,
      currentSiteId: 'site-1',
      setCurrentSiteId: mockSetCurrentSiteId,
      loading: false,
      hasMultipleSites: true,
      currentTenantId: 'tenant-1'
    });
  });

  test('renders site selector dropdown when user has multiple sites', () => {
    render(<SiteSelector />);

    // Verify the component renders
    const siteSelector = screen.getByTestId('site-selector');
    expect(siteSelector).toBeInTheDocument();

    // Verify the button is rendered with the current site name
    const button = screen.getByTestId('site-selector-button');
    expect(button).toBeInTheDocument();

    // Verify the current site is displayed
    const currentSite = screen.getByTestId('site-selector-current');
    expect(currentSite).toHaveTextContent('Site 1');
  });

  test('does not render when user has only one site', () => {
    // Mock single site scenario
    (useTenantSite as jest.Mock).mockReturnValue({
      sites: [mockSites[0]],
      currentSiteId: 'site-1',
      setCurrentSiteId: mockSetCurrentSiteId,
      loading: false,
      hasMultipleSites: false,
      currentTenantId: 'tenant-1'
    });

    render(<SiteSelector />);

    // Verify the component doesn't render the dropdown
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  test('does not render when no tenant is selected', () => {
    // Mock no tenant selected scenario
    (useTenantSite as jest.Mock).mockReturnValue({
      sites: [],
      currentSiteId: null,
      setCurrentSiteId: mockSetCurrentSiteId,
      loading: false,
      hasMultipleSites: false,
      currentTenantId: null
    });

    render(<SiteSelector />);

    // Verify the component doesn't render the dropdown
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  test('shows loading state when sites are being fetched', () => {
    // Mock loading state
    (useTenantSite as jest.Mock).mockReturnValue({
      sites: [],
      currentSiteId: null,
      setCurrentSiteId: mockSetCurrentSiteId,
      loading: true,
      hasMultipleSites: true, // Set to true so the component renders
      currentTenantId: 'tenant-1'
    });

    render(<SiteSelector />);

    // Verify loading indicator is shown
    expect(screen.getByText(/loading sites/i)).toBeInTheDocument();
  });

  test('calls setCurrentSiteId when site selection changes', () => {
    render(<SiteSelector />);

    // Get the button and click it to open the dropdown
    const button = screen.getByTestId('site-selector-button');
    fireEvent.click(button);

    // Get the site option and click it
    const siteOption = screen.getByTestId('site-option-site-2');
    fireEvent.click(siteOption);

    // Verify setCurrentSiteId was called with the new site ID
    expect(mockSetCurrentSiteId).toHaveBeenCalledWith('site-2');
  });

  test('displays site names in the dropdown', () => {
    render(<SiteSelector />);

    // Get the button and click it to open the dropdown
    const button = screen.getByTestId('site-selector-button');
    fireEvent.click(button);

    // Verify all site names are displayed in the dropdown options
    mockSites.forEach(site => {
      expect(screen.getByTestId(`site-option-${site.id}`)).toHaveTextContent(site.name);
    });
  });
});
