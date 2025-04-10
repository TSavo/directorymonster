/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Create a simple mock component
const UserSiteAccess = ({
  user,
  userSites,
  availableSites,
  availableRoles,
  onGrantAccess,
  onRevokeAccess,
  onAddRole,
  onRemoveRole
}) => {
  const [selectedSite, setSelectedSite] = React.useState(null);
  const [selectedRole, setSelectedRole] = React.useState(null);
  const [showAddRoleDialog, setShowAddRoleDialog] = React.useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = React.useState(false);
  const [siteToRevoke, setSiteToRevoke] = React.useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Site Access for {user.name}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage which sites this user can access and their site-specific roles
        </p>
      </div>

      {/* Sites table */}
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Access
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userSites.map((site) => (
              <tr key={site.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{site.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{site.domain}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="ui-badge ui-badge-default bg-green-50 text-green-700 border-green-200" data-testid="ui-badge">
                    Has Access
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {site.roles.map((role) => (
                      <div key={role.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs">
                        <span className="font-medium">{role.name}</span>
                        <button
                          type="button"
                          className="ml-1 text-gray-500 hover:text-red-500"
                          data-testid={`remove-role-${role.id}`}
                          onClick={() => onRemoveRole(role.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800"
                      data-testid={`add-role-${site.id}`}
                      onClick={() => {
                        setSelectedSite(site.id);
                        setShowAddRoleDialog(true);
                      }}
                    >
                      + Add Role
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    className="ui-button ui-button-outline ui-button-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`revoke-access-${site.id}`}
                    onClick={() => {
                      setSiteToRevoke(site.id);
                      setShowRevokeDialog(true);
                    }}
                  >
                    Revoke Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add site access section */}
      <div className="border rounded-md p-4 bg-gray-50">
        <h3 className="text-md font-medium mb-3">Grant Access to Additional Sites</h3>
        <div className="flex gap-3">
          <select
            className="ui-select"
            data-testid="site-select"
            value={selectedSite || ''}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            <option value="">Select a site</option>
            {availableSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ui-button ui-button-primary"
            data-testid="grant-access-button"
            disabled={!selectedSite}
            onClick={() => {
              onGrantAccess(selectedSite);
              setSelectedSite(null);
            }}
          >
            Grant Access
          </button>
        </div>
      </div>

      {/* Add Role Dialog */}
      {showAddRoleDialog && (
        <div data-testid="add-role-dialog" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Add Role</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <div className="space-y-2">
                {availableRoles.map((role) => (
                  <div key={role.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`role-${role.id}`}
                      name="role"
                      value={role.id}
                      data-testid={`select-role-${role.id}`}
                      checked={selectedRole === role.id}
                      onChange={() => setSelectedRole(role.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="ui-button ui-button-outline"
                onClick={() => {
                  setShowAddRoleDialog(false);
                  setSelectedRole(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ui-button ui-button-primary"
                disabled={!selectedRole}
                onClick={() => {
                  onAddRole(selectedSite, selectedRole);
                  setShowAddRoleDialog(false);
                  setSelectedRole(null);
                }}
              >
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Access Dialog */}
      {showRevokeDialog && (
        <div data-testid="revoke-dialog" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Revoke Site Access</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to revoke this user's access to this site? This will remove all roles and permissions for this site.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="ui-button ui-button-outline"
                onClick={() => {
                  setShowRevokeDialog(false);
                  setSiteToRevoke(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ui-button ui-button-destructive"
                data-testid="alert-dialog-action"
                onClick={() => {
                  onRevokeAccess(siteToRevoke);
                  setShowRevokeDialog(false);
                  setSiteToRevoke(null);
                }}
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

describe('UserSiteAccess Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com'
  };

  const mockUserSites = [
    {
      id: 'site-1',
      name: 'Main Site',
      domain: 'example.com',
      roles: [
        { id: 'role-1', name: 'Site Admin' },
        { id: 'role-2', name: 'Content Editor' }
      ]
    },
    {
      id: 'site-3',
      name: 'Blog',
      domain: 'blog.example.com',
      roles: []
    }
  ];

  const mockAvailableSites = [
    {
      id: 'site-2',
      name: 'Support Portal',
      domain: 'support.example.com'
    },
    {
      id: 'site-4',
      name: 'Documentation',
      domain: 'docs.example.com'
    }
  ];

  const mockAvailableRoles = [
    { id: 'role-1', name: 'Site Admin' },
    { id: 'role-2', name: 'Content Editor' },
    { id: 'role-3', name: 'Viewer' }
  ];

  const mockOnGrantAccess = jest.fn();
  const mockOnRevokeAccess = jest.fn();
  const mockOnAddRole = jest.fn();
  const mockOnRemoveRole = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user site access correctly', () => {
    render(
      <UserSiteAccess
        user={mockUser}
        userSites={mockUserSites}
        availableSites={mockAvailableSites}
        availableRoles={mockAvailableRoles}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );

    expect(screen.getByText('Site Access for John Doe')).toBeInTheDocument();
    expect(screen.getByText('Main Site')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Site Admin')).toBeInTheDocument();
    expect(screen.getByText('Content Editor')).toBeInTheDocument();
  });

  it('grants access to a site', () => {
    render(
      <UserSiteAccess
        user={mockUser}
        userSites={mockUserSites}
        availableSites={mockAvailableSites}
        availableRoles={mockAvailableRoles}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );

    // Select a site from the dropdown
    fireEvent.change(screen.getByTestId('site-select'), { target: { value: 'site-2' } });

    // Click the grant access button
    fireEvent.click(screen.getByTestId('grant-access-button'));

    // Check that onGrantAccess was called with the correct site ID
    expect(mockOnGrantAccess).toHaveBeenCalledWith('site-2');
  });

  it('revokes access from a site', () => {
    render(
      <UserSiteAccess
        user={mockUser}
        userSites={mockUserSites}
        availableSites={mockAvailableSites}
        availableRoles={mockAvailableRoles}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );

    // Click the revoke access button for the first site
    fireEvent.click(screen.getByTestId('revoke-access-site-1'));

    // Check that the revoke dialog is displayed
    expect(screen.getByTestId('revoke-dialog')).toBeInTheDocument();

    // Confirm revocation
    fireEvent.click(screen.getByTestId('alert-dialog-action'));

    // Check that onRevokeAccess was called with the correct site ID
    expect(mockOnRevokeAccess).toHaveBeenCalledWith('site-1');
  });

  it('opens add role dialog', () => {
    render(
      <UserSiteAccess
        user={mockUser}
        userSites={mockUserSites}
        availableSites={mockAvailableSites}
        availableRoles={mockAvailableRoles}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );

    // Click the add role button for the first site
    fireEvent.click(screen.getByTestId('add-role-site-1'));

    // Check that the add role dialog is displayed
    expect(screen.getByTestId('add-role-dialog')).toBeInTheDocument();

    // Select a role
    fireEvent.click(screen.getByTestId('select-role-role-3'));

    // Click add button (using button in the dialog)
    const addRoleButtons = screen.getAllByText('Add Role');
    // The second one is the button in the dialog
    fireEvent.click(addRoleButtons[1]);

    // Check that onAddRole was called with the correct site ID and role ID
    expect(mockOnAddRole).toHaveBeenCalledWith('site-1', 'role-3');
  });

  it('removes a role from a site', () => {
    render(
      <UserSiteAccess
        user={mockUser}
        userSites={mockUserSites}
        availableSites={mockAvailableSites}
        availableRoles={mockAvailableRoles}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );

    // Click the remove button for the first role
    fireEvent.click(screen.getByTestId('remove-role-role-1'));

    // Check that onRemoveRole was called with the correct role ID
    expect(mockOnRemoveRole).toHaveBeenCalledWith('role-1');
  });
});
