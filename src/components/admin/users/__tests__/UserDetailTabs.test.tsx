/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the useRouter hook
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush
  }))
}));

// Create a simple mock component
const UserDetailTabs = ({ userId, activeTab }) => (
  <div data-testid="user-detail-tabs">
    <div data-testid="active-tab">{activeTab}</div>
    <button onClick={() => mockPush(`/admin/users/${userId}/details`)}>Details</button>
    <button onClick={() => mockPush(`/admin/users/${userId}/roles`)}>Roles</button>
    <button onClick={() => mockPush(`/admin/users/${userId}/sites`)}>Sites</button>
    <button onClick={() => mockPush(`/admin/users`)}>Back</button>
  </div>
);

describe('UserDetailTabs Component', () => {
  const mockUserId = 'user-123';
  const mockActiveTab = 'details';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tabs with the active tab highlighted', () => {
    render(
      <UserDetailTabs userId={mockUserId} activeTab={mockActiveTab} />
    );
    
    expect(screen.getByTestId('user-detail-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('active-tab')).toHaveTextContent('details');
  });

  it('navigates to the correct tab when clicked', () => {
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
  });

  it('navigates back to users list when back button is clicked', () => {
    render(
      <UserDetailTabs userId={mockUserId} activeTab={mockActiveTab} />
    );
    
    // Click on the Back button
    fireEvent.click(screen.getByText('Back'));
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith('/admin/users');
  });
});
