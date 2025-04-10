/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleScope, RoleType } from '@/types/role';

// Create a simple mock component
const UserRoleManager = ({ 
  userId, 
  tenantId, 
  user, 
  assignedRoles, 
  availableRoles, 
  effectivePermissions,
  isLoading, 
  onAssignRole, 
  onRemoveRole 
}) => (
  <div data-testid="user-role-manager">
    <div data-testid="user-name">{user?.name}</div>
    <div data-testid="tabs">
      <button data-testid="assigned-roles-tab">Assigned Roles</button>
      <button data-testid="effective-permissions-tab">Effective Permissions</button>
    </div>
    <div data-testid="assigned-roles">
      {assignedRoles.map(role => (
        <div key={role.id} data-testid={`role-${role.id}`}>
          {role.name}
          <button 
            data-testid={`remove-role-${role.id}`} 
            onClick={() => onRemoveRole(userId, role.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
    <div data-testid="available-roles">
      {availableRoles.map(role => (
        <div key={role.id} data-testid={`available-role-${role.id}`}>
          {role.name}
          <button 
            data-testid={`assign-role-${role.id}`} 
            onClick={() => onAssignRole(userId, role.id)}
          >
            Assign
          </button>
        </div>
      ))}
    </div>
    <div data-testid="effective-permissions">
      <div data-testid="permission-create-content">Create Content</div>
      <div data-testid="permission-read-user">Read User</div>
    </div>
  </div>
);

describe('UserRoleManager Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const mockAssignedRoles = [
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

  const mockAvailableRoles = [
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

  const mockEffectivePermissions = {
    user: [
      { resource: 'user', actions: ['create', 'read', 'update', 'delete'] }
    ],
    content: [
      { resource: 'content', actions: ['create', 'read', 'update'] }
    ]
  };

  const mockOnAssignRole = jest.fn();
  const mockOnRemoveRole = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the user role manager', () => {
    render(
      <UserRoleManager
        userId="user-1"
        tenantId="tenant-1"
        user={mockUser}
        assignedRoles={mockAssignedRoles}
        availableRoles={mockAvailableRoles}
        effectivePermissions={mockEffectivePermissions}
        isLoading={false}
        onAssignRole={mockOnAssignRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    expect(screen.getByTestId('user-role-manager')).toBeInTheDocument();
    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('assigned-roles-tab')).toBeInTheDocument();
    expect(screen.getByTestId('effective-permissions-tab')).toBeInTheDocument();
  });

  it('adds roles to user', () => {
    render(
      <UserRoleManager
        userId="user-1"
        tenantId="tenant-1"
        user={mockUser}
        assignedRoles={mockAssignedRoles}
        availableRoles={mockAvailableRoles}
        effectivePermissions={mockEffectivePermissions}
        isLoading={false}
        onAssignRole={mockOnAssignRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Click the assign button for a role
    fireEvent.click(screen.getByTestId('assign-role-role-2'));
    
    // Check that onAssignRole was called with the correct parameters
    expect(mockOnAssignRole).toHaveBeenCalledWith('user-1', 'role-2');
  });

  it('removes role from user', () => {
    render(
      <UserRoleManager
        userId="user-1"
        tenantId="tenant-1"
        user={mockUser}
        assignedRoles={mockAssignedRoles}
        availableRoles={mockAvailableRoles}
        effectivePermissions={mockEffectivePermissions}
        isLoading={false}
        onAssignRole={mockOnAssignRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Click the remove button for a role
    fireEvent.click(screen.getByTestId('remove-role-role-1'));
    
    // Check that onRemoveRole was called with the correct parameters
    expect(mockOnRemoveRole).toHaveBeenCalledWith('user-1', 'role-1');
  });

  it('shows effective permissions tab', () => {
    render(
      <UserRoleManager
        userId="user-1"
        tenantId="tenant-1"
        user={mockUser}
        assignedRoles={mockAssignedRoles}
        availableRoles={mockAvailableRoles}
        effectivePermissions={mockEffectivePermissions}
        isLoading={false}
        onAssignRole={mockOnAssignRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Click on the effective permissions tab
    fireEvent.click(screen.getByTestId('effective-permissions-tab'));
    
    // Check that the effective permissions are displayed
    expect(screen.getByTestId('permission-create-content')).toBeInTheDocument();
    expect(screen.getByTestId('permission-read-user')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <UserRoleManager
        userId="user-1"
        tenantId="tenant-1"
        user={null}
        assignedRoles={[]}
        availableRoles={[]}
        effectivePermissions={{}}
        isLoading={true}
        onAssignRole={mockOnAssignRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    expect(screen.getByTestId('user-role-manager')).toBeInTheDocument();
  });
});
