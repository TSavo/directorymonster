import React from 'react';
import { render } from '@testing-library/react';
import { MainHeaderContainer } from '../MainHeaderContainer';
// Mock the MainHeaderPresentation component
jest.mock('../MainHeaderPresentation', () => ({
  MainHeaderPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

import { MainHeaderPresentation } from '../MainHeaderPresentation';

// Mock the useMainHeader hook
jest.mock('../hooks/useMainHeader', () => ({
  useMainHeader: jest.fn(() => ({
    isAuthenticated: true,
    user: { id: 'user-1', name: 'Test User' },
    isScrolled: false,
    mobileMenuOpen: false,
    tenantMenuOpen: false,
    siteMenuOpen: false,
    tenants: [
      { id: 'tenant-1', name: 'Tenant 1' },
      { id: 'tenant-2', name: 'Tenant 2' }
    ],
    sites: [
      { id: 'site-1', name: 'Site 1' },
      { id: 'site-2', name: 'Site 2' }
    ],
    currentTenantId: 'tenant-1',
    currentSiteId: 'site-1',
    currentTenant: { id: 'tenant-1', name: 'Tenant 1' },
    currentSite: { id: 'site-1', name: 'Site 1' },
    hasMultipleTenants: true,
    hasMultipleSites: true,
    toggleMobileMenu: jest.fn(),
    toggleTenantMenu: jest.fn(),
    toggleSiteMenu: jest.fn(),
    handleSelectTenant: jest.fn(),
    handleSelectSite: jest.fn()
  }))
}));

// Mock the MainHeaderPresentation component
jest.mock('../MainHeaderPresentation', () => ({
  MainHeaderPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('MainHeaderContainer', () => {
  // Default props for testing
  const defaultProps = {
    site: {
      id: 'site-1',
      name: 'Test Site',
      logoUrl: '/logo.png'
    },
    categories: [
      { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
      { id: 'cat-2', name: 'Category 2', slug: 'category-2' }
    ]
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the presentation component with correct props', () => {
    // Render the container
    render(<MainHeaderContainer {...defaultProps} />);

    // Check that the presentation component was rendered with correct props
    expect(MainHeaderPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        site: defaultProps.site,
        categories: defaultProps.categories,
        isAuthenticated: expect.any(Boolean),
        isScrolled: expect.any(Boolean),
        mobileMenuOpen: expect.any(Boolean),
        tenantMenuOpen: expect.any(Boolean),
        siteMenuOpen: expect.any(Boolean),
        tenants: expect.any(Array),
        sites: expect.any(Array),
        currentTenantId: expect.any(String),
        currentSiteId: expect.any(String),
        currentTenant: expect.any(Object),
        currentSite: expect.any(Object),
        hasMultipleTenants: expect.any(Boolean),
        hasMultipleSites: expect.any(Boolean),
        onToggleMobileMenu: expect.any(Function),
        onToggleTenantMenu: expect.any(Function),
        onToggleSiteMenu: expect.any(Function),
        onSelectTenant: expect.any(Function),
        onSelectSite: expect.any(Function)
      }),
      expect.anything()
    );
  });

  it('passes site to the presentation component', () => {
    // Render the container with site
    render(<MainHeaderContainer {...defaultProps} />);

    // Check that the presentation component was rendered with site
    expect(MainHeaderPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        site: defaultProps.site
      }),
      expect.anything()
    );
  });

  it('passes categories to the presentation component', () => {
    // Render the container with categories
    render(<MainHeaderContainer {...defaultProps} />);

    // Check that the presentation component was rendered with categories
    expect(MainHeaderPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: defaultProps.categories
      }),
      expect.anything()
    );
  });

  it('passes empty categories array when categories prop is not provided', () => {
    // Create props without categories
    const propsWithoutCategories = {
      site: defaultProps.site
    };

    // Render the container without categories
    render(<MainHeaderContainer {...propsWithoutCategories} />);

    // Check that the presentation component was rendered with empty categories array
    expect(MainHeaderPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: []
      }),
      expect.anything()
    );
  });

  it('passes initialOptions to the useMainHeader hook', () => {
    // Import the actual hook to access the mock
    const { useMainHeader } = require('../hooks/useMainHeader');

    // Create initialOptions
    const initialOptions = {
      initialMobileMenuOpen: true,
      initialTenantMenuOpen: true,
      initialSiteMenuOpen: true
    };

    // Render the container with initialOptions
    render(<MainHeaderContainer {...defaultProps} initialOptions={initialOptions} />);

    // Check that useMainHeader was called with initialOptions
    expect(useMainHeader).toHaveBeenCalledWith(initialOptions);
  });

  it('uses the provided mainHeaderHook when specified', () => {
    // Create a mock main header hook
    const mockMainHeaderHook = jest.fn(() => ({
      isAuthenticated: false,
      user: null,
      isScrolled: true,
      mobileMenuOpen: true,
      tenantMenuOpen: true,
      siteMenuOpen: true,
      tenants: [],
      sites: [],
      currentTenantId: null,
      currentSiteId: null,
      currentTenant: null,
      currentSite: null,
      hasMultipleTenants: false,
      hasMultipleSites: false,
      toggleMobileMenu: jest.fn(),
      toggleTenantMenu: jest.fn(),
      toggleSiteMenu: jest.fn(),
      handleSelectTenant: jest.fn(),
      handleSelectSite: jest.fn()
    }));

    // Render the container with the custom main header hook
    render(<MainHeaderContainer {...defaultProps} mainHeaderHook={mockMainHeaderHook} />);

    // Check that the custom main header hook was used
    expect(mockMainHeaderHook).toHaveBeenCalled();

    // Check that the presentation component was rendered with the custom hook's values
    expect(MainHeaderPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        isAuthenticated: false,
        isScrolled: true,
        mobileMenuOpen: true,
        tenantMenuOpen: true,
        siteMenuOpen: true,
        hasMultipleTenants: false,
        hasMultipleSites: false
      }),
      expect.anything()
    );
  });
});
