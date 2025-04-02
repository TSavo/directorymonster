import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminSidebar } from '@/components/admin/layout';

// Mock next/navigation
const mockUsePathname = jest.fn().mockReturnValue('/admin/listings');
jest.mock('next/navigation', () => ({
  __esModule: true,
  usePathname: () => mockUsePathname()
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
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Check that the app title is present
    expect(screen.getByText('DirectoryMonster')).toBeInTheDocument();

    // Check for return to site link
    expect(screen.getByText('← Return to Site')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    render(<AdminSidebar isOpen={true} closeSidebar={mockCloseSidebar} />);

    // Find all nav links
    const links = screen.getAllByRole('link');

    // Find the Listings link which should be active based on our mock pathname
    const listingsLink = links.find(link => link.textContent?.includes('Listings'));

    // Verify it has the active class (bg-gray-900)
    expect(listingsLink).toHaveClass('bg-gray-900');

    // Verify at least one link doesn't have active class
    const settingsLink = links.find(link => link.textContent?.includes('Settings'));
    expect(settingsLink).not.toHaveClass('bg-gray-900');
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

  it('closes the sidebar when clicking a navigation link on mobile', () => {
    render(<AdminSidebar isOpen={true} closeSidebar={mockCloseSidebar} />);

    // Find the Dashboard link
    const dashboardLink = screen.getByText('Dashboard');

    // Click the link
    fireEvent.click(dashboardLink);

    // Check that the closeSidebar function was called
    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
  });

  it('applies the correct classes when sidebar is closed', () => {
    const { container } = render(
      <AdminSidebar isOpen={false} closeSidebar={mockCloseSidebar} />
    );

    // Check for transform class on the sidebar when closed
    // We can't get the exact element by testid, so we'll use the container
    const sidebarElement = container.querySelector('div[class*="transform -translate-x-full"]');
    expect(sidebarElement).toBeInTheDocument();
  });
});