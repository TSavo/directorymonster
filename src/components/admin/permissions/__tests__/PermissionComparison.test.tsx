/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionComparison } from '../PermissionComparison';
import { Role, RoleScope, RoleType } from '@/types/role';

describe('PermissionComparison Component', () => {
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
    },
    {
      id: 'role-3',
      name: 'Viewer',
      description: 'Read-only role',
      type: RoleType.CUSTOM,
      scope: RoleScope.TENANT,
      tenantId: 'tenant-1',
      permissions: [
        { resource: 'user', actions: ['read'] },
        { resource: 'role', actions: ['read'] },
        { resource: 'content', actions: ['read'] }
      ],
      userCount: 15,
      createdAt: '2023-01-03T00:00:00.000Z',
      updatedAt: '2023-01-03T00:00:00.000Z'
    }
  ];

  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatarUrl: 'https://example.com/avatar1.jpg'
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatarUrl: 'https://example.com/avatar2.jpg'
    }
  ];

  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders permission comparison correctly', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        isLoading={false}
        error={null}
        onExport={mockOnExport}
      />
    );
    
    // Check that the component title is rendered
    expect(screen.getByText('Permission Comparison')).toBeInTheDocument();
    
    // Check that comparison type options are rendered
    expect(screen.getByText('Compare Roles')).toBeInTheDocument();
    expect(screen.getByText('Compare Users')).toBeInTheDocument();
    
    // Check that role selection is rendered by default
    expect(screen.getByText('Select roles to compare')).toBeInTheDocument();
    
    // Check that role options are rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <PermissionComparison
        roles={[]}
        users={[]}
        isLoading={true}
        error={null}
        onExport={mockOnExport}
      />
    );
    
    expect(screen.getByTestId('permission-comparison-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch data';
    
    render(
      <PermissionComparison
        roles={[]}
        users={[]}
        isLoading={false}
        error={errorMessage}
        onExport={mockOnExport}
      />
    );
    
    expect(screen.getByTestId('permission-comparison-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('switches between role and user comparison', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        isLoading={false}
        error={null}
        onExport={mockOnExport}
      />
    );
    
    // Default should be role comparison
    expect(screen.getByText('Select roles to compare')).toBeInTheDocument();
    
    // Switch to user comparison
    fireEvent.click(screen.getByText('Compare Users'));
    
    // Check that user selection is rendered
    expect(screen.getByText('Select users to compare')).toBeInTheDocument();
    
    // Check that user options are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Switch back to role comparison
    fireEvent.click(screen.getByText('Compare Roles'));
    
    // Check that role selection is rendered again
    expect(screen.getByText('Select roles to compare')).toBeInTheDocument();
  });

  it('selects roles for comparison', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        isLoading={false}
        error={null}
        onExport={mockOnExport}
      />
    );
    
    // Select Admin role
    fireEvent.click(screen.getByTestId('select-role-role-1'));
    
    // Select Editor role
    fireEvent.click(screen.getByTestId('select-role-role-2'));
    
    // Click compare button
    fireEvent.click(screen.getByText('Compare'));
    
    // Check that comparison results are rendered
    expect(screen.getByText('Comparison Results')).toBeInTheDocument();
    
    // Check that role names are in the table header
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    
    // Check that resources are rendered
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Role Management')).toBeInTheDocument();
    expect(screen.getByText('Content Management')).toBeInTheDocument();
    
    // Check that permissions are rendered with correct indicators
    expect(screen.getAllByText('✓')).toHaveLength(5); // Admin: 4 user actions + 1 role action
    expect(screen.getAllByText('✗')).toHaveLength(5); // Editor: missing 4 user actions + 1 role action
  });

  it('selects users for comparison', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        isLoading={false}
        error={null}
        onExport={mockOnExport}
      />
    );
    
    // Switch to user comparison
    fireEvent.click(screen.getByText('Compare Users'));
    
    // Select John Doe
    fireEvent.click(screen.getByTestId('select-user-user-1'));
    
    // Select Jane Smith
    fireEvent.click(screen.getByTestId('select-user-user-2'));
    
    // Click compare button
    fireEvent.click(screen.getByText('Compare'));
    
    // Check that comparison results are rendered
    expect(screen.getByText('Comparison Results')).toBeInTheDocument();
    
    // Check that user names are in the table header
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('exports comparison results', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        isLoading={false}
        error={null}
        onExport={mockOnExport}
      />
    );
    
    // Select Admin role
    fireEvent.click(screen.getByTestId('select-role-role-1'));
    
    // Select Editor role
    fireEvent.click(screen.getByTestId('select-role-role-2'));
    
    // Click compare button
    fireEvent.click(screen.getByText('Compare'));
    
    // Click export button
    fireEvent.click(screen.getByText('Export Results'));
    
    // Check that onExport was called
    expect(mockOnExport).toHaveBeenCalled();
  });

  it('shows differences only when toggled', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        isLoading={false}
        error={null}
        onExport={mockOnExport}
      />
    );
    
    // Select Admin role
    fireEvent.click(screen.getByTestId('select-role-role-1'));
    
    // Select Viewer role
    fireEvent.click(screen.getByTestId('select-role-role-3'));
    
    // Click compare button
    fireEvent.click(screen.getByText('Compare'));
    
    // Initially all permissions should be shown
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Role Management')).toBeInTheDocument();
    
    // Toggle "Show differences only"
    fireEvent.click(screen.getByText('Show differences only'));
    
    // Role Management should be hidden as both roles have the same permissions
    expect(screen.getByText('User Management')).toBeInTheDocument(); // Different
    expect(screen.queryByText('Role Management')).not.toBeInTheDocument(); // Same
  });
});
