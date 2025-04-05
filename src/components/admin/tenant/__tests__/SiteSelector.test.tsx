import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SiteSelector } from '../SiteSelector';
import { TenantSiteProvider } from '../../../../contexts/TenantSiteContext';

// Mock the useTenantSite hook
jest.mock('../../../../contexts/TenantSiteContext', () => ({
  TenantSiteProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTenantSite: jest.fn()
}));

// Import the mocked hook
import { useTenantSite } from '../../../../contexts/TenantSiteContext';

describe('SiteSelector', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when tenant has only one site', () => {
    // Mock the hook to return a single site
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleSites: false,
      sites: [{ id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' }],
      currentSiteId: 'site-1',
      setCurrentSiteId: jest.fn(),
      loading: false
    });

    render(<SiteSelector />);
    
    // The component should not render anything
    expect(screen.queryByTestId('site-selector')).not.toBeInTheDocument();
  });

  it('should render a dropdown when tenant has multiple sites', () => {
    // Mock the hook to return multiple sites
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleSites: true,
      sites: [
        { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
        { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' }
      ],
      currentSiteId: 'site-1',
      setCurrentSiteId: jest.fn(),
      loading: false
    });

    render(<SiteSelector />);
    
    // The component should render a dropdown
    expect(screen.getByTestId('site-selector')).toBeInTheDocument();
    expect(screen.getByTestId('site-selector-current')).toHaveTextContent('Site 1');
  });

  it('should call setCurrentSiteId when a site is selected', () => {
    // Mock the hook with a mock function for setCurrentSiteId
    const mockSetCurrentSiteId = jest.fn();
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleSites: true,
      sites: [
        { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
        { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' }
      ],
      currentSiteId: 'site-1',
      setCurrentSiteId: mockSetCurrentSiteId,
      loading: false
    });

    render(<SiteSelector />);
    
    // Open the dropdown
    fireEvent.click(screen.getByTestId('site-selector-button'));
    
    // Select the second site
    fireEvent.click(screen.getByTestId('site-option-site-2'));
    
    // Check if setCurrentSiteId was called with the correct site ID
    expect(mockSetCurrentSiteId).toHaveBeenCalledWith('site-2');
  });

  it('should show loading state when sites are being loaded', () => {
    // Mock the hook to indicate loading
    (useTenantSite as jest.Mock).mockReturnValue({
      hasMultipleSites: true,
      sites: [],
      currentSiteId: null,
      setCurrentSiteId: jest.fn(),
      loading: true
    });

    render(<SiteSelector />);
    
    // Should show loading indicator
    expect(screen.getByTestId('site-selector-loading')).toBeInTheDocument();
  });
});
