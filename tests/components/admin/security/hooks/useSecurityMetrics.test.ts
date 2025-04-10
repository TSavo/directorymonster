/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useSecurityMetrics } from '@/components/admin/security/hooks/useSecurityMetrics';
import * as securityService from '@/services/securityService';

// Mock the security service
jest.mock('@/services/securityService', () => ({
  fetchSecurityMetrics: jest.fn(),
}));

describe('useSecurityMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default values', () => {
    // Disable auto-fetch for this test
    const { result } = renderHook(() => useSecurityMetrics({ autoFetch: false }));

    expect(result.current.metrics).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches metrics successfully', async () => {
    // Mock the API response
    const mockMetrics = {
      failedLoginAttempts: {
        current: 42,
        previous: 56
      },
      blockedIPs: {
        current: 12,
        previous: 8
      },
      suspiciousActivities: {
        current: 18,
        previous: 22
      },
      securityScore: {
        current: 87,
        previous: 82
      }
    };

    (securityService.fetchSecurityMetrics as jest.Mock).mockResolvedValue(mockMetrics);

    // Disable auto-fetch for this test
    const { result, waitForNextUpdate } = renderHook(() => useSecurityMetrics({ autoFetch: false }));

    // Fetch metrics manually
    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = result.current.fetchMetrics({
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      });
    });

    // Check that isLoading is true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for the fetch to complete
    await waitForNextUpdate();

    // Check that the metrics were loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.metrics).toEqual(mockMetrics);

    // Verify the API was called
    expect(securityService.fetchSecurityMetrics).toHaveBeenCalledWith('2023-01-01', '2023-12-31');
  });

  it('handles API errors', async () => {
    // Mock console.error to prevent error messages in tests
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock the API to throw an error
    const errorMessage = 'Failed to fetch security metrics';
    (securityService.fetchSecurityMetrics as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Disable auto-fetch for this test
    const { result, waitForNextUpdate } = renderHook(() => useSecurityMetrics({ autoFetch: false }));

    // Force an error
    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = result.current.fetchMetrics({
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      });
    });

    // Check that isLoading is true
    expect(result.current.isLoading).toBe(true);

    // Wait for the fetch to complete
    await waitForNextUpdate();

    // Check that the error was handled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.metrics).toBeNull();

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('updates when date range changes', async () => {
    // Mock the API responses
    const mockMetrics1 = {
      failedLoginAttempts: {
        current: 42,
        previous: 56
      },
      blockedIPs: {
        current: 12,
        previous: 8
      },
      suspiciousActivities: {
        current: 18,
        previous: 22
      },
      securityScore: {
        current: 87,
        previous: 82
      }
    };

    const mockMetrics2 = {
      failedLoginAttempts: {
        current: 30,
        previous: 40
      },
      blockedIPs: {
        current: 10,
        previous: 5
      },
      suspiciousActivities: {
        current: 15,
        previous: 20
      },
      securityScore: {
        current: 90,
        previous: 85
      }
    };

    // Set up the mock to return different values based on parameters
    (securityService.fetchSecurityMetrics as jest.Mock).mockImplementation((startDate, endDate) => {
      if (startDate === '2023-01-01' && endDate === '2023-01-31') {
        return Promise.resolve(mockMetrics1);
      } else if (startDate === '2023-02-01' && endDate === '2023-02-28') {
        return Promise.resolve(mockMetrics2);
      }
      return Promise.resolve({});
    });

    // Render the hook with initial date range
    const { result, waitForNextUpdate, rerender } = renderHook(
      (props) => useSecurityMetrics(props),
      { initialProps: { startDate: '2023-01-01', endDate: '2023-01-31', autoFetch: true } }
    );

    // Wait for the initial fetch to complete
    await waitForNextUpdate();

    // Initial data should be loaded or still loading
    if (!result.current.isLoading) {
      expect(result.current.metrics).toEqual(mockMetrics1);
    }

    // Change date range
    rerender({ startDate: '2023-02-01', endDate: '2023-02-28', autoFetch: true });

    // Wait for the fetch with new date range to complete
    await waitForNextUpdate();

    // Check that the metrics were updated
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.metrics).toEqual(mockMetrics2);

    // Verify the API was called with the new date range
    expect(securityService.fetchSecurityMetrics).toHaveBeenCalledWith('2023-02-01', '2023-02-28');
  });
});
