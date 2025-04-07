/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { UserTable } from '@/components/admin/users';
import { UserRoleManagerContainer } from '@/components/admin/users/containers';
import { UserDetailTabs } from '@/components/admin/users/UserDetailTabs';
import UserRolesPage from '@/app/admin/users/[id]/roles/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  })
}));

// Mock fetch API
global.fetch = jest.fn();

describe('User Role Management Integration', () => {
  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'active',
      createdAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockRoles = [
    {
      id: 'role-1',
      name: 'Admin',
      description: 'Administrator role',
      type: 'system',
      scope: 'tenant',
      tenantId: 'tenant-1',
      permissions: [
        { resource: 'user', actions: ['create', 'read', 'update', 'delete'] }
      ],
      userCount: 5,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'role-2',
      name: 'Editor',
      description: 'Content editor role',
      type: 'custom',
      scope: 'tenant',
      tenantId: 'tenant-1',
      permissions: [
        { resource: 'content', actions: ['create', 'read', 'update'] }
      ],
      userCount: 10,
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for different API endpoints
    (global.fetch as jest.Mock).mockImplementation((url) => {
      // Users list
      if (url.includes('/api/admin/users') && !url.includes('/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            users: mockUsers,
            pagination: {
              page: 1,
              perPage: 10,
              total: 2,
              totalPages: 1
            }
          })
        });
      }
      
      // Single user
      if (url.match(/\/api\/admin\/users\/user-1$/)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: mockUsers[0]
          })
        });
      }
      
      // User roles
      if (url.includes('/api/admin/users/user-1/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            roles: [mockRoles[0]],
            availableRoles: [mockRoles[1]]
          })
        });
      }
      
      return Promise.reject(new Error('Not found'));
    });
  });

  it('integrates user table with role management', async () => {
    // Render the user table
    render(<UserTable />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    // Check that fetch was called for users
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/users'));
    
    // Find and click the roles icon for the first user
    const roleIcon = screen.getAllByTitle('Manage Roles')[0];
    fireEvent.click(roleIcon);
    
    // Mock router push to simulate navigation
    expect(require('next/navigation').useRouter().push).toHaveBeenCalledWith('/admin/users/user-1/roles');
    
    // Now render the roles page
    render(<UserRolesPage params={{ id: 'user-1' }} />);
    
    // Wait for roles to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
    
    // Check that fetch was called for user and roles
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1');
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/roles');
  });

  it('allows adding roles to a user', async () => {
    // Mock POST response for adding roles
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: mockUsers[0]
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          roles: [mockRoles[0]],
          availableRoles: [mockRoles[1]]
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          roles: [mockRoles[0], mockRoles[1]],
          availableRoles: []
        })
      })
    );
    
    // Render the role manager container
    render(<UserRoleManagerContainer userId="user-1" />);
    
    // Wait for roles to load
    await waitFor(() => {
      expect(screen.getByText('Add Roles')).toBeInTheDocument();
    });
    
    // Click the "Add Roles" button
    fireEvent.click(screen.getByText('Add Roles'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByText('Select roles to assign to this user')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });
    
    // Select the Editor role
    const editorCheckbox = screen.getByLabelText('Editor');
    fireEvent.click(editorCheckbox);
    
    // Click the "Add Selected Roles" button
    fireEvent.click(screen.getByText('Add Selected Roles'));
    
    // Check that fetch was called to add the role
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/roles', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ roleIds: ['role-2'] })
      }));
    });
    
    // Check that roles were refreshed
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/roles');
  });

  it('allows removing a role from a user', async () => {
    // Mock DELETE response for removing a role
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: mockUsers[0]
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          roles: [mockRoles[0], mockRoles[1]],
          availableRoles: []
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          roles: [mockRoles[1]],
          availableRoles: [mockRoles[0]]
        })
      })
    );
    
    // Render the role manager container
    render(<UserRoleManagerContainer userId="user-1" />);
    
    // Wait for roles to load
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });
    
    // Find and click the remove button for the Admin role
    const removeButtons = screen.getAllByLabelText('Remove role');
    fireEvent.click(removeButtons[0]);
    
    // Wait for the confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Remove Role from User')).toBeInTheDocument();
    });
    
    // Confirm removal
    fireEvent.click(screen.getByText('Remove'));
    
    // Check that fetch was called to remove the role
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/roles/role-1', expect.objectContaining({
        method: 'DELETE'
      }));
    });
    
    // Check that roles were refreshed
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/roles');
  });

  it('shows effective permissions for a user', async () => {
    // Mock fetch for effective permissions
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: mockUsers[0]
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          roles: [mockRoles[0]],
          availableRoles: [mockRoles[1]]
        })
      })
    );
    
    // Render the role manager container
    render(<UserRoleManagerContainer userId="user-1" />);
    
    // Wait for roles to load
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
    
    // Click on the "Effective Permissions" tab
    fireEvent.click(screen.getByText('Effective Permissions'));
    
    // Check that effective permissions are displayed
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Create Users')).toBeInTheDocument();
      expect(screen.getByText('Read Users')).toBeInTheDocument();
      expect(screen.getByText('Update Users')).toBeInTheDocument();
      expect(screen.getByText('Delete Users')).toBeInTheDocument();
    });
  });
});
