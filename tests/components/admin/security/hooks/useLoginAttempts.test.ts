/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useLoginAttempts } from '@/components/admin/security/hooks/useLoginAttempts';
import * as securityService from '@/services/securityService';
import { LoginAttempt } from '@/types/security';

// Mock the security service
jest.mock('@/services/securityService', () => ({
  fetchLoginAttempts: jest.fn(),
  blockIpAddress: jest.fn()
}));

describe('useLoginAttempts', () => {
  const mockFilter = {
    status: ['success', 'failure'],
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  };

  const mockLoginAttempts: LoginAttempt[] = [
    {
      id: '1',
      timestamp: '2023-06-01T10:00:00Z',
      username: 'user1@example.com',
      ipAddress: '192.168.1.1',
      status: 'success',
      ipRiskLevel: 'low',
      location: {
        city: 'New York',
        country: 'United States',
        lat: 40.7128,
        lng: -74.0060
      },
      userAgent: 'Mozilla/5.0',
      successful: true
    },
    {
      id: '2',
      timestamp: '2023-06-01T11:00:00Z',
      username: 'user2@example.com',
      ipAddress: '192.168.1.2',
      status: 'failure',
      ipRiskLevel: 'high',
      location: {
        city: 'London',
        country: 'United Kingdom',
        lat: 51.5074,
        lng: -0.1278
      },
      userAgent: 'Chrome/91.0',
      successful: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (securityService.fetchLoginAttempts as jest.Mock).mockResolvedValue(mockLoginAttempts);
    (securityService.blockIpAddress as jest.Mock).mockResolvedValue(undefined);
  });

  it('initializes with default values', () => {
    // Disable auto-fetch for this test
    const { result } = renderHook(() => useLoginAttempts({ autoFetch: false }));

    expect(result.current.loginAttempts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(false);
  });

  it('fetches login attempts successfully', async () => {
    // Disable auto-fetch for this test
    const { result, waitForNextUpdate } = renderHook(() => useLoginAttempts({
      initialFilter: mockFilter,
      autoFetch: false
    }));

    // Manually fetch login attempts
    act(() => {
      result.current.fetchLoginAttempts(mockFilter);
    });

    // Check that isLoading is true initially
    expect(result.current.isLoading).toBe(true);

    // Wait for the fetch to complete
    await waitForNextUpdate();

    // Check that the login attempts were loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.loginAttempts).toEqual(mockLoginAttempts);

    // Check that the API was called with the correct filter
    expect(securityService.fetchLoginAttempts).toHaveBeenCalledWith({
      ...mockFilter,
      page: 1,
      pageSize: 10
    });
  });

  it('loads more data when loadMore is called', async () => {
    // Mock additional data for the second page
    const secondPageData: LoginAttempt[] = [
      {
        id: '3',
        timestamp: '2023-06-01T12:00:00Z',
        username: 'user3@example.com',
        ipAddress: '192.168.1.3',
        status: 'success',
        ipRiskLevel: 'low',
        location: {
          city: 'London',
          country: 'United Kingdom',
          lat: 51.5074,
          lng: -0.1278
        },
        userAgent: 'Firefox/89.0',
        successful: true
      }
    ];

    // Set up the mock to return different data for the second page
    (securityService.fetchLoginAttempts as jest.Mock).mockImplementation((params) => {
      if (params.page === 1) {
        // Return exactly 10 items to trigger hasMore = true
        const fullPage = [];
        for (let i = 0; i < 10; i++) {
          fullPage.push({
            ...mockLoginAttempts[0],
            id: `item-${i}`,
            username: `user${i}@example.com`
          });
        }
        return Promise.resolve(fullPage);
      } else if (params.page === 2) {
        return Promise.resolve(secondPageData);
      }
      return Promise.resolve([]);
    });

    // Disable auto-fetch for this test
    const { result, waitForNextUpdate } = renderHook(() => useLoginAttempts({
      initialFilter: mockFilter,
      autoFetch: false
    }));

    // Manually fetch login attempts
    act(() => {
      result.current.fetchLoginAttempts(mockFilter);
    });

    // Wait for the initial fetch to complete
    await waitForNextUpdate();

    // Check that the initial data was loaded
    expect(result.current.loginAttempts.length).toBe(10); // We should have 10 items
    expect(result.current.hasMore).toBe(true);

    // Load more data
    act(() => {
      result.current.loadMore();
    });

    // Wait for the second fetch to complete
    await waitForNextUpdate();

    // Check that the new data was appended to the existing data
    expect(result.current.loginAttempts.length).toBe(11); // 10 from first page + 1 from second page

    // Check that the API was called with the correct page
    expect(securityService.fetchLoginAttempts).toHaveBeenCalledWith({
      ...mockFilter,
      page: 2,
      pageSize: 10
    });
  });

  it('handles API errors', async () => {
    // Mock an API error
    (securityService.fetchLoginAttempts as jest.Mock).mockRejectedValue(new Error('Internal server error'));

    // Disable auto-fetch for this test
    const { result, waitForNextUpdate } = renderHook(() => useLoginAttempts({
      initialFilter: mockFilter,
      autoFetch: false
    }));

    // Manually fetch login attempts
    act(() => {
      result.current.fetchLoginAttempts(mockFilter);
    });

    // Wait for the fetch to complete
    await waitForNextUpdate();

    // Check that the error was handled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Internal server error');
  });

  it('blocks an IP address successfully', async () => {
    // Disable auto-fetch for this test
    const { result, waitForNextUpdate } = renderHook(() => useLoginAttempts({
      initialFilter: mockFilter,
      autoFetch: false
    }));

    // Manually fetch login attempts first
    act(() => {
      result.current.fetchLoginAttempts(mockFilter);
    });

    // Wait for the fetch to complete
    await waitForNextUpdate();

    // Block an IP address
    let blockPromise: Promise<boolean>;
    act(() => {
      blockPromise = result.current.blockIp('192.168.1.1');
    });

    // Wait for the block operation to complete
    const success = await blockPromise;

    // Check that the operation was successful
    expect(success).toBe(true);

    // Check that the API was called with the correct IP
    expect(securityService.blockIpAddress).toHaveBeenCalledWith('192.168.1.1');
  });

  it('refreshes data when refresh is called', async () => {
    // Disable auto-fetch for this test
    const { result, waitForNextUpdate } = renderHook(() => useLoginAttempts({
      initialFilter: mockFilter,
      autoFetch: false
    }));

    // Manually fetch login attempts first
    act(() => {
      result.current.fetchLoginAttempts(mockFilter);
    });

    // Wait for the fetch to complete
    await waitForNextUpdate();

    // Check that the initial data was loaded
    expect(result.current.loginAttempts).toEqual(mockLoginAttempts);

    // Reset the mock to return different data
    const newData = [...mockLoginAttempts];
    newData[0] = { ...newData[0], status: 'blocked' };
    (securityService.fetchLoginAttempts as jest.Mock).mockResolvedValue(newData);

    // Refresh the data
    act(() => {
      result.current.refresh();
    });

    // Wait for the refresh to complete
    await waitForNextUpdate();

    // Check that the data was refreshed
    expect(result.current.loginAttempts).toEqual(newData);

    // Check that the API was called again with the same filter
    expect(securityService.fetchLoginAttempts).toHaveBeenCalledWith({
      ...mockFilter,
      page: 1,
      pageSize: 10
    });
  });
});
