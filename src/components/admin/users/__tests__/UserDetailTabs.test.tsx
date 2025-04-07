/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserDetailTabs } from '../UserDetailTabs';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('UserDetailTabs Component', () => {
  const mockUserId = 'user-123';
  const mockActiveTab = 'details';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com'
          }
        })
      })
    );
  });

  it('renders user detail tabs correctly', async () => {
    render(
      <UserDetailTabs userId={mockUserId} activeTab={mockActiveTab} />
    );
    
    // Check that tabs are rendered
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Sites')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    
    // Check that back button is rendered
    expect(screen.getByText('Back to Users')).toBeInTheDocument();
    
    // Check that user name is rendered after fetch
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Check that fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}`);
  });

  it('renders loading state while fetching user', () => {
    render(
      <UserDetailTabs userId={mockUserId} activeTab={mockActiveTab} />
    );
    
    // Check that skeleton is rendered while loading
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch user' })
      })
    );
    
    render(
      <UserDetailTabs userId={mockUserId} activeTab={mockActiveTab} />
    );
    
    // Check that tabs are still rendered even if user fetch fails
    await waitFor(() => {
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Roles')).toBeInTheDocument();
      expect(screen.getByText('Sites')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();
      expect(screen.getByText('Permissions')).toBeInTheDocument();
    });
    
    // Check that user name is not rendered
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    
    // Check that "User Details" is shown as fallback
    expect(screen.getByText('User Details')).toBeInTheDocument();
  });

  it('navigates to the correct tab when clicked', () => {
    const { useRouter } = require('next/navigation');
    const mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush
    }));
    
    render(
      <UserDetailTabs userId={mockUserId} activeTab={mockActiveTab} />
    );
    
    // Click on the Roles tab
    fireEvent.click(screen.getByText('Roles'));
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith(`/admin/users/${mockUserId}/roles`);
    
    // Click on the Sites tab
    fireEvent.click(screen.getByText('Sites'));
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith(`/admin/users/${mockUserId}/sites`);
    
    // Click on the Activities tab
    fireEvent.click(screen.getByText('Activities'));
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith(`/admin/users/${mockUserId}/activities`);
    
    // Click on the Permissions tab
    fireEvent.click(screen.getByText('Permissions'));
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith(`/admin/users/${mockUserId}/permissions`);
    
    // Click on the Details tab
    fireEvent.click(screen.getByText('Details'));
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith(`/admin/users/${mockUserId}/details`);
  });

  it('navigates back to users list when back button is clicked', () => {
    const { useRouter } = require('next/navigation');
    const mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush
    }));
    
    render(
      <UserDetailTabs userId={mockUserId} activeTab={mockActiveTab} />
    );
    
    // Click on the back button
    fireEvent.click(screen.getByText('Back to Users'));
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith('/admin/users');
  });
});
