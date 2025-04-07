/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserRoleManager } from '@/components/admin/users/UserRoleManager';

// Mock the hooks
jest.mock('@/components/admin/roles/hooks/useRoles', () => ({
  useRoles: jest.fn(() => ({
    roles: [
      { id: 'role-1', name: 'Admin', description: 'Administrator role', scope: 'tenant' },
      { id: 'role-2', name: 'Editor', description: 'Editor role', scope: 'tenant' },
      { id: 'role-3', name: 'Viewer', description: 'Viewer role', scope: 'tenant' },
    ],
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/components/admin/users/hooks/useUserRoles', () => ({
  useUserRoles: jest.fn(() => ({
    userRoles: [
      { id: 'role-1', name: 'Admin', description: 'Administrator role', scope: 'tenant' },
    ],
    isLoading: false,
    error: null,
    assignRole: jest.fn().mockResolvedValue({}),
    removeRole: jest.fn().mockResolvedValue({}),
  })),
}));

// Mock the UI components
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

describe('UserRoleManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the user role manager with assigned roles', async () => {
    render(<UserRoleManager userId="user-1" tenantId="tenant-1" />);

    // Check that the component is rendered
    await waitFor(() => {
      expect(screen.getByText('Assigned Roles')).toBeInTheDocument();
      expect(screen.getByText('Available Roles')).toBeInTheDocument();
    });

    // Check that assigned roles are displayed
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Administrator role')).toBeInTheDocument();
  });

  it('renders loading state when data is loading', async () => {
    // Override the hooks to return loading state
    jest.spyOn(require('@/components/admin/roles/hooks/useRoles'), 'useRoles').mockReturnValue({
      roles: [],
      isLoading: true,
      error: null,
    });

    jest.spyOn(require('@/components/admin/users/hooks/useUserRoles'), 'useUserRoles').mockReturnValue({
      userRoles: [],
      isLoading: true,
      error: null,
      assignRole: jest.fn(),
      removeRole: jest.fn(),
    });

    render(<UserRoleManager userId="user-1" tenantId="tenant-1" />);

    // Check that loading state is rendered
    await waitFor(() => {
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    // Restore the original hooks
    jest.restoreAllMocks();
  });

  it('renders error state when there is an error', async () => {
    // Override the hooks to return error
    jest.spyOn(require('@/components/admin/users/hooks/useUserRoles'), 'useUserRoles').mockReturnValue({
      userRoles: [],
      isLoading: false,
      error: 'Failed to load user roles',
      assignRole: jest.fn(),
      removeRole: jest.fn(),
    });

    render(<UserRoleManager userId="user-1" tenantId="tenant-1" />);

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load user roles')).toBeInTheDocument();
    });

    // Restore the original hooks
    jest.restoreAllMocks();
  });

  it('calls assignRole when an available role is clicked', async () => {
    const mockAssignRole = jest.fn().mockResolvedValue({});
    
    // Override the hook to return the mock function
    jest.spyOn(require('@/components/admin/users/hooks/useUserRoles'), 'useUserRoles').mockReturnValue({
      userRoles: [
        { id: 'role-1', name: 'Admin', description: 'Administrator role', scope: 'tenant' },
      ],
      isLoading: false,
      error: null,
      assignRole: mockAssignRole,
      removeRole: jest.fn(),
    });

    render(<UserRoleManager userId="user-1" tenantId="tenant-1" />);

    // Find and click an available role
    const editorRole = screen.getByText('Editor');
    fireEvent.click(editorRole);

    // Check that assignRole was called with the correct parameters
    await waitFor(() => {
      expect(mockAssignRole).toHaveBeenCalledWith('user-1', 'role-2');
    });

    // Restore the original hooks
    jest.restoreAllMocks();
  });

  it('calls removeRole when an assigned role is clicked', async () => {
    const mockRemoveRole = jest.fn().mockResolvedValue({});
    
    // Override the hook to return the mock function
    jest.spyOn(require('@/components/admin/users/hooks/useUserRoles'), 'useUserRoles').mockReturnValue({
      userRoles: [
        { id: 'role-1', name: 'Admin', description: 'Administrator role', scope: 'tenant' },
      ],
      isLoading: false,
      error: null,
      assignRole: jest.fn(),
      removeRole: mockRemoveRole,
    });

    render(<UserRoleManager userId="user-1" tenantId="tenant-1" />);

    // Find and click an assigned role
    const adminRole = screen.getByText('Admin');
    fireEvent.click(adminRole);

    // Check that removeRole was called with the correct parameters
    await waitFor(() => {
      expect(mockRemoveRole).toHaveBeenCalledWith('user-1', 'role-1');
    });

    // Restore the original hooks
    jest.restoreAllMocks();
  });

  it('filters available roles to exclude already assigned roles', async () => {
    render(<UserRoleManager userId="user-1" tenantId="tenant-1" />);

    // Check that assigned roles are not in the available roles list
    await waitFor(() => {
      const availableRolesSection = screen.getByTestId('available-roles');
      expect(availableRolesSection).not.toHaveTextContent('Admin');
      expect(availableRolesSection).toHaveTextContent('Editor');
      expect(availableRolesSection).toHaveTextContent('Viewer');
    });
  });

  it('displays empty state when there are no assigned roles', async () => {
    // Override the hook to return no assigned roles
    jest.spyOn(require('@/components/admin/users/hooks/useUserRoles'), 'useUserRoles').mockReturnValue({
      userRoles: [],
      isLoading: false,
      error: null,
      assignRole: jest.fn(),
      removeRole: jest.fn(),
    });

    render(<UserRoleManager userId="user-1" tenantId="tenant-1" />);

    // Check that empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText('No roles assigned')).toBeInTheDocument();
    });

    // Restore the original hooks
    jest.restoreAllMocks();
  });

  it('displays empty state when there are no available roles', async () => {
    // Override the hook to return no available roles
    jest.spyOn(require('@/components/admin/roles/hooks/useRoles'), 'useRoles').mockReturnValue({
      roles: [
        { id: 'role-1', name: 'Admin', description: 'Administrator role', scope: 'tenant' },
      ],
      isLoading: false,
      error: null,
    });

    jest.spyOn(require('@/components/admin/users/hooks/useUserRoles'), 'useUserRoles').mockReturnValue({
      userRoles: [
        { id: 'role-1', name: 'Admin', description: 'Administrator role', scope: 'tenant' },
      ],
      isLoading: false,
      error: null,
      assignRole: jest.fn(),
      removeRole: jest.fn(),
    });

    render(<UserRoleManager userId="user-1" tenantId="tenant-1" />);

    // Check that empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText('No more roles available')).toBeInTheDocument();
    });

    // Restore the original hooks
    jest.restoreAllMocks();
  });
});
