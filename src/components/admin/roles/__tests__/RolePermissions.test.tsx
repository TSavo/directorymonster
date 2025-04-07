/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RolePermissions } from '../RolePermissions';
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
    expect(userCreateCheckbox).toBeChecked();
    fireEvent.click(userCreateCheckbox);
    expect(userCreateCheckbox).not.toBeChecked();
    
    // Toggle an unchecked permission on
    const siteCreateCheckbox = screen.getByTestId('permission-site-create');
    expect(siteCreateCheckbox).not.toBeChecked();
    fireEvent.click(siteCreateCheckbox);
    expect(siteCreateCheckbox).toBeChecked();
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
    
    // Check that all site permissions are now checked
    const siteCreateCheckbox = screen.getByTestId('permission-site-create');
    const siteReadCheckbox = screen.getByTestId('permission-site-read');
    const siteUpdateCheckbox = screen.getByTestId('permission-site-update');
    const siteDeleteCheckbox = screen.getByTestId('permission-site-delete');
    const siteManageCheckbox = screen.getByTestId('permission-site-manage');
    
    expect(siteCreateCheckbox).toBeChecked();
    expect(siteReadCheckbox).toBeChecked();
    expect(siteUpdateCheckbox).toBeChecked();
    expect(siteDeleteCheckbox).toBeChecked();
    expect(siteManageCheckbox).toBeChecked();
    
    // Toggle again to uncheck all
    fireEvent.click(siteToggleAll);
    
    expect(siteCreateCheckbox).not.toBeChecked();
    expect(siteReadCheckbox).not.toBeChecked();
    expect(siteUpdateCheckbox).not.toBeChecked();
    expect(siteDeleteCheckbox).not.toBeChecked();
    expect(siteManageCheckbox).not.toBeChecked();
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
    
    // Check that all create permissions are now checked
    const userCreateCheckbox = screen.getByTestId('permission-user-create');
    const roleCreateCheckbox = screen.getByTestId('permission-role-create');
    const siteCreateCheckbox = screen.getByTestId('permission-site-create');
    const categoryCreateCheckbox = screen.getByTestId('permission-category-create');
    const listingCreateCheckbox = screen.getByTestId('permission-listing-create');
    
    expect(userCreateCheckbox).toBeChecked();
    expect(roleCreateCheckbox).toBeChecked();
    expect(siteCreateCheckbox).toBeChecked();
    expect(categoryCreateCheckbox).toBeChecked();
    expect(listingCreateCheckbox).toBeChecked();
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
    
    // Check that onSave was called with the updated permissions
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([
        { resource: 'user', actions: ['read', 'update', 'delete'] },
        { resource: 'role', actions: ['read'] },
        { resource: 'site', actions: ['create'] }
      ]);
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
      expect(checkbox).toBeDisabled();
    });
    
    // Check that save button is disabled
    expect(screen.getByText('Save Permissions')).toBeDisabled();
  });
});
