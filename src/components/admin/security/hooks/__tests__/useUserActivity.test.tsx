import { renderHook, act } from '@testing-library/react-hooks';
import { useUserActivity } from '../useUserActivity';

// Utility function to wait for a condition to be true
const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> => {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeout) {
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  if (!condition()) {
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }
};

// Helper function to wait for loading to complete
async function waitForLoadingToComplete(result: any, timeout = 5000) {
  return waitForCondition(() => !result.current.isLoading, timeout);
}

// Mock the fetchUserActivity service
const mockFetchUserActivity = jest.fn();

describe('useUserActivity', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockFetchUserActivity.mockResolvedValue({
      activities: [
        { id: '1', userId: 'user-1', action: 'login', timestamp: new Date().toISOString() },
        { id: '2', userId: 'user-1', action: 'view', timestamp: new Date().toISOString() }
      ],
      hasMore: false
    });
  });

  it('initializes with default values', async () => {
    // Reset mock to ensure it doesn't affect this test
    mockFetchUserActivity.mockReset();

    // Create a new mock implementation that doesn't do anything
    const emptyMock = jest.fn().mockImplementation(() => {
      // Return a valid response that won't be used
      return Promise.resolve({
        activities: [],
        hasMore: false
      });
    });

    // Render the hook with autoFetch=false to prevent initial fetch
    const { result } = renderHook(() => useUserActivity({
      autoFetch: false,
      fetchService: emptyMock
    }));

    // Wait for any initial state updates
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check initial state
    expect(result.current.activities).toEqual([]);
    // With autoFetch=false, isLoading should be false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(false);
    expect(result.current.searchTerm).toBe('');
    expect(result.current.startDate).toBeNull();
    expect(result.current.endDate).toBeNull();
    expect(result.current.actionType).toBe('');

    // Verify the mock was not called
    expect(emptyMock).not.toHaveBeenCalled();
  });

  it('fetches activities on mount when autoFetch is true', async () => {
    // Reset mock to ensure accurate call count
    mockFetchUserActivity.mockClear();

    // Render the hook with autoFetch=true
    const { result } = renderHook(() => useUserActivity({
      autoFetch: true,
      fetchService: mockFetchUserActivity
    }));

    // Wait for any async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check that fetchUserActivity was called
    // Note: It's called twice because of the useEffect dependency on appliedFilters
    // This is expected behavior based on the hook implementation
    expect(mockFetchUserActivity).toHaveBeenCalledWith({
      userId: undefined,
      page: 1,
      pageSize: 10,
      searchTerm: '',
      startDate: null,
      endDate: null,
      actionType: ''
    });
  });

  it('updates activities when fetch is successful', async () => {
    // Mock activities
    const mockActivities = [
      { id: '1', userId: 'user-1', action: 'login', timestamp: new Date().toISOString() },
      { id: '2', userId: 'user-1', action: 'view', timestamp: new Date().toISOString() }
    ];

    // Reset mock and set up response
    mockFetchUserActivity.mockReset();
    mockFetchUserActivity.mockResolvedValue({
      activities: mockActivities,
      hasMore: true
    });

    // Render the hook
    const { result } = renderHook(() => useUserActivity({
      autoFetch: true,
      fetchService: mockFetchUserActivity
    }));

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Check that activities were updated
    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.hasMore).toBe(true);
  });

  it('handles errors during fetch', async () => {
    // Reset mock and set up error response
    mockFetchUserActivity.mockReset();
    mockFetchUserActivity.mockRejectedValue(new Error('Failed to fetch activities'));

    // Render the hook
    const { result } = renderHook(() => useUserActivity({
      autoFetch: true,
      fetchService: mockFetchUserActivity
    }));

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Check that error was set
    expect(result.current.error).toBe('Failed to fetch activities');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles search term changes', async () => {
    // Reset mock to ensure accurate call count
    mockFetchUserActivity.mockReset();
    mockFetchUserActivity.mockResolvedValue({
      activities: [],
      hasMore: false
    });

    // Render the hook
    const { result } = renderHook(() => useUserActivity({
      autoFetch: true,
      fetchService: mockFetchUserActivity
    }));

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Clear mock to focus on the search action
    mockFetchUserActivity.mockClear();

    // Update search term
    await act(async () => {
      result.current.setSearchTerm('test');
    });

    // Check that search term was updated
    expect(result.current.searchTerm).toBe('test');

    // Apply search
    await act(async () => {
      result.current.handleSearch();
    });

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Check that fetchUserActivity was called with the search term
    expect(mockFetchUserActivity).toHaveBeenCalledWith(expect.objectContaining({
      searchTerm: 'test'
    }));
  });

  it('handles filter changes', async () => {
    // Reset mock to ensure accurate call count
    mockFetchUserActivity.mockReset();
    mockFetchUserActivity.mockResolvedValue({
      activities: [],
      hasMore: false
    });

    // Render the hook
    const { result } = renderHook(() => useUserActivity({
      autoFetch: true,
      fetchService: mockFetchUserActivity
    }));

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Clear mock to focus on the filter action
    mockFetchUserActivity.mockClear();

    // Update filters
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');

    await act(async () => {
      result.current.setStartDate(startDate);
      result.current.setEndDate(endDate);
      result.current.setActionType('login');
    });

    // Check that filters were updated
    expect(result.current.startDate).toBe(startDate);
    expect(result.current.endDate).toBe(endDate);
    expect(result.current.actionType).toBe('login');

    // Apply filters
    await act(async () => {
      result.current.handleApplyFilters();
    });

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Check that fetchUserActivity was called with the filters
    expect(mockFetchUserActivity).toHaveBeenCalledWith(expect.objectContaining({
      startDate,
      endDate,
      actionType: 'login'
    }));
  });

  it('handles load more', async () => {
    // Mock initial activities
    const initialActivities = [
      { id: '1', userId: 'user-1', action: 'login', timestamp: new Date().toISOString() },
      { id: '2', userId: 'user-1', action: 'view', timestamp: new Date().toISOString() }
    ];

    // Mock additional activities
    const additionalActivities = [
      { id: '3', userId: 'user-1', action: 'logout', timestamp: new Date().toISOString() },
      { id: '4', userId: 'user-1', action: 'edit', timestamp: new Date().toISOString() }
    ];

    // Reset mock and set up responses
    mockFetchUserActivity.mockReset();
    mockFetchUserActivity.mockResolvedValueOnce({
      activities: initialActivities,
      hasMore: true
    });

    // Render the hook
    const { result } = renderHook(() => useUserActivity({
      autoFetch: true,
      fetchService: mockFetchUserActivity
    }));

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Check that activities were updated
    expect(result.current.activities).toEqual(initialActivities);
    expect(result.current.hasMore).toBe(true);

    // Mock fetchUserActivity to return additional activities
    mockFetchUserActivity.mockResolvedValueOnce({
      activities: additionalActivities,
      hasMore: false
    });

    // Load more
    await act(async () => {
      result.current.handleLoadMore();
    });

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Check that activities were appended
    expect(result.current.activities).toEqual([...initialActivities, ...additionalActivities]);
    expect(result.current.hasMore).toBe(false);

    // Check that fetchUserActivity was called with page=2
    expect(mockFetchUserActivity).toHaveBeenCalledWith(expect.objectContaining({
      page: 2
    }));
  });

  it('resets filters', async () => {
    // Reset mock to ensure accurate call count
    mockFetchUserActivity.mockReset();
    mockFetchUserActivity.mockResolvedValue({
      activities: [],
      hasMore: false
    });

    // Render the hook
    const { result } = renderHook(() => useUserActivity({
      autoFetch: true,
      fetchService: mockFetchUserActivity
    }));

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Update filters
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');

    await act(async () => {
      result.current.setSearchTerm('test');
      result.current.setStartDate(startDate);
      result.current.setEndDate(endDate);
      result.current.setActionType('login');
    });

    // Apply filters
    await act(async () => {
      result.current.handleApplyFilters();
    });

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Clear mock to focus on the reset action
    mockFetchUserActivity.mockClear();

    // Reset filters
    await act(async () => {
      result.current.resetFilters();
    });

    // Wait for loading to complete
    await waitForLoadingToComplete(result);

    // Check that filters were reset
    expect(result.current.searchTerm).toBe('');
    expect(result.current.startDate).toBeNull();
    expect(result.current.endDate).toBeNull();
    expect(result.current.actionType).toBe('');

    // Check that fetchUserActivity was called with reset filters
    expect(mockFetchUserActivity).toHaveBeenCalledWith(expect.objectContaining({
      searchTerm: '',
      startDate: null,
      endDate: null,
      actionType: ''
    }));
  });
});
