/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSiteAccess } from '../UserSiteAccess';
import { Role, RoleScope, RoleType } from '@/types/role';

describe('UserSiteAccess Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const mockSites = [
    {
      id: 'site-1',
      name: 'Main Site',
      slug: 'main-site',
      domain: 'example.com',
      hasAccess: true,
      roles: [
        {
          id: 'role-1',
          name: 'Site Admin',
          description: 'Site administrator role',
          type: RoleType.CUSTOM,
          scope: RoleScope.SITE,
          tenantId: 'tenant-1',
          siteId: 'site-1',
          permissions: [],
          userCount: 3,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ]
    },
    {
      id: 'site-2',
      name: 'Blog',
      slug: 'blog',
      domain: 'blog.example.com',
      hasAccess: false,
      roles: []
    },
    {
      id: 'site-3',
      name: 'Store',
      slug: 'store',
      domain: 'store.example.com',
      hasAccess: true,
      roles: [
        {
          id: 'role-2',
          name: 'Store Manager',
          description: 'Store manager role',
          type: RoleType.CUSTOM,
          scope: RoleScope.SITE,
          tenantId: 'tenant-1',
          siteId: 'site-3',
          permissions: [],
          userCount: 2,
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      ]
    }
  ];

  const mockAvailableRoles = [
    {
      id: 'role-3',
      name: 'Site Editor',
      description: 'Site editor role',
      type: RoleType.CUSTOM,
      scope: RoleScope.SITE,
      tenantId: 'tenant-1',
      siteId: 'site-1',
      permissions: [],
      userCount: 5,
      createdAt: '2023-01-03T00:00:00.000Z',
      updatedAt: '2023-01-03T00:00:00.000Z'
    },
    {
      id: 'role-4',
      name: 'Site Viewer',
      description: 'Site viewer role',
      type: RoleType.CUSTOM,
      scope: RoleScope.SITE,
      tenantId: 'tenant-1',
      siteId: 'site-2',
      permissions: [],
      userCount: 8,
      createdAt: '2023-01-04T00:00:00.000Z',
      updatedAt: '2023-01-04T00:00:00.000Z'
    }
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
        sites={mockSites}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Check that the component title is rendered
    expect(screen.getByText('Site Access for John Doe')).toBeInTheDocument();
    
    // Check that sites are rendered
    expect(screen.getByText('Main Site')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Store')).toBeInTheDocument();
    
    // Check that domains are rendered
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('blog.example.com')).toBeInTheDocument();
    expect(screen.getByText('store.example.com')).toBeInTheDocument();
    
    // Check that access status is rendered
    expect(screen.getAllByText('Has Access')).toHaveLength(2);
    expect(screen.getByText('No Access')).toBeInTheDocument();
    
    // Check that site roles are rendered
    expect(screen.getByText('Site Admin')).toBeInTheDocument();
    expect(screen.getByText('Store Manager')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <UserSiteAccess
        user={mockUser}
        sites={[]}
        availableRoles={[]}
        isLoading={true}
        error={null}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    expect(screen.getByTestId('user-sites-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch sites';
    
    render(
      <UserSiteAccess
        user={mockUser}
        sites={[]}
        availableRoles={[]}
        isLoading={false}
        error={errorMessage}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    expect(screen.getByTestId('user-sites-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <UserSiteAccess
        user={mockUser}
        sites={[]}
        availableRoles={[]}
        isLoading={false}
        error={null}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    expect(screen.getByTestId('user-sites-empty')).toBeInTheDocument();
    expect(screen.getByText('No sites available')).toBeInTheDocument();
  });

  it('grants access to a site', async () => {
    render(
      <UserSiteAccess
        user={mockUser}
        sites={mockSites}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Find the "Grant Access" button for the Blog site
    const grantAccessButton = screen.getByTestId('grant-access-site-2');
    fireEvent.click(grantAccessButton);
    
    // Check that onGrantAccess was called with the correct site ID
    expect(mockOnGrantAccess).toHaveBeenCalledWith('site-2');
  });

  it('revokes access from a site', async () => {
    render(
      <UserSiteAccess
        user={mockUser}
        sites={mockSites}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Find the "Revoke Access" button for the Main Site
    const revokeAccessButton = screen.getByTestId('revoke-access-site-1');
    fireEvent.click(revokeAccessButton);
    
    // Check that confirmation dialog is shown
    await waitFor(() => {
      expect(screen.getByText('Revoke Site Access')).toBeInTheDocument();
    });
    
    // Confirm revocation
    fireEvent.click(screen.getByText('Revoke Access'));
    
    // Check that onRevokeAccess was called with the correct site ID
    expect(mockOnRevokeAccess).toHaveBeenCalledWith('site-1');
  });

  it('opens add role dialog', async () => {
    render(
      <UserSiteAccess
        user={mockUser}
        sites={mockSites}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Find the "Add Role" button for the Main Site
    const addRoleButton = screen.getByTestId('add-role-site-1');
    fireEvent.click(addRoleButton);
    
    // Check that dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Add Site Role')).toBeInTheDocument();
    });
    
    // Check that available roles are rendered
    expect(screen.getByText('Site Editor')).toBeInTheDocument();
    
    // Select a role
    fireEvent.click(screen.getByTestId('select-role-role-3'));
    
    // Click add button
    fireEvent.click(screen.getByText('Add Role'));
    
    // Check that onAddRole was called with the correct site ID and role ID
    expect(mockOnAddRole).toHaveBeenCalledWith('site-1', 'role-3');
  });

  it('removes a role from a site', async () => {
    render(
      <UserSiteAccess
        user={mockUser}
        sites={mockSites}
        availableRoles={mockAvailableRoles}
        isLoading={false}
        error={null}
        onGrantAccess={mockOnGrantAccess}
        onRevokeAccess={mockOnRevokeAccess}
        onAddRole={mockOnAddRole}
        onRemoveRole={mockOnRemoveRole}
      />
    );
    
    // Find the "Remove" button for the Site Admin role
    const removeRoleButton = screen.getByTestId('remove-role-role-1');
    fireEvent.click(removeRoleButton);
    
    // Check that confirmation dialog is shown
    await waitFor(() => {
      expect(screen.getByText('Remove Site Role')).toBeInTheDocument();
    });
    
    // Confirm removal
    fireEvent.click(screen.getByText('Remove'));
    
    // Check that onRemoveRole was called with the correct role ID
    expect(mockOnRemoveRole).toHaveBeenCalledWith('role-1');
  });
});
