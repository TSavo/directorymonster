import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainHeaderPresentation } from '../MainHeaderPresentation';

// Mock the KeyboardShortcut component
jest.mock('@/components/ui/keyboard-shortcut', () => ({
  KeyboardShortcut: jest.fn(() => null)
}));

// Mock the UnifiedAuthComponent
jest.mock('@/components/auth', () => ({
  UnifiedAuthComponent: jest.fn(() => <div data-testid="mock-auth-component" />)
}));

// Mock the SearchBar component
jest.mock('../SearchBar', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-search-bar" />)
}));

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: jest.fn(({ src, alt, fill, className, 'data-testid': dataTestId }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid={dataTestId}
      style={fill ? { objectFit: 'cover' } : {}}
    />
  ))
}));

describe('MainHeaderPresentation', () => {
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
    ],
    isAuthenticated: true,
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
    onToggleMobileMenu: jest.fn(),
    onToggleTenantMenu: jest.fn(),
    onToggleSiteMenu: jest.fn(),
    onSelectTenant: jest.fn(),
    onSelectSite: jest.fn()
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with default props', () => {
    // Render the component
    render(<MainHeaderPresentation {...defaultProps} />);

    // Check that the component is rendered
    expect(screen.getByTestId('main-header')).toBeInTheDocument();
    expect(screen.getByTestId('site-logo')).toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-selector-container')).toBeInTheDocument();
    expect(screen.getByTestId('site-selector-container')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument();
  });

  it('applies the correct class when isScrolled is true', () => {
    // Render the component with isScrolled=true
    render(<MainHeaderPresentation {...defaultProps} isScrolled={true} />);

    // Check that the header has the scrolled class
    expect(screen.getByTestId('main-header')).toHaveClass('bg-white/95');
    expect(screen.getByTestId('main-header')).toHaveClass('backdrop-blur-md');
    expect(screen.getByTestId('main-header')).toHaveClass('shadow-md');
  });

  it('renders the mobile menu when mobileMenuOpen is true', () => {
    // Render the component with mobileMenuOpen=true
    render(<MainHeaderPresentation {...defaultProps} mobileMenuOpen={true} />);

    // Check that the mobile menu is visible
    const mobileNav = screen.getByTestId('mobile-navigation');
    expect(mobileNav).toHaveClass('max-h-96');
    expect(mobileNav).toHaveClass('opacity-100');
    expect(mobileNav).not.toHaveClass('max-h-0');
    expect(mobileNav).not.toHaveClass('opacity-0');
  });

  it('renders the tenant dropdown when tenantMenuOpen is true', () => {
    // Render the component with tenantMenuOpen=true
    render(<MainHeaderPresentation {...defaultProps} tenantMenuOpen={true} />);

    // Check that the tenant dropdown is rendered
    expect(screen.getByTestId('tenant-selector-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-option-tenant-1')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-option-tenant-2')).toBeInTheDocument();
  });

  it('renders the site dropdown when siteMenuOpen is true', () => {
    // Render the component with siteMenuOpen=true
    render(<MainHeaderPresentation {...defaultProps} siteMenuOpen={true} />);

    // Check that the site dropdown is rendered
    expect(screen.getByTestId('site-selector-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('site-option-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('site-option-site-2')).toBeInTheDocument();
  });

  it('does not render tenant selector when hasMultipleTenants is false', () => {
    // Render the component with hasMultipleTenants=false
    render(<MainHeaderPresentation {...defaultProps} hasMultipleTenants={false} />);

    // Check that the tenant selector is not rendered
    expect(screen.queryByTestId('tenant-selector-container')).not.toBeInTheDocument();
  });

  it('does not render site selector when hasMultipleSites is false', () => {
    // Render the component with hasMultipleSites=false
    render(<MainHeaderPresentation {...defaultProps} hasMultipleSites={false} />);

    // Check that the site selector is not rendered
    expect(screen.queryByTestId('site-selector-container')).not.toBeInTheDocument();
  });

  it('does not render tenant and site selectors when isAuthenticated is false', () => {
    // Render the component with isAuthenticated=false
    render(<MainHeaderPresentation {...defaultProps} isAuthenticated={false} />);

    // Check that the tenant and site selectors are not rendered
    expect(screen.queryByTestId('tenant-selector-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('site-selector-container')).not.toBeInTheDocument();
  });

  it('calls onToggleMobileMenu when mobile menu button is clicked', async () => {
    // Render the component
    const onToggleMobileMenu = jest.fn();
    const user = userEvent.setup();
    render(
      <MainHeaderPresentation {...defaultProps} onToggleMobileMenu={onToggleMobileMenu} />
    );

    // Click the mobile menu button
    await user.click(screen.getByTestId('mobile-menu-button'));

    // Check that onToggleMobileMenu was called
    expect(onToggleMobileMenu).toHaveBeenCalled();
  });

  it('calls onToggleTenantMenu when tenant selector button is clicked', async () => {
    // Render the component
    const onToggleTenantMenu = jest.fn();
    const user = userEvent.setup();
    render(
      <MainHeaderPresentation {...defaultProps} onToggleTenantMenu={onToggleTenantMenu} />
    );

    // Click the tenant selector button
    await user.click(screen.getByTestId('tenant-selector-button'));

    // Check that onToggleTenantMenu was called
    expect(onToggleTenantMenu).toHaveBeenCalled();
  });

  it('calls onToggleSiteMenu when site selector button is clicked', async () => {
    // Render the component
    const onToggleSiteMenu = jest.fn();
    const user = userEvent.setup();
    render(
      <MainHeaderPresentation {...defaultProps} onToggleSiteMenu={onToggleSiteMenu} />
    );

    // Click the site selector button
    await user.click(screen.getByTestId('site-selector-button'));

    // Check that onToggleSiteMenu was called
    expect(onToggleSiteMenu).toHaveBeenCalled();
  });

  it('calls onSelectTenant when a tenant option is clicked', async () => {
    // Render the component with tenantMenuOpen=true
    const onSelectTenant = jest.fn();
    const user = userEvent.setup();
    render(
      <MainHeaderPresentation
        {...defaultProps}
        tenantMenuOpen={true}
        onSelectTenant={onSelectTenant}
      />
    );

    // Click a tenant option
    await user.click(screen.getByTestId('tenant-option-tenant-2'));

    // Check that onSelectTenant was called with the correct tenant ID
    expect(onSelectTenant).toHaveBeenCalledWith('tenant-2');
  });

  it('calls onSelectSite when a site option is clicked', async () => {
    // Render the component with siteMenuOpen=true
    const onSelectSite = jest.fn();
    const user = userEvent.setup();
    render(
      <MainHeaderPresentation
        {...defaultProps}
        siteMenuOpen={true}
        onSelectSite={onSelectSite}
      />
    );

    // Click a site option
    await user.click(screen.getByTestId('site-option-site-2'));

    // Check that onSelectSite was called with the correct site ID
    expect(onSelectSite).toHaveBeenCalledWith('site-2');
  });

  it('renders the correct number of category links', () => {
    // Render the component
    render(<MainHeaderPresentation {...defaultProps} />);

    // Check that the correct number of category links are rendered
    const categoryLinks = screen.getAllByText(/Category \d/);
    expect(categoryLinks.length).toBe(4); // 2 in desktop nav, 2 in mobile nav

    // Check that both categories are present
    expect(screen.getAllByText('Category 1').length).toBe(2); // Desktop and mobile
    expect(screen.getAllByText('Category 2').length).toBe(2); // Desktop and mobile
  });

  it('renders the site logo when logoUrl is provided', () => {
    // Render the component
    render(<MainHeaderPresentation {...defaultProps} />);

    // Check that the site logo is rendered
    const logo = screen.getByTestId('site-logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/logo.png');
    expect(logo).toHaveAttribute('alt', 'Test Site');
  });

  it('does not render the site logo when logoUrl is not provided', () => {
    // Create a site without a logo
    const siteWithoutLogo = {
      ...defaultProps.site,
      logoUrl: undefined
    };

    // Render the component
    render(<MainHeaderPresentation {...defaultProps} site={siteWithoutLogo} />);

    // Check that the site logo is not rendered
    expect(screen.queryByTestId('site-logo')).not.toBeInTheDocument();
  });

  it('renders the UnifiedAuthComponent', () => {
    // Render the component
    render(<MainHeaderPresentation {...defaultProps} />);

    // Check that the UnifiedAuthComponent is rendered
    expect(screen.getAllByTestId('mock-auth-component')).toHaveLength(2); // Desktop and mobile
  });

  it('renders the SearchBar component', () => {
    // Render the component
    render(<MainHeaderPresentation {...defaultProps} />);

    // Check that the SearchBar component is rendered
    expect(screen.getAllByTestId('mock-search-bar')).toHaveLength(2); // Desktop and mobile
  });
});
