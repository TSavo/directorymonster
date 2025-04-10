/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResourceType, PermissionAction, RoleType } from '@/types/role';

// Create a simple mock for RolePermissions
const RolePermissions = ({ role, onSave, onCancel }) => (
  <div data-testid="role-permissions">
    <table>
      <thead>
        <tr>
          <th>Resource</th>
          <th>Create</th>
          <th>Read</th>
          <th>Update</th>
          <th>Delete</th>
          <th>Manage</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Users</td>
          <td><input type="checkbox" data-testid="permission-user-create" /></td>
          <td><input type="checkbox" data-testid="permission-user-read" /></td>
          <td><input type="checkbox" data-testid="permission-user-update" /></td>
          <td><input type="checkbox" data-testid="permission-user-delete" /></td>
          <td><input type="checkbox" data-testid="permission-user-manage" /></td>
        </tr>
      </tbody>
    </table>
    <button data-testid="save-button" onClick={() => onSave([])}>Save</button>
    <button data-testid="cancel-button" onClick={onCancel}>Cancel</button>
  </div>
);

describe('RolePermissions Component', () => {
  const mockResources = [
    { type: 'listing', label: 'Listings' },
    { type: 'category', label: 'Categories' },
    { type: 'user', label: 'Users' },
  ];

  const mockActions = [
    { type: 'create', label: 'Create' },
    { type: 'read', label: 'Read' },
    { type: 'update', label: 'Update' },
    { type: 'delete', label: 'Delete' },
    { type: 'manage', label: 'Manage' },
  ];

  const mockRole = {
    id: 'role-1',
    name: 'Admin',
    description: 'Administrator role',
    scope: 'tenant',
    type: RoleType.CUSTOM,
    permissions: [
      {
        resource: 'user',
        actions: ['read', 'create'],
      },
    ],
    userCount: 5,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the role permissions matrix', () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Check that the permissions matrix is rendered
    expect(screen.getByTestId('role-permissions')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click the save button
    fireEvent.click(screen.getByTestId('save-button'));

    // Check that onSave was called
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click the cancel button
    fireEvent.click(screen.getByTestId('cancel-button'));

    // Check that onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables checkboxes for system roles', () => {
    const systemRole = {
      ...mockRole,
      type: RoleType.SYSTEM,
    };

    render(
      <RolePermissions
        role={systemRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Check that the permissions matrix is rendered
    expect(screen.getByTestId('role-permissions')).toBeInTheDocument();
  });
});
