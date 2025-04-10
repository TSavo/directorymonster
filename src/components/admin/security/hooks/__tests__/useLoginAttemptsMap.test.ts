import { renderHook, act } from '@testing-library/react-hooks';
import { useLoginAttemptsMap } from '../useLoginAttemptsMap';

// Utility functions for async hook testing
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

const waitForLoadingToComplete = async <T extends { isLoading: boolean }>(
  result: { current: T },
  timeout = 5000
): Promise<void> => {
  return waitForCondition(() => !result.current.isLoading, timeout);
};

const waitForHookToUpdate = async <T>(
  result: { current: T },
  predicate: (result: T) => boolean,
  timeout = 5000
): Promise<void> => {
  return waitForCondition(() => predicate(result.current), timeout);
};

// Mock fetch
global.fetch = jest.fn();

describe('useLoginAttemptsMap', () => {
  // Increase timeout for all tests in this suite
  jest.setTimeout(30000);
  const mockMapData = [
    {
      id: '1',
      latitude: 40.7128,
      longitude: -74.0060,
      count: 5,
      successCount: 3,
      failedCount: 2,
      ipRiskLevel: 'low',
      location: 'New York, United States'
    },
    {
      id: '2',
      latitude: 43.6532,
      longitude: -79.3832,
      count: 10,
      successCount: 2,
      failedCount: 8,
      ipRiskLevel: 'high',
      location: 'Toronto, Canada'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches map data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ mapData: mockMapData })
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useLoginAttemptsMap({
        filter: {
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        }
      })
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.mapData).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for the hook to update
    await waitForNextUpdate();

    // After data is loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mapData).toEqual(mockMapData);
    expect(result.current.error).toBeNull();

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/security/login-attempts-map?startDate=2023-01-01&endDate=2023-01-31',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });

  test('handles API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValueOnce({
        error: 'Internal server error'
      })
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useLoginAttemptsMap({})
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to update
    await waitForNextUpdate();

    // After error
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mapData).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Internal server error');
  });

  test('refreshes data when refresh is called', async () => {
    const updatedMapData = [
      {
        id: '3',
        latitude: 51.5074,
        longitude: -0.1278,
        count: 8,
        successCount: 6,
        failedCount: 2,
        ipRiskLevel: 'medium',
        location: 'London, United Kingdom'
      }
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ mapData: mockMapData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ mapData: updatedMapData })
      });

    const { result, waitForNextUpdate } = renderHook(() =>
      useLoginAttemptsMap({})
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to update
    await waitForNextUpdate();

    // Initial data loaded
    expect(result.current.mapData).toEqual(mockMapData);

    // Call refresh
    act(() => {
      result.current.refresh();
    });

    // Should be loading again
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to update again
    await waitForNextUpdate();

    // Updated data
    expect(result.current.mapData).toEqual(updatedMapData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('applies filters correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ mapData: mockMapData })
    });

    const filter = {
      status: ['success'],
      ipRiskLevel: ['high'],
      userId: 'user1',
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    const { result, waitForNextUpdate } = renderHook(() =>
      useLoginAttemptsMap({ filter })
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to update
    await waitForNextUpdate();

    // Verify API call with filters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/security/login-attempts-map'),
      expect.anything()
    );

    const url = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('status=success');
    expect(url).toContain('ipRiskLevel=high');
    expect(url).toContain('userId=user1');
    expect(url).toContain('startDate=2023-01-01');
    expect(url).toContain('endDate=2023-01-31');
  });

  test('updates when filter changes', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ mapData: mockMapData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          mapData: [mockMapData[0]]
        })
      });

    const { result, waitForNextUpdate, rerender } = renderHook(
      (props) => useLoginAttemptsMap(props),
      {
        initialProps: {
          filter: {
            startDate: '2023-01-01',
            endDate: '2023-01-31'
          }
        }
      }
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to update
    await waitForNextUpdate();

    // Initial data loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mapData.length).toBeGreaterThan(0);
    expect(result.current.mapData[0]).toEqual(mockMapData[0]);

    // Change filter
    rerender({
      filter: {
        status: ['success'],
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      }
    });

    // Should be loading again
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to update again
    await waitForNextUpdate();

    // Verify API call was made
    expect(global.fetch).toHaveBeenCalled();

    // Find the call that contains the status filter
    const calls = (global.fetch as jest.Mock).mock.calls;
    const statusFilterCall = calls.find(call =>
      typeof call[0] === 'string' && call[0].includes('status=success')
    );

    // Verify a call with the status filter was made
    expect(statusFilterCall).toBeDefined();

    // Verify the data is as expected - we should have at least one map data point
    expect(result.current.mapData.length).toBeGreaterThan(0);
  });

  test('handles network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useLoginAttemptsMap({})
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to update
    await waitForNextUpdate();

    // After error
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mapData).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });
});
