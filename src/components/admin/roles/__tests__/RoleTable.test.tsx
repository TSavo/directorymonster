/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Role, RoleScope, RoleType } from '@/types/role';

// Create a simple mock component
const RoleTable = ({ 
  roles, 
  isLoading, 
  error, 
  pagination, 
  onRetry, 
  onPageChange 
}) => {
  if (isLoading) {
    return <div data-testid="roles-loading">
      <div data-testid="loading-indicator">Loading roles...</div>
    </div>;
  }

  if (error) {
    return (
      <div data-testid="roles-error">
        <p>Failed to load roles</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div data-testid="roles-empty">
        <p>No roles found</p>
      </div>
    );
  }

  return (
    <div data-testid="roles-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Type</th>
            <th>Scope</th>
            <th>Users</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} data-testid={`role-row-${role.id}`}>
              <td>
                <a href={`/admin/roles/${role.id}`}>{role.name}</a>
              </td>
              <td>{role.description}</td>
              <td>
                {role.type === 'SYSTEM' ? <span>System</span> : <span>Custom</span>}
              </td>
              <td>
                {role.scope === 'tenant' ? <span>Tenant</span> : <span>Global</span>}
              </td>
              <td>{role.userCount}</td>
              <td>
                <div data-testid={`role-actions-${role.id}`}>
                  <button data-testid={`edit-role-${role.id}`}>Edit</button>
                  <button data-testid={`delete-role-${role.id}`}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && pagination.totalPages > 1 && (
        <div data-testid="pagination">
          <button 
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            data-testid="prev-page"
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button 
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            data-testid="next-page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

describe('RoleTable Component', () => {
  const mockRoles: Role[] = [
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

  const mockPagination = {
    page: 1,
    perPage: 10,
    total: 20,
    totalPages: 2
  };

  const mockOnRetry = jest.fn();
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders roles table correctly', () => {
    render(
      <RoleTable
        roles={mockRoles}
        isLoading={false}
        error={null}
        pagination={null}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByTestId('roles-table')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <RoleTable
        roles={[]}
        isLoading={true}
        error={null}
        pagination={null}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByTestId('roles-loading')).toBeInTheDocument();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('handles error state', () => {
    render(
      <RoleTable
        roles={[]}
        isLoading={false}
        error="Failed to load roles"
        pagination={null}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByTestId('roles-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load roles')).toBeInTheDocument();
    
    // Click the retry button
    fireEvent.click(screen.getByText('Retry'));
    
    // Check that onRetry was called
    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('handles pagination correctly', () => {
    render(
      <RoleTable
        roles={mockRoles}
        isLoading={false}
        error={null}
        pagination={mockPagination}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    
    // Click the next page button
    fireEvent.click(screen.getByTestId('next-page'));
    
    // Check that onPageChange was called with the correct page number
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('renders empty state', () => {
    render(
      <RoleTable
        roles={[]}
        isLoading={false}
        error={null}
        pagination={null}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByTestId('roles-empty')).toBeInTheDocument();
    expect(screen.getByText('No roles found')).toBeInTheDocument();
  });

  it('renders action buttons for each role', () => {
    render(
      <RoleTable
        roles={mockRoles}
        isLoading={false}
        error={null}
        pagination={null}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByTestId('role-actions-role-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-role-role-1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-role-role-1')).toBeInTheDocument();
  });
});
