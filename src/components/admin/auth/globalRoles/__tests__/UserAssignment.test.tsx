/**
 * Tests for the UserAssignment component
 * 
 * These tests focus on the tenant selection modal and role removal functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserAssignment from '../UserAssignment';
import { useGlobalRoles } from '../useGlobalRoles';

// Mock the useGlobalRoles hook
jest.mock('../useGlobalRoles', () => ({
  __esModule: true,
  useGlobalRoles: jest.fn()
}));

describe('UserAssignment Component', () => {
  // Mock functions
  const mockGetUsersWithRole = jest.fn();
  const mockAssignRole = jest.fn();
  const mockRemoveRole = jest.fn();
  const mockOnClose = jest.fn();

  // Default props
  const defaultProps = {
    roleId: 'role-123',
    roleName: 'Test Role',
    onClose: mockOnClose
  };

  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the useGlobalRoles hook implementation
    (useGlobalRoles as jest.Mock).mockReturnValue({
      getUsersWithRole: mockGetUsersWithRole,
      assignRole: mockAssignRole,
      removeRole: mockRemoveRole
    });
    
    // Mock the users returned by getUsersWithRole
    mockGetUsersWithRole.mockResolvedValue(['user-1', 'user-2', 'user-3']);
  });

  it('renders the component with users', async () => {
    render(<UserAssignment {...defaultProps} />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(mockGetUsersWithRole).toHaveBeenCalledWith('role-123');
    });
    
    // Verify the role name is displayed
    expect(screen.getByText('Manage Users with Role: Test Role')).toBeInTheDocument();
    
    // Verify users are displayed
    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('user-2')).toBeInTheDocument();
    expect(screen.getByText('user-3')).toBeInTheDocument();
  });

  it('shows tenant selection modal when removing a role', async () => {
    render(<UserAssignment {...defaultProps} />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(mockGetUsersWithRole).toHaveBeenCalled();
    });
    
    // Click the remove button for user-1
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    // Verify tenant selection modal is displayed
    expect(screen.getByText('Select Tenant Context')).toBeInTheDocument();
    expect(screen.getByText(/Please specify which tenant context to remove this role from user/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter tenant ID')).toBeInTheDocument();
  });

  it('removes the role when tenant selection is confirmed', async () => {
    // Mock successful role removal
    mockRemoveRole.mockResolvedValue(true);
    
    render(<UserAssignment {...defaultProps} />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(mockGetUsersWithRole).toHaveBeenCalled();
    });
    
    // Click the remove button for user-1
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    // Enter tenant ID in the modal
    const tenantInput = screen.getByPlaceholderText('Enter tenant ID');
    fireEvent.change(tenantInput, { target: { value: 'tenant-456' } });
    
    // Click the Remove Role button
    const confirmButton = screen.getByText('Remove Role');
    fireEvent.click(confirmButton);
    
    // Verify removeRole was called with correct parameters
    await waitFor(() => {
      expect(mockRemoveRole).toHaveBeenCalledWith('user-1', 'tenant-456', 'role-123');
    });
    
    // Verify user was removed from the list
    await waitFor(() => {
      expect(screen.queryByText('user-1')).not.toBeInTheDocument();
    });
  });

  it('cancels role removal when Cancel button is clicked', async () => {
    render(<UserAssignment {...defaultProps} />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(mockGetUsersWithRole).toHaveBeenCalled();
    });
    
    // Click the remove button for user-1
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    // Verify modal is displayed
    expect(screen.getByText('Select Tenant Context')).toBeInTheDocument();
    
    // Click the Cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Select Tenant Context')).not.toBeInTheDocument();
    });
    
    // Verify removeRole was not called
    expect(mockRemoveRole).not.toHaveBeenCalled();
  });

  it('assigns a role when form is submitted', async () => {
    // Mock successful role assignment
    mockAssignRole.mockResolvedValue(true);
    
    render(<UserAssignment {...defaultProps} />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(mockGetUsersWithRole).toHaveBeenCalled();
    });
    
    // Enter user ID and tenant ID in the form
    const userInput = screen.getByPlaceholderText('User ID');
    const tenantInput = screen.getByPlaceholderText('Tenant ID');
    
    fireEvent.change(userInput, { target: { value: 'new-user' } });
    fireEvent.change(tenantInput, { target: { value: 'tenant-456' } });
    
    // Click the Assign button
    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);
    
    // Verify assignRole was called with correct parameters
    await waitFor(() => {
      expect(mockAssignRole).toHaveBeenCalledWith('new-user', 'tenant-456', 'role-123');
    });
    
    // Verify form was reset
    await waitFor(() => {
      expect(userInput).toHaveValue('');
      expect(tenantInput).toHaveValue('');
    });
  });

  it('shows error message when role assignment fails', async () => {
    // Mock failed role assignment
    mockAssignRole.mockResolvedValue(false);
    
    render(<UserAssignment {...defaultProps} />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(mockGetUsersWithRole).toHaveBeenCalled();
    });
    
    // Enter user ID and tenant ID in the form
    const userInput = screen.getByPlaceholderText('User ID');
    const tenantInput = screen.getByPlaceholderText('Tenant ID');
    
    fireEvent.change(userInput, { target: { value: 'new-user' } });
    fireEvent.change(tenantInput, { target: { value: 'tenant-456' } });
    
    // Click the Assign button
    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to assign role')).toBeInTheDocument();
    });
  });

  it('shows error message when role removal fails', async () => {
    // Mock failed role removal
    mockRemoveRole.mockResolvedValue(false);
    
    render(<UserAssignment {...defaultProps} />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(mockGetUsersWithRole).toHaveBeenCalled();
    });
    
    // Click the remove button for user-1
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    // Enter tenant ID in the modal
    const tenantInput = screen.getByPlaceholderText('Enter tenant ID');
    fireEvent.change(tenantInput, { target: { value: 'tenant-456' } });
    
    // Click the Remove Role button
    const confirmButton = screen.getByText('Remove Role');
    fireEvent.click(confirmButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to remove role')).toBeInTheDocument();
    });
  });

  it('disables removal button when no tenant ID is entered', async () => {
    render(<UserAssignment {...defaultProps} />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(mockGetUsersWithRole).toHaveBeenCalled();
    });
    
    // Click the remove button for user-1
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    // Verify removal button is disabled
    const removeButton = screen.getByText('Remove Role');
    expect(removeButton).toBeDisabled();
    
    // Enter tenant ID in the modal
    const tenantInput = screen.getByPlaceholderText('Enter tenant ID');
    fireEvent.change(tenantInput, { target: { value: 'tenant-456' } });
    
    // Verify removal button is enabled
    expect(removeButton).not.toBeDisabled();
  });
});
