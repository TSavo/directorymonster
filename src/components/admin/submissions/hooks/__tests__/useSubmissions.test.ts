/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSubmissions } from '../useSubmissions';
import { SubmissionStatus } from '@/types/submission';

// Mock fetch function
global.fetch = jest.fn();

describe('useSubmissions Hook', () => {
  const mockSubmissions = [
    {
      id: 'submission-1',
      siteId: 'site-1',
      tenantId: 'tenant-1',
      title: 'Test Submission 1',
      description: 'Test description 1',
      categoryIds: ['category-1'],
      status: SubmissionStatus.PENDING,
      userId: 'user-1',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'submission-2',
      siteId: 'site-1',
      tenantId: 'tenant-1',
      title: 'Test Submission 2',
      description: 'Test description 2',
      categoryIds: ['category-2'],
      status: SubmissionStatus.APPROVED,
      userId: 'user-2',
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
      json: async () => ({ submissions: [], pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 } })
    });

    const { result } = renderHook(() => useSubmissions({ autoFetch: false }));

    expect(result.current.submissions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination).toBeNull();
  });

  it('fetches submissions successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submissions: mockSubmissions, pagination: mockPagination })
    });

    const { result } = renderHook(() => useSubmissions());

    // Initial state
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After fetch
    expect(result.current.submissions).toEqual(mockSubmissions);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();

    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/submissions')
    );
  });

  it('fetches site-specific submissions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submissions: mockSubmissions, pagination: mockPagination })
    });

    const siteSlug = 'test-site';
    const { result } = renderHook(() => useSubmissions({ siteSlug }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/admin/sites/${siteSlug}/submissions`)
    );
  });

  it('handles fetch error', async () => {
    const errorMessage = 'Failed to fetch submissions';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useSubmissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.submissions).toEqual([]);
  });

  it('applies filters correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submissions: mockSubmissions, pagination: mockPagination })
    });

    const initialFilter = {
      search: 'test',
      status: [SubmissionStatus.PENDING],
      categoryIds: ['category-1'],
      fromDate: '2023-01-01',
      toDate: '2023-01-31'
    };

    const { result } = renderHook(() =>
      useSubmissions({ initialFilter, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that fetch was called with the correct URL and query parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/admin\/submissions\?.*search=test.*/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/status=pending/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/categoryId=category-1/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/fromDate=2023-01-01/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/toDate=2023-01-31/)
    );
  });

  it('updates page correctly', async () => {
    // First fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submissions: mockSubmissions, pagination: mockPagination })
    });

    const { result } = renderHook(() => useSubmissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Second fetch with new page
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        submissions: mockSubmissions,
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
      json: async () => ({ submissions: mockSubmissions, pagination: mockPagination })
    });

    const { result } = renderHook(() => useSubmissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Second fetch with new filter
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submissions: mockSubmissions, pagination: mockPagination })
    });

    const newFilter = {
      search: 'updated',
      status: [SubmissionStatus.APPROVED]
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
      expect.stringMatching(/search=updated/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/status=approved/)
    );
    // Page should be reset to 1
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/page=1/)
    );
  });
});
