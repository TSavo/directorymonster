import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminLayout } from '@/components/admin/layout';

// Mock the necessary hooks and components
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/admin/test'),
}));

// Mock the child components
jest.mock('@/components/admin/layout/AdminSidebar', () => ({
  AdminSidebar: ({ isOpen, closeSidebar }: { isOpen: boolean; closeSidebar: () => void }) => (
    <div data-testid="admin-sidebar" onClick={closeSidebar}>
      {isOpen ? 'Sidebar Open' : 'Sidebar Closed'}
    </div>
  ),
}));

jest.mock('@/components/admin/layout/AdminHeader', () => ({
  AdminHeader: ({ toggleSidebar }: { toggleSidebar: () => void }) => (
    <header data-testid="admin-header" onClick={toggleSidebar}>Admin Header</header>
  ),
}));

jest.mock('@/components/admin/layout/Breadcrumbs', () => ({
  Breadcrumbs: ({ pathname }: { pathname: string }) => (
    <nav data-testid="breadcrumbs">{pathname}</nav>
  ),
}));

describe('AdminLayout Component', () => {
  it('renders the layout with all components', () => {
    render(
      <AdminLayout>
        <div data-testid="admin-content">Test Content</div>
      </AdminLayout>
    );

    // Check that all components are rendered
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getAllByTestId('admin-content').length).toBeGreaterThan(0);

    // Check content is displayed
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('toggles the sidebar when header is clicked', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Initially sidebar should be closed
    expect(screen.getByTestId('admin-sidebar')).toHaveTextContent('Sidebar Closed');

    // Click the header to toggle sidebar
    fireEvent.click(screen.getByTestId('admin-header'));

    // Sidebar should be open
    expect(screen.getByTestId('admin-sidebar')).toHaveTextContent('Sidebar Open');

    // Click the header again to toggle sidebar
    fireEvent.click(screen.getByTestId('admin-header'));

    // Sidebar should be closed again
    expect(screen.getByTestId('admin-sidebar')).toHaveTextContent('Sidebar Closed');
  });

  it('closes the sidebar when clicking on the sidebar itself (mobile behavior)', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Open the sidebar first
    fireEvent.click(screen.getByTestId('admin-header'));
    expect(screen.getByTestId('admin-sidebar')).toHaveTextContent('Sidebar Open');

    // Click the sidebar to close it
    fireEvent.click(screen.getByTestId('admin-sidebar'));

    // Sidebar should be closed
    expect(screen.getByTestId('admin-sidebar')).toHaveTextContent('Sidebar Closed');
  });
});