/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../tests/utils/test-utils';
import '@testing-library/jest-dom';
import { EffectivePermissionsContainer } from '@/components/admin/permissions/containers';
import { PermissionComparisonContainer } from '@/components/admin/permissions/containers';
import UserPermissionsPage from '@/app/admin/users/[id]/permissions/page';
import PermissionComparisonPage from '@/app/admin/permissions/compare/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/admin/permissions',
  useParams: () => ({}),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null)
  })
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock document.createElement and related methods for export functionality
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateElement = jest.fn().mockImplementation(() => ({
  href: '',
  download: '',
  click: mockClick
}));

document.createElement = mockCreateElement;
document.body.appendChild = mockAppendChild;
document.body.removeChild = mockRemoveChild;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
global.URL.revokeObjectURL = jest.fn();

describe('Permission Visualization Integration', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    createdAt: '2023-01-01T00:00:00.000Z'
  };

  const mockRoles = [
    {
      id: 'role-1',
      name: 'Admin',
      description: 'Administrator role',
      type: 'system',
      scope: 'tenant',
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

  const mockUsers = [
    mockUser,
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'active',
      createdAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockEffectivePermissions = {
    'user': [
      { resource: 'user', actions: ['create', 'read', 'update', 'delete'] }
    ],
    'role': [
      { resource: 'role', actions: ['read'] }
    ]
  };

  const mockPermissionSources = {
    'user-create': ['Admin'],
    'user-read': ['Admin'],
    'user-update': ['Admin'],
    'user-delete': ['Admin'],
    'role-read': ['Admin']
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for different API endpoints
    (global.fetch as jest.Mock).mockImplementation((url) => {
      // Single user
      if (url.match(/\/api\/admin\/users\/user-1$/)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: mockUser
          })
        });
      }

      // User roles
      if (url.includes('/api/admin/users/user-1/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            roles: [mockRoles[0]]
          })
        });
      }

      // User permissions
      if (url.includes('/api/admin/users/user-1/permissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            effectivePermissions: mockEffectivePermissions,
            permissionSources: mockPermissionSources
          })
        });
      }

      // All roles
      if (url.includes('/api/admin/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            roles: mockRoles
          })
        });
      }

      // All users
      if (url.includes('/api/admin/users') && !url.includes('/roles') && !url.includes('/permissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            users: mockUsers
          })
        });
      }

      // Permission comparison
      if (url.includes('/api/admin/permissions/compare')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            'user': {
              'create': { 'Admin': true, 'Editor': false },
              'read': { 'Admin': true, 'Editor': false },
              'update': { 'Admin': true, 'Editor': false },
              'delete': { 'Admin': true, 'Editor': false }
            },
            'role': {
              'read': { 'Admin': true, 'Editor': false }
            },
            'content': {
              'create': { 'Admin': false, 'Editor': true },
              'read': { 'Admin': false, 'Editor': true },
              'update': { 'Admin': false, 'Editor': true }
            }
          })
        });
      }

      return Promise.reject(new Error('Not found'));
    });
  });

  it.skip('renders the user permissions page with effective permissions', async () => {
    // Render the permissions page
    render(<UserPermissionsPage params={{ id: 'user-1' }} />);

    // Wait for permissions to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Effective Permissions for John Doe')).toBeInTheDocument();
    });

    // Check that fetch was called for user, roles, and permissions
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1');
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/roles');
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/permissions');

    // Check that permissions are displayed
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Role Management')).toBeInTheDocument();
    });
  });

  it.skip('allows filtering permissions by resource', async () => {
    // Render the effective permissions container
    render(<EffectivePermissionsContainer userId="user-1" />);

    // Wait for permissions to load
    await waitFor(() => {
      expect(screen.getByText('Effective Permissions for John Doe')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Role Management')).toBeInTheDocument();
    });

    // Click the "Filter by Resource" button
    fireEvent.click(screen.getByText('Filter by Resource'));

    // Select "User" resource
    fireEvent.click(screen.getByText('User Management'));

    // Check that only user permissions are displayed
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.queryByText('Role Management')).not.toBeInTheDocument();
    });
  });

  it.skip('renders the permission comparison page', async () => {
    // Render the permission comparison page
    render(<PermissionComparisonPage />);

    // Wait for roles and users to load
    await waitFor(() => {
      expect(screen.getByText('Permission Comparison')).toBeInTheDocument();
      expect(screen.getByText('Compare Roles')).toBeInTheDocument();
      expect(screen.getByText('Compare Users')).toBeInTheDocument();
    });

    // Check that fetch was called for roles and users
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/roles?limit=100');
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users?limit=100');

    // Check that role options are displayed
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });
  });

  it.skip('allows comparing permissions between roles', async () => {
    // Mock POST response for permission comparison
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          roles: mockRoles
        })
      })
    ).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          users: mockUsers
        })
      })
    );

    // Render the permission comparison container
    render(<PermissionComparisonContainer />);

    // Wait for roles to load
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    // Select Admin role
    fireEvent.click(screen.getByTestId('select-role-role-1'));

    // Select Editor role
    fireEvent.click(screen.getByTestId('select-role-role-2'));

    // Click the "Compare" button
    fireEvent.click(screen.getByText('Compare'));

    // Check that comparison results are displayed
    await waitFor(() => {
      expect(screen.getByText('Comparison Results')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Role Management')).toBeInTheDocument();
      expect(screen.getByText('Content Management')).toBeInTheDocument();
    });
  });

  it.skip('allows exporting comparison results', async () => {
    // Mock POST response for permission comparison
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          roles: mockRoles
        })
      })
    ).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          users: mockUsers
        })
      })
    );

    // Render the permission comparison container
    render(<PermissionComparisonContainer />);

    // Wait for roles to load
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    // Select Admin role
    fireEvent.click(screen.getByTestId('select-role-role-1'));

    // Select Editor role
    fireEvent.click(screen.getByTestId('select-role-role-2'));

    // Click the "Compare" button
    fireEvent.click(screen.getByText('Compare'));

    // Wait for comparison results
    await waitFor(() => {
      expect(screen.getByText('Comparison Results')).toBeInTheDocument();
    });

    // Click the "Export Results" button
    fireEvent.click(screen.getByText('Export Results'));

    // Check that export functionality was called
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });
});
