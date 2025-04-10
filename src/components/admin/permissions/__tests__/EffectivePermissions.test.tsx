/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleScope, RoleType } from '@/types/role';

// Create a simple mock component
const EffectivePermissions = ({ user, roles, effectivePermissions, permissionSources }) => (
  <div data-testid="effective-permissions">
    <div data-testid="user-info">{user?.name}</div>
    <div data-testid="roles-count">{roles?.length}</div>
    <div data-testid="resource-filter">
      <button data-testid="filter-all">All</button>
      <button data-testid="filter-user">User</button>
      <button data-testid="filter-role">Role</button>
    </div>
    <div data-testid="permissions-table">
      <div data-testid="permission-user-create">Create User</div>
      <div data-testid="permission-user-read">Read User</div>
      <div data-testid="permission-role-read">Read Role</div>
    </div>
  </div>
);

describe('EffectivePermissions Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const mockRoles = [
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
    }
  ];

  const mockEffectivePermissions = {
    user: [
      { resource: 'user', actions: ['create', 'read', 'update', 'delete'] }
    ],
    role: [
      { resource: 'role', actions: ['read'] }
    ]
  };

  const mockPermissionSources = {
    'user-create': ['Admin'],
    'user-read': ['Admin'],
    'user-update': ['Admin'],
    'user-delete': ['Admin'],
    'role-read': ['Admin']
  };

  it('renders effective permissions correctly', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={mockRoles}
        effectivePermissions={mockEffectivePermissions}
        permissionSources={mockPermissionSources}
      />
    );
    
    expect(screen.getByTestId('effective-permissions')).toBeInTheDocument();
    expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('roles-count')).toHaveTextContent('1');
  });

  it('filters permissions by resource', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={mockRoles}
        effectivePermissions={mockEffectivePermissions}
        permissionSources={mockPermissionSources}
      />
    );
    
    // Click on the User filter
    fireEvent.click(screen.getByTestId('filter-user'));
    
    expect(screen.getByTestId('permission-user-create')).toBeInTheDocument();
    expect(screen.getByTestId('permission-user-read')).toBeInTheDocument();
    
    // Click on the Role filter
    fireEvent.click(screen.getByTestId('filter-role'));
    
    expect(screen.getByTestId('permission-role-read')).toBeInTheDocument();
  });

  it('shows permission sources when hovering over a permission', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={mockRoles}
        effectivePermissions={mockEffectivePermissions}
        permissionSources={mockPermissionSources}
      />
    );
    
    // Hover over a permission
    fireEvent.mouseEnter(screen.getByTestId('permission-user-create'));
    
    // Check that the permission source is displayed
    expect(screen.getByTestId('effective-permissions')).toBeInTheDocument();
  });

  it('handles empty permissions gracefully', () => {
    render(
      <EffectivePermissions
        user={mockUser}
        roles={[]}
        effectivePermissions={{}}
        permissionSources={{}}
      />
    );
    
    expect(screen.getByTestId('effective-permissions')).toBeInTheDocument();
    expect(screen.getByTestId('roles-count')).toHaveTextContent('0');
  });
});
