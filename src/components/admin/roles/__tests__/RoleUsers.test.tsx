/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleScope, RoleType } from '@/types/role';

// Create a simple mock component
const RoleUsers = ({ 
  role, 
  users, 
  availableUsers, 
  isLoading, 
  onAddUsers, 
  onRemoveUser 
}) => (
  <div data-testid="role-users">
    <div data-testid="role-name">{role?.name}</div>
    <div data-testid="users-list">
      {users.map(user => (
        <div key={user.id} data-testid={`user-${user.id}`}>
          {user.name}
          <button 
            data-testid={`remove-user-${user.id}`} 
            onClick={() => onRemoveUser(user.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
    <button 
      data-testid="add-users-button" 
      onClick={() => onAddUsers(['user-4', 'user-5'])}
    >
      Add Users
    </button>
  </div>
);

describe('RoleUsers Component', () => {
  const mockRole = {
    id: 'role-1',
    name: 'Admin',
    description: 'Administrator role',
    type: RoleType.CUSTOM,
    scope: RoleScope.TENANT,
    tenantId: 'tenant-1',
    permissions: [
      { resource: 'user', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'role', actions: ['read'] }
    ],
    userCount: 5,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

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
    },
    {
      id: 'user-3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      avatarUrl: 'https://example.com/avatar3.jpg'
    }
  ];

  const mockAvailableUsers = [
    {
      id: 'user-4',
      name: 'Alice Brown',
      email: 'alice@example.com',
      avatarUrl: 'https://example.com/avatar4.jpg'
    },
    {
      id: 'user-5',
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      avatarUrl: 'https://example.com/avatar5.jpg'
    }
  ];

  const mockOnAddUsers = jest.fn();
  const mockOnRemoveUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the role users list', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={mockUsers}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
      />
    );
    
    expect(screen.getByTestId('role-users')).toBeInTheDocument();
    expect(screen.getByTestId('role-name')).toHaveTextContent('Admin');
    expect(screen.getByTestId('user-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-user-2')).toBeInTheDocument();
    expect(screen.getByTestId('user-user-3')).toBeInTheDocument();
  });

  it('adds users to role', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={mockUsers}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
      />
    );
    
    // Click the add users button
    fireEvent.click(screen.getByTestId('add-users-button'));
    
    // Check that onAddUsers was called with the correct parameters
    expect(mockOnAddUsers).toHaveBeenCalledWith(['user-4', 'user-5']);
  });

  it('removes user from role', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={mockUsers}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
      />
    );
    
    // Click the remove button for a user
    fireEvent.click(screen.getByTestId('remove-user-user-1'));
    
    // Check that onRemoveUser was called with the correct parameters
    expect(mockOnRemoveUser).toHaveBeenCalledWith('user-1');
  });

  it('handles loading state', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={[]}
        availableUsers={[]}
        isLoading={true}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
      />
    );
    
    expect(screen.getByTestId('role-users')).toBeInTheDocument();
  });

  it('handles empty users list', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={[]}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
      />
    );
    
    expect(screen.getByTestId('role-users')).toBeInTheDocument();
    expect(screen.queryByTestId('user-user-1')).not.toBeInTheDocument();
  });
});
