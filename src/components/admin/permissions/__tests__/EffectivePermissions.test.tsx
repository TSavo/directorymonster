/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EffectivePermissions } from '../EffectivePermissions';
import { Role, RoleScope, RoleType, Permission } from '@/types/role';

describe('EffectivePermissions Component', () => {
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

  const mockEffectivePermissions: Record<string, Permission[]> = {
    'user': [
      { resource: 'user', actions: ['create', 'read', 'update', 'delete'] }
    ],
    'role': [
      { resource: 'role', actions: ['read'] }
    ],
    'content': [
      { resource: 'content', actions: ['create', 'read', 'update'] }
    ]
  };

  const mockPermissionSources: Record<string, string[]> = {
    'user-create': ['Admin'],
    'user-read': ['Admin'],
    'user-update': ['Admin'],
    'user-delete': ['Admin'],
    'role-read': ['Admin'],
    'content-create': ['Editor'],
    'content-read': ['Editor'],
    'content-update': ['Editor']
  };

  it('renders effective permissions correctly', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={mockRoles}
        effectivePermissions={mockEffectivePermissions}
        permissionSources={mockPermissionSources}
        isLoading={false}
        error={null}
      />
    );
    
    // Check that the component title is rendered
    expect(screen.getByText('Effective Permissions for John Doe')).toBeInTheDocument();
    
    // Check that resource sections are rendered
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Role Management')).toBeInTheDocument();
    expect(screen.getByText('Content Management')).toBeInTheDocument();
    
    // Check that permissions are rendered
    expect(screen.getByText('Create Users')).toBeInTheDocument();
    expect(screen.getByText('Read Users')).toBeInTheDocument();
    expect(screen.getByText('Update Users')).toBeInTheDocument();
    expect(screen.getByText('Delete Users')).toBeInTheDocument();
    expect(screen.getByText('Read Roles')).toBeInTheDocument();
    expect(screen.getByText('Create Content')).toBeInTheDocument();
    expect(screen.getByText('Read Content')).toBeInTheDocument();
    expect(screen.getByText('Update Content')).toBeInTheDocument();
    
    // Check that permission sources are rendered
    expect(screen.getAllByText('From: Admin')).toHaveLength(5);
    expect(screen.getAllByText('From: Editor')).toHaveLength(3);
  });

  it('renders loading state', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={[]}
        effectivePermissions={{}}
        permissionSources={{}}
        isLoading={true}
        error={null}
      />
    );
    
    expect(screen.getByTestId('effective-permissions-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch permissions';
    
    render(
      <EffectivePermissions
        user={mockUser}
        roles={[]}
        effectivePermissions={{}}
        permissionSources={{}}
        isLoading={false}
        error={errorMessage}
      />
    );
    
    expect(screen.getByTestId('effective-permissions-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={[]}
        effectivePermissions={{}}
        permissionSources={{}}
        isLoading={false}
        error={null}
      />
    );
    
    expect(screen.getByTestId('effective-permissions-empty')).toBeInTheDocument();
    expect(screen.getByText('No permissions found')).toBeInTheDocument();
  });

  it('filters permissions by resource', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={mockRoles}
        effectivePermissions={mockEffectivePermissions}
        permissionSources={mockPermissionSources}
        isLoading={false}
        error={null}
      />
    );
    
    // Open resource filter dropdown
    fireEvent.click(screen.getByText('Filter by Resource'));
    
    // Select 'User' resource
    fireEvent.click(screen.getByText('User'));
    
    // Check that only user permissions are displayed
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.queryByText('Role Management')).not.toBeInTheDocument();
    expect(screen.queryByText('Content Management')).not.toBeInTheDocument();
  });

  it('filters permissions by role', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={mockRoles}
        effectivePermissions={mockEffectivePermissions}
        permissionSources={mockPermissionSources}
        isLoading={false}
        error={null}
      />
    );
    
    // Open role filter dropdown
    fireEvent.click(screen.getByText('Filter by Role'));
    
    // Select 'Editor' role
    fireEvent.click(screen.getByText('Editor'));
    
    // Check that only editor permissions are displayed
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(screen.queryByText('Role Management')).not.toBeInTheDocument();
    expect(screen.getByText('Content Management')).toBeInTheDocument();
  });

  it('expands and collapses resource sections', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={mockRoles}
        effectivePermissions={mockEffectivePermissions}
        permissionSources={mockPermissionSources}
        isLoading={false}
        error={null}
      />
    );
    
    // All sections should be expanded by default
    expect(screen.getByText('Create Users')).toBeVisible();
    
    // Click to collapse User Management section
    fireEvent.click(screen.getByText('User Management'));
    
    // User permissions should be hidden
    expect(screen.queryByText('Create Users')).not.toBeVisible();
    
    // Click to expand User Management section again
    fireEvent.click(screen.getByText('User Management'));
    
    // User permissions should be visible again
    expect(screen.getByText('Create Users')).toBeVisible();
  });
});
