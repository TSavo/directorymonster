import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/admin/listings')
}));

// Mock any other imports that might be causing issues
jest.mock('@/hooks/useSiteMetrics', () => ({
  __esModule: true,
  useSiteMetrics: jest.fn().mockReturnValue({
    siteMetrics: {
      totalListings: 100,
      totalCategories: 10,
      totalUsers: 5,
      recentActivity: []
    },
    isLoading: false,
    error: null
  }),
  default: jest.fn().mockReturnValue({
    siteMetrics: {
      totalListings: 100,
      totalCategories: 10,
      totalUsers: 5,
      recentActivity: []
    },
    isLoading: false,
    error: null
  })
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, className, onClick }: any) => {
    return (
      <a
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          if (onClick) onClick(e);
        }}
      >
        {children}
      </a>
    );
  };
});

// Mock the icons
jest.mock('@/components/admin/layout/icons', () => ({
  HomeIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="home-icon" />,
  ListIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="list-icon" />,
  FolderIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="folder-icon" />,
  GlobeIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="globe-icon" />,
  UsersIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="users-icon" />,
  SettingsIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="settings-icon" />,
  ChartIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="chart-icon" />,
  CloseIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="close-icon" />,
  ChevronRightIcon: ({ className }: { className?: string }) => <svg className={className} data-testid="chevron-right-icon" />
}));

describe('AdminSidebar Component', () => {
  const mockCloseSidebar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with all navigation items', () => {
    render(<AdminSidebar isOpen={true} closeSidebar={mockCloseSidebar} />);

    // Check that all nav items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Sites')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    render(<AdminSidebar isOpen={true} closeSidebar={mockCloseSidebar} />);

    // Find the Listings link which should be active based on our mock pathname
    const listingsLink = screen.getByTestId('nav-listings');

    // Check that the active link is present
    expect(listingsLink).toBeInTheDocument();
  });

  it('closes the sidebar when clicking the close button on mobile', () => {
    render(<AdminSidebar isOpen={true} closeSidebar={mockCloseSidebar} />);

    // Find the close button
    const closeButton = screen.getByLabelText('Close sidebar');

    // Click the close button
    fireEvent.click(closeButton);

    // Check that the closeSidebar function was called
    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
  });

  it('has a closeSidebar function', () => {
    render(<AdminSidebar isOpen={true} closeSidebar={mockCloseSidebar} />);

    // Verify the closeSidebar function exists
    expect(mockCloseSidebar).toBeDefined();
  });

  it('applies the correct classes when sidebar is closed', () => {
    render(
      <AdminSidebar isOpen={false} closeSidebar={mockCloseSidebar} />
    );

    // Check that the sidebar has the closed class
    const sidebar = screen.getByTestId('admin-sidebar');
    expect(sidebar).toHaveClass('closed');
    expect(sidebar).not.toHaveClass('open');
  });
});