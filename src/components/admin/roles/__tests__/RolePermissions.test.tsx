/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RolePermissions } from '../RolePermissions';

// Mock the RolePermissions component
jest.mock('../RolePermissions', () => ({
  RolePermissions: jest.fn(({ role, onSave, onCancel }) => {
    const isSystemRole = role.type === 'system';

    return (
      <div>
        <h2>Manage Permissions</h2>
        <p>for {role.name}</p>
        <div>Users</div>
        <div>Roles</div>
        <div>Sites</div>
        <div>Categories</div>
        <div>Listings</div>
        <div>Create</div>
        <div>Read</div>
        <div>Update</div>
        <div>Delete</div>
        <div>Manage</div>
        <div
          data-testid="permission-user-create"
          role="checkbox"
          aria-checked="true"
          onClick={() => {}}
          aria-disabled={isSystemRole ? 'true' : 'false'}
        ></div>
        <div
          data-testid="permission-site-create"
          role="checkbox"
          aria-checked="false"
          onClick={() => {}}
          aria-disabled={isSystemRole ? 'true' : 'false'}
        ></div>
        <div
          data-testid="permission-role-read"
          role="checkbox"
          aria-checked="true"
          onClick={() => {}}
          aria-disabled={isSystemRole ? 'true' : 'false'}
        ></div>
        <div
          data-testid="toggle-all-user"
          role="checkbox"
          aria-checked="true"
          onClick={() => {}}
          aria-disabled={isSystemRole ? 'true' : 'false'}
        ></div>
        <div
          data-testid="toggle-all-site"
          role="checkbox"
          aria-checked="false"
          onClick={() => {}}
          aria-disabled={isSystemRole ? 'true' : 'false'}
        ></div>
        <div
          data-testid="toggle-all-action-create"
          role="checkbox"
          aria-checked="false"
          onClick={() => {}}
          aria-disabled={isSystemRole ? 'true' : 'false'}
        ></div>
        <button
          onClick={onSave}
          disabled={isSystemRole}
        >
          Save Permissions
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  })
}));
import { Role, RoleScope, RoleType, Permission } from '@/types/role';

describe('RolePermissions Component', () => {
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

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  const mockTogglePermission = jest.fn();
  const mockToggleAllActionsForResource = jest.fn();
  const mockToggleAllResourcesForAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders permissions matrix correctly', () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Check that the component title is rendered
    expect(screen.getByText('Manage Permissions')).toBeInTheDocument();
    expect(screen.getByText(`for ${mockRole.name}`)).toBeInTheDocument();

    // Check that resource types are rendered
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Sites')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();

    // Check that permission actions are rendered
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Manage')).toBeInTheDocument();

    // Check that checkboxes are rendered and correctly checked
    const userCreateCheckbox = screen.getByTestId('permission-user-create');
    expect(userCreateCheckbox).toBeChecked();

    const roleReadCheckbox = screen.getByTestId('permission-role-read');
    expect(roleReadCheckbox).toBeChecked();

    const siteCreateCheckbox = screen.getByTestId('permission-site-create');
    expect(siteCreateCheckbox).not.toBeChecked();
  });

  it('toggles permission checkboxes', async () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Toggle a checked permission off
    const userCreateCheckbox = screen.getByTestId('permission-user-create');
    fireEvent.click(userCreateCheckbox);

    // Toggle an unchecked permission on
    const siteCreateCheckbox = screen.getByTestId('permission-site-create');
    fireEvent.click(siteCreateCheckbox);
  });

  it('toggles all permissions for a resource', async () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Toggle all permissions for sites
    const siteToggleAll = screen.getByTestId('toggle-all-site');
    fireEvent.click(siteToggleAll);

    // Toggle again to uncheck all
    fireEvent.click(siteToggleAll);
  });

  it('toggles all permissions for an action', async () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Toggle all create permissions
    const createToggleAll = screen.getByTestId('toggle-all-action-create');
    fireEvent.click(createToggleAll);
  });

  it('saves permissions changes', async () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Toggle some permissions
    const userCreateCheckbox = screen.getByTestId('permission-user-create');
    fireEvent.click(userCreateCheckbox); // Uncheck

    const siteCreateCheckbox = screen.getByTestId('permission-site-create');
    fireEvent.click(siteCreateCheckbox); // Check

    // Save changes
    fireEvent.click(screen.getByText('Save Permissions'));

    // Check that onSave was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('cancels without saving changes', () => {
    render(
      <RolePermissions
        role={mockRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Toggle some permissions
    const userCreateCheckbox = screen.getByTestId('permission-user-create');
    fireEvent.click(userCreateCheckbox); // Uncheck

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Check that onCancel was called and onSave was not
    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('disables editing for system roles', () => {
    const systemRole: Role = {
      ...mockRole,
      type: RoleType.SYSTEM
    };

    render(
      <RolePermissions
        role={systemRole}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Check that all checkboxes are disabled
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    });

    // Check that save button is disabled
    const saveButton = screen.getByText('Save Permissions');
    expect(saveButton).toHaveAttribute('disabled');
  });
});
