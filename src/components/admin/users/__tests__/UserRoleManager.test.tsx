/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserRoleManager } from '../UserRoleManager';
import { Role, RoleScope, RoleType } from '@/types/role';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

describe('UserRoleManager Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const mockRoles: Role[] = [
    {
      id: 'role-1',
      name: 'Admin',
      description: 'Administrator role',
      type: RoleType.SYSTEM,
      scope: RoleScope.TENANT,
      tenantId: 'tenant-1',
      permissions: [
        { resource: 'user', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'role', actions: ['read'] }
      ],
      userCount: 5,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'role-2',
      name: 'Editor',
      description: 'Content editor role',
      type: RoleType.CUSTOM,
      scope: RoleScope.TENANT,
      tenantId: 'tenant-1',
      permissions: [
        { resource: 'content', actions: ['create', 'read', 'update'] }
      ],
      userCount: 10,
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockAvailableRoles: Role[] = [
    {
      id: 'role-3',
      name: 'Viewer',
      description: 'Read-only role',
      type: RoleType.CUSTOM,
      scope: RoleScope.TENANT,
      tenantId: 'tenant-1',
      permissions: [
        { resource: 'content', actions: ['read'] }
      ],
      userCount: 15,
      createdAt: '2023-01-03T00:00:00.000Z',
      updatedAt: '2023-01-03T00:00:00.000Z'
    },
    {
      id: 'role-4',
      name: 'Contributor',
      description: 'Can contribute content',
      type: RoleType.CUSTOM,
      scope: RoleScope.TENANT,
      tenantId: 'tenant-1',
      permissions: [
        { resource: 'content', actions: ['create', 'read'] }
      ],
      userCount: 8,
      createdAt: '2023-01-04T00:00:00.000Z',
      updatedAt: '2023-01-04T00:00:00.000Z'
    }
  ];

  const mockOnAddRoles = jest.fn();
  const mockOnRemoveRole = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user roles correctly', () => {
    render(
      <UserRoleManager
        user={mockUser}
        roles={mockRoles}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onAddRoles={mockOnAddRoles}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Check that the component title is rendered
    expect(screen.getByText('Roles for John Doe')).toBeInTheDocument();
    
    // Check that roles are rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    
    // Check that role descriptions are rendered
    expect(screen.getByText('Administrator role')).toBeInTheDocument();
    expect(screen.getByText('Content editor role')).toBeInTheDocument();
    
    // Check that add roles button is rendered
    expect(screen.getByText('Add Roles')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <UserRoleManager
        user={mockUser}
        roles={[]}
        availableRoles={[]}
        isLoading={true}
        error={null}
        onAddRoles={mockOnAddRoles}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    expect(screen.getByTestId('user-roles-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch roles';
    
    render(
      <UserRoleManager
        user={mockUser}
        roles={[]}
        availableRoles={[]}
        isLoading={false}
        error={errorMessage}
        onAddRoles={mockOnAddRoles}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    expect(screen.getByTestId('user-roles-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <UserRoleManager
        user={mockUser}
        roles={[]}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onAddRoles={mockOnAddRoles}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    expect(screen.getByTestId('user-roles-empty')).toBeInTheDocument();
    expect(screen.getByText('No roles assigned')).toBeInTheDocument();
  });

  it('opens add roles dialog', async () => {
    render(
      <UserRoleManager
        user={mockUser}
        roles={mockRoles}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onAddRoles={mockOnAddRoles}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Click add roles button
    fireEvent.click(screen.getByText('Add Roles'));
    
    // Check that dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Add Roles to John Doe')).toBeInTheDocument();
    });
    
    // Check that available roles are rendered
    expect(screen.getByText('Viewer')).toBeInTheDocument();
    expect(screen.getByText('Contributor')).toBeInTheDocument();
  });

  it('adds roles to user', async () => {
    render(
      <UserRoleManager
        user={mockUser}
        roles={mockRoles}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onAddRoles={mockOnAddRoles}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Click add roles button
    fireEvent.click(screen.getByText('Add Roles'));
    
    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Add Roles to John Doe')).toBeInTheDocument();
    });
    
    // Select roles
    fireEvent.click(screen.getByTestId('select-role-role-3'));
    fireEvent.click(screen.getByTestId('select-role-role-4'));
    
    // Click add button
    fireEvent.click(screen.getByText('Add Selected Roles'));
    
    // Check that onAddRoles was called with the selected roles
    expect(mockOnAddRoles).toHaveBeenCalledWith(['role-3', 'role-4']);
  });

  it('removes role from user', async () => {
    render(
      <UserRoleManager
        user={mockUser}
        roles={mockRoles}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onAddRoles={mockOnAddRoles}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Click remove button for first role
    const removeButtons = screen.getAllByLabelText('Remove role');
    fireEvent.click(removeButtons[0]);
    
    // Check that confirmation dialog is shown
    await waitFor(() => {
      expect(screen.getByText('Remove Role from User')).toBeInTheDocument();
    });
    
    // Confirm removal
    fireEvent.click(screen.getByText('Remove'));
    
    // Check that onRemoveRole was called with the correct role ID
    expect(mockOnRemoveRole).toHaveBeenCalledWith('role-1');
  });

  it('shows effective permissions tab', () => {
    render(
      <UserRoleManager
        user={mockUser}
        roles={mockRoles}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onAddRoles={mockOnAddRoles}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Click on effective permissions tab
    fireEvent.click(screen.getByText('Effective Permissions'));
    
    // Check that effective permissions are displayed
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Content Management')).toBeInTheDocument();
    
    // Check that permissions are displayed
    expect(screen.getByText('Create Users')).toBeInTheDocument();
    expect(screen.getByText('Read Users')).toBeInTheDocument();
    expect(screen.getByText('Update Users')).toBeInTheDocument();
    expect(screen.getByText('Delete Users')).toBeInTheDocument();
    expect(screen.getByText('Read Roles')).toBeInTheDocument();
    expect(screen.getByText('Create Content')).toBeInTheDocument();
    expect(screen.getByText('Read Content')).toBeInTheDocument();
    expect(screen.getByText('Update Content')).toBeInTheDocument();
  });
});
