/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleUsers } from '../RoleUsers';
import { Role, RoleScope, RoleType } from '@/types/role';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));

describe('RoleUsers Component', () => {
  const mockRole: Role = {
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
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders role users correctly', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={mockUsers}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        error={null}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
        onBack={mockOnBack}
      />
    );
    
    // Check that the component title is rendered
    expect(screen.getByText('Users with Admin Role')).toBeInTheDocument();
    
    // Check that users are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    
    // Check that add users button is rendered
    expect(screen.getByText('Add Users')).toBeInTheDocument();
    
    // Check that back button is rendered
    expect(screen.getByText('Back to Role')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={[]}
        availableUsers={[]}
        isLoading={true}
        error={null}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByTestId('role-users-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch users';
    
    render(
      <RoleUsers
        role={mockRole}
        users={[]}
        availableUsers={[]}
        isLoading={false}
        error={errorMessage}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByTestId('role-users-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={[]}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        error={null}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByTestId('role-users-empty')).toBeInTheDocument();
    expect(screen.getByText('No users have this role')).toBeInTheDocument();
  });

  it('opens add users dialog', async () => {
    render(
      <RoleUsers
        role={mockRole}
        users={mockUsers}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        error={null}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
        onBack={mockOnBack}
      />
    );
    
    // Click add users button
    fireEvent.click(screen.getByText('Add Users'));
    
    // Check that dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Add Users to Admin Role')).toBeInTheDocument();
    });
    
    // Check that available users are rendered
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    expect(screen.getByText('Charlie Davis')).toBeInTheDocument();
  });

  it('adds users to role', async () => {
    render(
      <RoleUsers
        role={mockRole}
        users={mockUsers}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        error={null}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
        onBack={mockOnBack}
      />
    );
    
    // Click add users button
    fireEvent.click(screen.getByText('Add Users'));
    
    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Add Users to Admin Role')).toBeInTheDocument();
    });
    
    // Select users
    fireEvent.click(screen.getByTestId('select-user-user-4'));
    fireEvent.click(screen.getByTestId('select-user-user-5'));
    
    // Click add button
    fireEvent.click(screen.getByText('Add Selected Users'));
    
    // Check that onAddUsers was called with the selected users
    expect(mockOnAddUsers).toHaveBeenCalledWith(['user-4', 'user-5']);
  });

  it('removes user from role', async () => {
    render(
      <RoleUsers
        role={mockRole}
        users={mockUsers}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        error={null}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
        onBack={mockOnBack}
      />
    );
    
    // Click remove button for first user
    const removeButtons = screen.getAllByLabelText('Remove user');
    fireEvent.click(removeButtons[0]);
    
    // Check that confirmation dialog is shown
    await waitFor(() => {
      expect(screen.getByText('Remove User from Role')).toBeInTheDocument();
    });
    
    // Confirm removal
    fireEvent.click(screen.getByText('Remove'));
    
    // Check that onRemoveUser was called with the correct user ID
    expect(mockOnRemoveUser).toHaveBeenCalledWith('user-1');
  });

  it('navigates back when back button is clicked', () => {
    render(
      <RoleUsers
        role={mockRole}
        users={mockUsers}
        availableUsers={mockAvailableUsers}
        isLoading={false}
        error={null}
        onAddUsers={mockOnAddUsers}
        onRemoveUser={mockOnRemoveUser}
        onBack={mockOnBack}
      />
    );
    
    // Click back button
    fireEvent.click(screen.getByText('Back to Role'));
    
    // Check that onBack was called
    expect(mockOnBack).toHaveBeenCalled();
  });
});
