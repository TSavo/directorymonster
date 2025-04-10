import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminLayout } from '../AdminLayout';
import { useTenantSite } from '@/contexts/TenantSiteContext';

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin/dashboard'),
}));

// Mock the TenantSiteContext
jest.mock('@/contexts/TenantSiteContext', () => ({
  useTenantSite: jest.fn(),
  TenantSiteProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tenant-site-provider">{children}</div>
  ),
}));

// Mock the child components
jest.mock('../AdminSidebar', () => ({
  __esModule: true,
  AdminSidebar: ({ isOpen, closeSidebar }: any) => (
    <div data-testid="admin-sidebar">
      {isOpen ? 'Sidebar Open' : 'Sidebar Closed'}
    </div>
  ),
}));

jest.mock('../AdminHeader', () => ({
  __esModule: true,
  AdminHeader: ({ toggleSidebar }: any) => (
    <div data-testid="admin-header" onClick={toggleSidebar}>
      Admin Header
    </div>
  ),
}));

jest.mock('../Breadcrumbs', () => ({
  __esModule: true,
  Breadcrumbs: ({ pathname }: any) => (
    <div data-testid="breadcrumbs">Breadcrumbs: {pathname}</div>
  ),
}));

describe('AdminLayout with TenantSiteContext', () => {
  beforeEach(() => {
    // Mock the useTenantSite hook
    (useTenantSite as jest.Mock).mockReturnValue({
      currentTenantId: 'tenant-1',
      currentSiteId: 'site-1',
      hasMultipleTenants: true,
      hasMultipleSites: true,
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
      ],
      sites: [
        { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
        { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' },
      ],
      loading: false,
      setCurrentTenantId: jest.fn(),
      setCurrentSiteId: jest.fn(),
    });
  });

  it('renders the layout with TenantSiteProvider', () => {
    render(
      <AdminLayout>
        <div data-testid="test-content">Test Content</div>
      </AdminLayout>
    );

    // Check that the TenantSiteProvider is rendered
    expect(screen.getByTestId('tenant-site-provider')).toBeInTheDocument();

    // Check that all components are rendered
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('admin-main-content')).toBeInTheDocument();

    // Check content is displayed
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
