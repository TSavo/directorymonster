/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleTable } from '../RoleTable';
import { Role, RoleScope, RoleType } from '@/types/role';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

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
    total: 2,
    totalPages: 1
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
        pagination={mockPagination}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check that the table headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Scope')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Check that the roles are rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Administrator role')).toBeInTheDocument();
    expect(screen.getByText('Content editor role')).toBeInTheDocument();
    
    // Check that the role types are rendered
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    
    // Check that the role scopes are rendered
    expect(screen.getAllByText('Tenant')).toHaveLength(2);
    
    // Check that the user counts are rendered
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders loading state', () => {
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
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch roles';
    
    render(
      <RoleTable
        roles={[]}
        isLoading={false}
        error={errorMessage}
        pagination={null}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByTestId('roles-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    // Check that retry button is rendered
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('renders empty state', () => {
    render(
      <RoleTable
        roles={[]}
        isLoading={false}
        error={null}
        pagination={mockPagination}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByTestId('roles-empty')).toBeInTheDocument();
    expect(screen.getByText('No roles found')).toBeInTheDocument();
  });

  it('handles pagination correctly', () => {
    render(
      <RoleTable
        roles={mockRoles}
        isLoading={false}
        error={null}
        pagination={{
          page: 1,
          perPage: 10,
          total: 25,
          totalPages: 3
        }}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check that pagination is rendered
    expect(screen.getByText('Showing 1 to 10 of 25 roles')).toBeInTheDocument();
    
    // Click next page button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
    
    // Previous button should be disabled on first page
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('renders action buttons for each role', () => {
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
    
    // Check that action buttons are rendered
    const actionButtons = screen.getAllByLabelText('Actions');
    expect(actionButtons).toHaveLength(2);
    
    // Click on action button to open dropdown
    fireEvent.click(actionButtons[0]);
    
    // Check that dropdown items are rendered
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Manage Permissions')).toBeInTheDocument();
    expect(screen.getByText('View Users')).toBeInTheDocument();
    expect(screen.getByText('Clone')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
