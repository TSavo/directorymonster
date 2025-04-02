import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminHeader } from '@/components/admin/layout';

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

describe('AdminHeader Component', () => {
  const mockToggleSidebar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title and buttons', () => {
    render(<AdminHeader toggleSidebar={mockToggleSidebar} />);

    // Check that the header title is present
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();

    // Check for notification button
    const notificationButton = screen.getByRole('button', { name: 'View notifications' });
    expect(notificationButton).toBeInTheDocument();

    // Check for user menu button (using the DOM structure)
    const userMenuButton = screen.getByRole('button', { name: 'Open user menu' });
    expect(userMenuButton).toBeInTheDocument();
  });

  it('calls toggleSidebar when menu button is clicked', () => {
    render(<AdminHeader toggleSidebar={mockToggleSidebar} />);

    // Find the menu button (visible on mobile)
    const menuButton = screen.getByLabelText('Open sidebar');

    // Click the menu button
    fireEvent.click(menuButton);

    // Check that toggleSidebar was called
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('opens the notifications dropdown when clicking the bell icon', () => {
    render(<AdminHeader toggleSidebar={mockToggleSidebar} />);

    // Initially, the notifications dropdown shouldn't be visible
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();

    // Find and click the notifications button
    const notificationsButton = screen.getByRole('button', { name: 'View notifications' });
    fireEvent.click(notificationsButton);

    // Now the notifications dropdown should be visible
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('No new notifications')).toBeInTheDocument();
  });

  it('opens the user dropdown menu when clicking the user icon', () => {
    render(<AdminHeader toggleSidebar={mockToggleSidebar} />);

    // Initially, the user menu shouldn't be visible
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();

    // Find and click the user menu button
    const userMenuButton = screen.getByRole('button', { name: 'Open user menu' });
    fireEvent.click(userMenuButton);

    // Now the user menu should be visible
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Your Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('closes user menu when clicking on a menu item', () => {
    render(<AdminHeader toggleSidebar={mockToggleSidebar} />);

    // Open the user menu
    const userMenuButton = screen.getByRole('button', { name: 'Open user menu' });
    fireEvent.click(userMenuButton);

    // Verify it's open
    expect(screen.getByText('Your Profile')).toBeInTheDocument();

    // Click on a menu item
    fireEvent.click(screen.getByText('Your Profile'));

    // The menu should close - we can check this by verifying the menu items are no longer visible
    expect(screen.queryByText('Your Profile')).not.toBeInTheDocument();
  });

  it('closes the notifications dropdown when opening user menu', () => {
    render(<AdminHeader toggleSidebar={mockToggleSidebar} />);

    // Open notifications first
    const notificationsButton = screen.getByRole('button', { name: 'View notifications' });
    fireEvent.click(notificationsButton);

    // Verify notifications are visible
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Now open the user menu
    const userMenuButton = screen.getByRole('button', { name: 'Open user menu' });
    fireEvent.click(userMenuButton);

    // Notifications should be closed, user menu should be open
    // The dropdown is closed but the button still exists
    expect(screen.queryByText('No new notifications')).not.toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });
});