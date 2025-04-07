/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleTable } from '@/components/admin/roles/RoleTable';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('RoleTable Component', () => {
  const mockRoles = [
    {
      id: 'role-1',
      name: 'Admin',
      description: 'Administrator role',
      scope: 'tenant',
      type: 'SYSTEM',
      userCount: 5,
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'role-2',
      name: 'Editor',
      description: 'Editor role',
      scope: 'tenant',
      type: 'CUSTOM',
      userCount: 10,
      createdAt: '2023-01-02T00:00:00.000Z',
    },
    {
      id: 'role-3',
      name: 'Global Admin',
      description: 'Global administrator role',
      scope: 'global',
      type: 'SYSTEM',
      userCount: 2,
      createdAt: '2023-01-03T00:00:00.000Z',
    },
  ];

  const mockPagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 3,
    itemsPerPage: 10,
  };

  const mockOnRetry = jest.fn();
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the role table with roles', async () => {
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

    // Check that the table is rendered
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Check that role rows are rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Global Admin')).toBeInTheDocument();
  });

  it('renders loading state when data is loading', async () => {
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

    // Check that loading state is rendered
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  it('renders error state when there is an error', async () => {
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

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load roles')).toBeInTheDocument();
    });

    // Check that retry button is displayed
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
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

    // Find and click the retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Check that onRetry was called
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when there are no roles', async () => {
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

    // Check that empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText('No roles found')).toBeInTheDocument();
    });
  });

  it('displays role type badges correctly', async () => {
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

    // Check that role type badges are displayed
    await waitFor(() => {
      const systemBadges = screen.getAllByText('System');
      expect(systemBadges.length).toBe(2);
      
      const customBadges = screen.getAllByText('Custom');
      expect(customBadges.length).toBe(1);
    });
  });

  it('displays role scope badges correctly', async () => {
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

    // Check that role scope badges are displayed
    await waitFor(() => {
      const tenantBadges = screen.getAllByText('Tenant');
      expect(tenantBadges.length).toBe(2);
      
      const globalBadges = screen.getAllByText('Global');
      expect(globalBadges.length).toBe(1);
    });
  });

  it('displays user count for each role', async () => {
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

    // Check that user counts are displayed
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('renders pagination controls when there are multiple pages', async () => {
    const multiPagePagination = {
      currentPage: 1,
      totalPages: 3,
      totalItems: 25,
      itemsPerPage: 10,
    };

    render(
      <RoleTable
        roles={mockRoles}
        isLoading={false}
        error={null}
        pagination={multiPagePagination}
        onRetry={mockOnRetry}
        onPageChange={mockOnPageChange}
      />
    );

    // Check that pagination controls are displayed
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    // Check that next page button is displayed
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeInTheDocument();

    // Click the next page button
    fireEvent.click(nextButton);

    // Check that onPageChange was called with the correct page number
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('navigates to role details page when role name is clicked', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    });

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

    // Find and click the role name
    const roleName = screen.getByText('Admin');
    fireEvent.click(roleName);

    // Check that router.push was called with the correct path
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/roles/role-1');
    });

    // Restore the original mock
    jest.restoreAllMocks();
  });
});
