import { renderHook, act } from '@testing-library/react-hooks';
import { useSecurityMetrics } from '../useSecurityMetrics';
import { SecurityMetrics } from '../../../../../types/security';

// Mock security metrics data
const mockSecurityMetrics: SecurityMetrics = {
  totalAttempts: 100,
  successfulAttempts: 70,
  failedAttempts: 30,
  blockedAttempts: 10,
  captchaRequiredCount: 15,
  highRiskIPs: 5
};

// Mock API function
const mockFetchSecurityMetrics = jest.fn();

describe('useSecurityMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSecurityMetrics.mockResolvedValue(mockSecurityMetrics);
  });

  test('should initialize with null metrics', () => {
    const { result } = renderHook(() => 
      useSecurityMetrics({ 
        autoFetch: false,
        fetchApi: mockFetchSecurityMetrics
      })
    );

    expect(result.current.metrics).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should fetch metrics on mount when autoFetch is true', async () => {
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';

    const { result, waitForNextUpdate } = renderHook(() => 
      useSecurityMetrics({ 
        startDate,
        endDate,
        autoFetch: true,
        fetchApi: mockFetchSecurityMetrics
      })
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitForNextUpdate();

    // After data is loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.metrics).toEqual(mockSecurityMetrics);
    expect(result.current.error).toBeNull();
    expect(mockFetchSecurityMetrics).toHaveBeenCalledTimes(1);
    expect(mockFetchSecurityMetrics).toHaveBeenCalledWith(startDate, endDate);
  });

  test('should handle API errors', async () => {
    const errorMessage = 'API error';
    mockFetchSecurityMetrics.mockRejectedValueOnce(new Error(errorMessage));

    const { result, waitForNextUpdate } = renderHook(() => 
      useSecurityMetrics({ 
        autoFetch: true,
        fetchApi: mockFetchSecurityMetrics
      })
    );

    // Wait for error
    await waitForNextUpdate();

    // After error
    expect(result.current.isLoading).toBe(false);
    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  test('should manually fetch metrics', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useSecurityMetrics({ 
        autoFetch: false,
        fetchApi: mockFetchSecurityMetrics
      })
    );

    // Manually fetch data
    act(() => {
      result.current.fetchMetrics();
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitForNextUpdate();

    // After data is loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.metrics).toEqual(mockSecurityMetrics);
    expect(result.current.error).toBeNull();
  });

  test('should fetch metrics with custom date range', async () => {
    const initialStartDate = '2023-01-01';
    const initialEndDate = '2023-01-31';
    const newStartDate = '2023-02-01';
    const newEndDate = '2023-02-28';

    const { result, waitForNextUpdate } = renderHook(() => 
      useSecurityMetrics({ 
        startDate: initialStartDate,
        endDate: initialEndDate,
        autoFetch: false,
        fetchApi: mockFetchSecurityMetrics
      })
    );

    // Manually fetch data with custom date range
    act(() => {
      result.current.fetchMetrics({
        startDate: newStartDate,
        endDate: newEndDate
      });
    });

    // Wait for data to load
    await waitForNextUpdate();

    // Verify API call with custom date range
    expect(mockFetchSecurityMetrics).toHaveBeenCalledWith(newStartDate, newEndDate);
  });

  test('should update when date range props change', async () => {
    const initialStartDate = '2023-01-01';
    const initialEndDate = '2023-01-31';
    const newStartDate = '2023-02-01';
    const newEndDate = '2023-02-28';

    // Setup mock to return different data for different date ranges
    mockFetchSecurityMetrics
      .mockImplementationOnce(() => Promise.resolve({ ...mockSecurityMetrics, totalAttempts: 100 }))
      .mockImplementationOnce(() => Promise.resolve({ ...mockSecurityMetrics, totalAttempts: 200 }));

    const { result, waitForNextUpdate, rerender } = renderHook(
      (props) => useSecurityMetrics(props),
      {
        initialProps: {
          startDate: initialStartDate,
          endDate: initialEndDate,
          autoFetch: true,
          fetchApi: mockFetchSecurityMetrics
        }
      }
    );

    // Wait for initial data load
    await waitForNextUpdate();

    // After initial data load
    expect(result.current.metrics?.totalAttempts).toBe(100);

    // Change date range
    rerender({
      startDate: newStartDate,
      endDate: newEndDate,
      autoFetch: true,
      fetchApi: mockFetchSecurityMetrics
    });

    // Wait for data to reload
    await waitForNextUpdate();

    // After data reload
    expect(result.current.metrics?.totalAttempts).toBe(200);
    expect(mockFetchSecurityMetrics).toHaveBeenCalledTimes(2);
    expect(mockFetchSecurityMetrics).toHaveBeenLastCalledWith(newStartDate, newEndDate);
  });
});
