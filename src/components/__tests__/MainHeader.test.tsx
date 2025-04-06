import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainHeader from '../MainHeader';
import { usePublicTenantSite } from '@/contexts/PublicTenantSiteContext';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Remove the fill prop to avoid the warning
    const { fill, ...rest } = props;
    return <img data-testid={props['data-testid']} {...rest} />;
  },
}));

// Mock the contexts
jest.mock('@/contexts/PublicTenantSiteContext', () => ({
  usePublicTenantSite: jest.fn(),
}));

jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the UnifiedAuthComponent
jest.mock('@/components/auth', () => ({
  UnifiedAuthComponent: () => <div data-testid="unified-auth-component">UnifiedAuthComponent</div>
}));

// Mock the SearchBar component
jest.mock('../SearchBar', () => ({
  __esModule: true,
  default: ({ siteId }: { siteId: string }) => (
    <div data-testid="search-bar">Search Bar for site {siteId}</div>
  ),
}));

describe('MainHeader', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site',
    logoUrl: '/logo.png',
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat-2', name: 'Category 2', slug: 'category-2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (usePublicTenantSite as jest.Mock).mockReturnValue({
      tenants: [],
      sites: [],
      currentTenantId: null,
      currentSiteId: null,
      setCurrentTenantId: jest.fn(),
      setCurrentSiteId: jest.fn(),
      loading: false,
    });

    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  });

  it('renders the header with site name and logo', () => {
    render(<MainHeader site={mockSite} categories={mockCategories} />);

    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByTestId('site-logo')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('renders categories in the navigation', () => {
    render(<MainHeader site={mockSite} categories={mockCategories} />);

    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });

  it('includes the UnifiedAuthComponent', () => {
    render(<MainHeader site={mockSite} categories={mockCategories} />);

    // Check that the UnifiedAuthComponent is included
    expect(screen.getByTestId('unified-auth-component')).toBeInTheDocument();
  });

  it('shows tenant and site selectors for authenticated users with multiple tenants and sites', () => {
    // Mock authenticated user with multiple tenants and sites
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      isLoading: false,
    });

    (usePublicTenantSite as jest.Mock).mockReturnValue({
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
      ],
      sites: [
        { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
        { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' },
      ],
      currentTenantId: 'tenant-1',
      currentSiteId: 'site-1',
      setCurrentTenantId: jest.fn(),
      setCurrentSiteId: jest.fn(),
      loading: false,
    });

    render(<MainHeader site={mockSite} categories={mockCategories} />);

    expect(screen.getByTestId('tenant-selector-container')).toBeInTheDocument();
    expect(screen.getByTestId('site-selector-container')).toBeInTheDocument();

    // Open tenant menu
    fireEvent.click(screen.getByTestId('tenant-selector-button'));

    expect(screen.getByTestId('tenant-option-tenant-1')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-option-tenant-2')).toBeInTheDocument();

    // Open site menu
    fireEvent.click(screen.getByTestId('site-selector-button'));

    expect(screen.getByTestId('site-option-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('site-option-site-2')).toBeInTheDocument();
  });

  it('does not show tenant selector for users with only one tenant', () => {
    // Mock authenticated user with one tenant
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      isLoading: false,
    });

    (usePublicTenantSite as jest.Mock).mockReturnValue({
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
      ],
      sites: [
        { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
        { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' },
      ],
      currentTenantId: 'tenant-1',
      currentSiteId: 'site-1',
      setCurrentTenantId: jest.fn(),
      setCurrentSiteId: jest.fn(),
      loading: false,
    });

    render(<MainHeader site={mockSite} categories={mockCategories} />);

    expect(screen.queryByTestId('tenant-selector-container')).not.toBeInTheDocument();
    expect(screen.getByTestId('site-selector-container')).toBeInTheDocument();
  });

  it('does not show site selector for users with only one site', () => {
    // Mock authenticated user with multiple tenants but one site
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      isLoading: false,
    });

    (usePublicTenantSite as jest.Mock).mockReturnValue({
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
      ],
      sites: [
        { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
      ],
      currentTenantId: 'tenant-1',
      currentSiteId: 'site-1',
      setCurrentTenantId: jest.fn(),
      setCurrentSiteId: jest.fn(),
      loading: false,
    });

    render(<MainHeader site={mockSite} categories={mockCategories} />);

    expect(screen.getByTestId('tenant-selector-container')).toBeInTheDocument();
    expect(screen.queryByTestId('site-selector-container')).not.toBeInTheDocument();
  });

  // Authentication is now handled by the UnifiedAuthComponent
});
