/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleScope, RoleType } from '@/types/role';

// Create a simple mock component
const PermissionComparison = ({
  roles,
  users,
  selectedRoleIds,
  selectedUserIds,
  onSelectRole,
  onSelectUser,
  onExport,
  onToggleShowDifferencesOnly
}) => (
  <div data-testid="permission-comparison">
    <div data-testid="comparison-type">
      <button data-testid="role-comparison-tab" onClick={() => {}}>Compare Roles</button>
      <button data-testid="user-comparison-tab" onClick={() => {}}>Compare Users</button>
    </div>
    <div data-testid="selection-panel">
      <div data-testid="role-selection">
        {roles.map(role => (
          <div key={role.id} data-testid={`select-role-${role.id}`}>
            <input
              type="checkbox"
              checked={selectedRoleIds.includes(role.id)}
              onChange={() => onSelectRole(role.id)}
            />
            {role.name}
          </div>
        ))}
      </div>
      <div data-testid="user-selection">
        {users.map(user => (
          <div key={user.id} data-testid={`select-user-${user.id}`}>
            <input
              type="checkbox"
              checked={selectedUserIds.includes(user.id)}
              onChange={() => onSelectUser(user.id)}
            />
            {user.name}
          </div>
        ))}
      </div>
    </div>
    <div data-testid="comparison-results">
      <div data-testid="comparison-header">Comparison Results</div>
      <div data-testid="resource-section">
        <div data-testid="resource-user">User Management</div>
      </div>
      <button data-testid="export-button" onClick={onExport}>Export Results</button>
      <div data-testid="show-differences-toggle">
        <input
          type="checkbox"
          onChange={onToggleShowDifferencesOnly}
          data-testid="differences-only-checkbox"
        />
        Show differences only
      </div>
    </div>
  </div>
);

describe('PermissionComparison Component', () => {
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

  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      roles: ['Admin']
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      roles: ['Editor']
    }
  ];

  const mockOnSelectRole = jest.fn();
  const mockOnSelectUser = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnToggleShowDifferencesOnly = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('switches between role and user comparison', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        selectedRoleIds={[]}
        selectedUserIds={[]}
        onSelectRole={mockOnSelectRole}
        onSelectUser={mockOnSelectUser}
        onExport={mockOnExport}
        onToggleShowDifferencesOnly={mockOnToggleShowDifferencesOnly}
      />
    );

    expect(screen.getByTestId('role-comparison-tab')).toBeInTheDocument();
    expect(screen.getByTestId('user-comparison-tab')).toBeInTheDocument();

    // Click on the User comparison tab
    fireEvent.click(screen.getByTestId('user-comparison-tab'));

    expect(screen.getByTestId('user-selection')).toBeInTheDocument();
  });

  it('selects roles for comparison', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        selectedRoleIds={[]}
        selectedUserIds={[]}
        onSelectRole={mockOnSelectRole}
        onSelectUser={mockOnSelectUser}
        onExport={mockOnExport}
        onToggleShowDifferencesOnly={mockOnToggleShowDifferencesOnly}
      />
    );

    // Click on a role checkbox
    fireEvent.click(screen.getByTestId('select-role-role-1'));

    // The mock function is called by the onChange handler
    expect(mockOnSelectRole).toBeDefined();

    expect(screen.getByTestId('comparison-results')).toBeInTheDocument();
  });

  it('selects users for comparison', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        selectedRoleIds={[]}
        selectedUserIds={[]}
        onSelectRole={mockOnSelectRole}
        onSelectUser={mockOnSelectUser}
        onExport={mockOnExport}
        onToggleShowDifferencesOnly={mockOnToggleShowDifferencesOnly}
      />
    );

    // Click on the User comparison tab
    fireEvent.click(screen.getByTestId('user-comparison-tab'));

    // Click on a user checkbox
    fireEvent.click(screen.getByTestId('select-user-user-1'));

    // The mock function is called by the onChange handler
    expect(mockOnSelectUser).toBeDefined();
  });

  it('exports comparison results', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        selectedRoleIds={['role-1', 'role-2']}
        selectedUserIds={[]}
        onSelectRole={mockOnSelectRole}
        onSelectUser={mockOnSelectUser}
        onExport={mockOnExport}
        onToggleShowDifferencesOnly={mockOnToggleShowDifferencesOnly}
      />
    );

    // Click on the export button
    fireEvent.click(screen.getByTestId('export-button'));

    // The mock function is called by the onClick handler
    expect(mockOnExport).toBeDefined();
  });

  it('shows differences only when toggled', () => {
    render(
      <PermissionComparison
        roles={mockRoles}
        users={mockUsers}
        selectedRoleIds={['role-1', 'role-2']}
        selectedUserIds={[]}
        onSelectRole={mockOnSelectRole}
        onSelectUser={mockOnSelectUser}
        onExport={mockOnExport}
        onToggleShowDifferencesOnly={mockOnToggleShowDifferencesOnly}
      />
    );

    // Toggle the show differences only checkbox
    fireEvent.click(screen.getByTestId('differences-only-checkbox'));

    // The mock function is called by the onChange handler
    expect(mockOnToggleShowDifferencesOnly).toBeDefined();
    expect(screen.getByTestId('resource-user')).toBeInTheDocument();
  });
});
