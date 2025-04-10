/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRoles } from '../useRoles';
import { Role, RoleScope, RoleType } from '@/types/role';

// Mock fetch function
global.fetch = jest.fn();

describe('useRoles Hook', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('initializes with default values', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roles: [], pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 } })
    });

    const { result } = renderHook(() => useRoles({ autoFetch: false }));

    expect(result.current.roles).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination).toBeNull();
  });

  it('fetches roles successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roles: mockRoles, pagination: mockPagination })
    });

    const { result } = renderHook(() => useRoles());

    // Initial state
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After fetch
    expect(result.current.roles).toEqual(mockRoles);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();

    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/roles')
    );
  });

  it('handles fetch error', async () => {
    const errorMessage = 'Failed to fetch roles';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useRoles());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.roles).toEqual([]);
  });

  it('applies filters correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roles: mockRoles, pagination: mockPagination })
    });

    const initialFilter = {
      search: 'admin',
      scope: RoleScope.TENANT,
      type: RoleType.SYSTEM
    };

    const { result } = renderHook(() => 
      useRoles({ initialFilter, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that fetch was called with the correct URL and query parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/admin\/roles\?.*search=admin.*/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/scope=tenant/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/type=system/)
    );
  });

  it('updates page correctly', async () => {
    // First fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roles: mockRoles, pagination: mockPagination })
    });

    const { result } = renderHook(() => useRoles());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Second fetch with new page
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        roles: mockRoles, 
        pagination: { ...mockPagination, page: 2 } 
      })
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      // This will be true during the second fetch
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Check that fetch was called with the correct page parameter
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/page=2/)
    );
  });

  it('updates filter correctly', async () => {
    // First fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roles: mockRoles, pagination: mockPagination })
    });

    const { result } = renderHook(() => useRoles());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Second fetch with new filter
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roles: mockRoles, pagination: mockPagination })
    });

    const newFilter = {
      search: 'editor',
      scope: RoleScope.TENANT
    };

    act(() => {
      result.current.setFilter(newFilter);
    });

    await waitFor(() => {
      // This will be true during the second fetch
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Check that fetch was called with the correct filter parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/search=editor/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/scope=tenant/)
    );
    // Page should be reset to 1
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/page=1/)
    );
  });
});
