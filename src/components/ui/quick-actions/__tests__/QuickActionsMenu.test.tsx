/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickActionsMenu } from '../QuickActionsMenu';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: jest.fn(),
}));

describe('QuickActionsMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the usePathname hook to return a path
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/admin/users');
  });

  it('renders the quick actions button', () => {
    render(<QuickActionsMenu />);
    
    // Check that the button is rendered
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('opens the popover when button is clicked', async () => {
    render(<QuickActionsMenu />);
    
    // Click the button
    fireEvent.click(screen.getByText('Quick Actions'));
    
    // Check that the popover is opened
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search actions...')).toBeInTheDocument();
    });
  });

  it('filters actions based on current context', async () => {
    render(<QuickActionsMenu />);
    
    // Click the button to open the popover
    fireEvent.click(screen.getByText('Quick Actions'));
    
    // Check that user-specific actions are shown
    await waitFor(() => {
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });
    
    // Change the path to roles
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/admin/roles');
    
    // Rerender to trigger the context change
    render(<QuickActionsMenu />);
    
    // Click the button to open the popover
    fireEvent.click(screen.getByText('Quick Actions'));
    
    // Check that role-specific actions are shown
    await waitFor(() => {
      expect(screen.getByText('Create Role')).toBeInTheDocument();
      expect(screen.getByText('Compare Permissions')).toBeInTheDocument();
    });
  });

  it('filters actions based on search input', async () => {
    render(<QuickActionsMenu />);
    
    // Click the button to open the popover
    fireEvent.click(screen.getByText('Quick Actions'));
    
    // Wait for the popover to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search actions...')).toBeInTheDocument();
    });
    
    // Enter a search query
    fireEvent.change(screen.getByPlaceholderText('Search actions...'), {
      target: { value: 'analytics' }
    });
    
    // Check that only matching actions are shown
    await waitFor(() => {
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
      expect(screen.queryByText('Create User')).not.toBeInTheDocument();
    });
  });

  it('navigates to the correct page when an action is selected', async () => {
    const { useRouter } = require('next/navigation');
    const mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<QuickActionsMenu />);
    
    // Click the button to open the popover
    fireEvent.click(screen.getByText('Quick Actions'));
    
    // Wait for the popover to open
    await waitFor(() => {
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });
    
    // Click an action
    fireEvent.click(screen.getByText('Create User'));
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith('/admin/users/new');
  });

  it('closes the popover after selecting an action', async () => {
    render(<QuickActionsMenu />);
    
    // Click the button to open the popover
    fireEvent.click(screen.getByText('Quick Actions'));
    
    // Wait for the popover to open
    await waitFor(() => {
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });
    
    // Click an action
    fireEvent.click(screen.getByText('Create User'));
    
    // Check that the popover is closed
    await waitFor(() => {
      expect(screen.queryByText('Create User')).not.toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<QuickActionsMenu className="custom-class" />);
    
    // Check that the custom class is applied
    const button = screen.getByText('Quick Actions').closest('button');
    expect(button).toHaveClass('custom-class');
  });

  it('shows "No actions found" when search has no results', async () => {
    render(<QuickActionsMenu />);
    
    // Click the button to open the popover
    fireEvent.click(screen.getByText('Quick Actions'));
    
    // Wait for the popover to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search actions...')).toBeInTheDocument();
    });
    
    // Enter a search query that won't match any actions
    fireEvent.change(screen.getByPlaceholderText('Search actions...'), {
      target: { value: 'nonexistent' }
    });
    
    // Check that "No actions found" is shown
    await waitFor(() => {
      expect(screen.getByText('No actions found.')).toBeInTheDocument();
    });
  });
});
