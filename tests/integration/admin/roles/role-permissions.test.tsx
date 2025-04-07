/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RolePermissions } from '@/components/admin/roles/RolePermissions';
import { ResourceType, PermissionAction } from '@/types/permission';

// Mock the UI components
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      id={id}
      data-testid={id}
      checked={checked}
      onChange={() => onCheckedChange(!checked)}
      disabled={disabled}
    />
  ),
}));

describe('RolePermissions Component', () => {
  const mockResources = [
    { type: ResourceType.LISTING, label: 'Listings' },
    { type: ResourceType.CATEGORY, label: 'Categories' },
    { type: ResourceType.USER, label: 'Users' },
  ];

  const mockActions = [
    { type: PermissionAction.CREATE, label: 'Create' },
    { type: PermissionAction.READ, label: 'Read' },
    { type: PermissionAction.UPDATE, label: 'Update' },
    { type: PermissionAction.DELETE, label: 'Delete' },
  ];

  const mockPermissions = {
    [`${ResourceType.LISTING}-${PermissionAction.READ}`]: true,
    [`${ResourceType.LISTING}-${PermissionAction.CREATE}`]: true,
    [`${ResourceType.CATEGORY}-${PermissionAction.READ}`]: true,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the permissions table with resources and actions', async () => {
    render(
      <RolePermissions
        permissions={mockPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Check that the table is rendered
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Check that resource labels are displayed
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();

    // Check that action labels are displayed
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders checkboxes with correct checked state', async () => {
    render(
      <RolePermissions
        permissions={mockPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Check that checkboxes have the correct checked state
    await waitFor(() => {
      expect(screen.getByTestId(`toggle-${ResourceType.LISTING}-${PermissionAction.READ}`)).toBeChecked();
      expect(screen.getByTestId(`toggle-${ResourceType.LISTING}-${PermissionAction.CREATE}`)).toBeChecked();
      expect(screen.getByTestId(`toggle-${ResourceType.CATEGORY}-${PermissionAction.READ}`)).toBeChecked();
      expect(screen.getByTestId(`toggle-${ResourceType.CATEGORY}-${PermissionAction.CREATE}`)).not.toBeChecked();
    });
  });

  it('calls onChange when a permission checkbox is clicked', async () => {
    render(
      <RolePermissions
        permissions={mockPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Find and click a permission checkbox
    const checkbox = screen.getByTestId(`toggle-${ResourceType.CATEGORY}-${PermissionAction.CREATE}`);
    fireEvent.click(checkbox);

    // Check that onChange was called with the updated permissions
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockPermissions,
        [`${ResourceType.CATEGORY}-${PermissionAction.CREATE}`]: true,
      });
    });
  });

  it('calls onChange when a resource toggle-all checkbox is clicked', async () => {
    render(
      <RolePermissions
        permissions={mockPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Find and click a resource toggle-all checkbox
    const checkbox = screen.getByTestId(`toggle-all-${ResourceType.USER}`);
    fireEvent.click(checkbox);

    // Check that onChange was called with the updated permissions
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockPermissions,
        [`${ResourceType.USER}-${PermissionAction.CREATE}`]: true,
        [`${ResourceType.USER}-${PermissionAction.READ}`]: true,
        [`${ResourceType.USER}-${PermissionAction.UPDATE}`]: true,
        [`${ResourceType.USER}-${PermissionAction.DELETE}`]: true,
      });
    });
  });

  it('calls onChange when an action toggle-all checkbox is clicked', async () => {
    render(
      <RolePermissions
        permissions={mockPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Find and click an action toggle-all checkbox
    const checkbox = screen.getByTestId(`toggle-all-action-${PermissionAction.DELETE}`);
    fireEvent.click(checkbox);

    // Check that onChange was called with the updated permissions
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockPermissions,
        [`${ResourceType.LISTING}-${PermissionAction.DELETE}`]: true,
        [`${ResourceType.CATEGORY}-${PermissionAction.DELETE}`]: true,
        [`${ResourceType.USER}-${PermissionAction.DELETE}`]: true,
      });
    });
  });

  it('disables all checkboxes when isSystemRole is true', async () => {
    render(
      <RolePermissions
        permissions={mockPermissions}
        onChange={mockOnChange}
        isSystemRole={true}
      />
    );

    // Check that all checkboxes are disabled
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeDisabled();
      });
    });
  });

  it('renders toggle-all checkbox as checked when all permissions for a resource are checked', async () => {
    const allListingPermissions = {
      [`${ResourceType.LISTING}-${PermissionAction.CREATE}`]: true,
      [`${ResourceType.LISTING}-${PermissionAction.READ}`]: true,
      [`${ResourceType.LISTING}-${PermissionAction.UPDATE}`]: true,
      [`${ResourceType.LISTING}-${PermissionAction.DELETE}`]: true,
    };

    render(
      <RolePermissions
        permissions={allListingPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Check that the toggle-all checkbox for listings is checked
    await waitFor(() => {
      expect(screen.getByTestId(`toggle-all-${ResourceType.LISTING}`)).toBeChecked();
    });
  });

  it('renders toggle-all checkbox as unchecked when not all permissions for a resource are checked', async () => {
    render(
      <RolePermissions
        permissions={mockPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Check that the toggle-all checkbox for listings is not checked
    await waitFor(() => {
      expect(screen.getByTestId(`toggle-all-${ResourceType.LISTING}`)).not.toBeChecked();
    });
  });

  it('renders toggle-all checkbox for an action as checked when all resources have that action', async () => {
    const allReadPermissions = {
      [`${ResourceType.LISTING}-${PermissionAction.READ}`]: true,
      [`${ResourceType.CATEGORY}-${PermissionAction.READ}`]: true,
      [`${ResourceType.USER}-${PermissionAction.READ}`]: true,
    };

    render(
      <RolePermissions
        permissions={allReadPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Check that the toggle-all checkbox for read action is checked
    await waitFor(() => {
      expect(screen.getByTestId(`toggle-all-action-${PermissionAction.READ}`)).toBeChecked();
    });
  });

  it('renders toggle-all checkbox for an action as unchecked when not all resources have that action', async () => {
    render(
      <RolePermissions
        permissions={mockPermissions}
        onChange={mockOnChange}
        isSystemRole={false}
      />
    );

    // Check that the toggle-all checkbox for read action is not checked
    await waitFor(() => {
      expect(screen.getByTestId(`toggle-all-action-${PermissionAction.READ}`)).not.toBeChecked();
    });
  });
});
